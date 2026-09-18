import { useCallback, useEffect, useState } from 'react';
import { detectLanguage } from '../../../lib/detector';
import type { ProjectFile } from '../types';

const MAX_FILE_SIZE = 512 * 1024;
const MAX_FILES = 50;
const IGNORED_PARTS = ['node_modules', '.git', 'dist', 'build'];
export const PROJECT_FILE_ACCEPT = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cs', '.cpp', '.h', '.hpp',
  '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.css', '.html', '.sql',
  '.sh', '.ps1', '.json', '.yaml', '.yml', '.xml', '.toml', '.md', '.txt',
].join(',');

const ALLOWED_EXTENSIONS = new Set(PROJECT_FILE_ACCEPT.split(','));

function getStorageKey(userId: string) {
  return `codesense_project_files_${userId}`;
}

function readStoredFiles(userId: string): ProjectFile[] {
  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    if (stored) return JSON.parse(stored) as ProjectFile[];
  } catch {
    // Continue with an empty project when storage is unavailable or malformed.
  }
  return [];
}

function isSupportedFile(file: File) {
  const normalizedPath = file.webkitRelativePath.toLowerCase();
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.has(extension) && !IGNORED_PARTS.some((part) => normalizedPath.includes(`/${part}/`) || file.name === part);
}

function toProjectFile(file: File): Promise<ProjectFile> {
  return file.text().then((content) => ({
    id: `${file.webkitRelativePath || file.name}:${file.size}:${file.lastModified}`,
    name: file.name,
    path: file.webkitRelativePath || file.name,
    content,
    language: detectLanguage(content),
    size: file.size,
  }));
}

export function useProjectFiles(userId = 'anonymous') {
  const [files, setFiles] = useState<ProjectFile[]>(() => readStoredFiles(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (files.length) localStorage.setItem(getStorageKey(userId), JSON.stringify(files));
      else localStorage.removeItem(getStorageKey(userId));
    } catch {
      setError('Project files could not be saved locally. Continue with a smaller project or clear browser storage.');
    }
  }, [files, userId]);

  const addFiles = useCallback(async (incoming: FileList | File[]) => {
    setError(null);
    const incomingFiles = Array.from(incoming);
    const rejected = incomingFiles.filter((file) => !isSupportedFile(file));
    const candidates = incomingFiles.filter(isSupportedFile);
    if (rejected.length) {
      setError(`${rejected.map((file) => file.name).join(', ')} ${rejected.length === 1 ? 'is' : 'are'} not supported. Upload source files, Markdown, or text configuration files.`);
    }
    if (!candidates.length) return;
    const oversized = candidates.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(`${oversized.name} is larger than 512 KB and was not added.`);
      return;
    }
    if (candidates.length > MAX_FILES) {
      setError(`Select no more than ${MAX_FILES} files at a time.`);
      return;
    }

    const nextFiles = await Promise.all(candidates.map(toProjectFile));
    setFiles((current) => {
      const merged = [...current, ...nextFiles];
      return merged.filter((file, index, all) => all.findIndex((item) => item.id === file.id) === index);
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((current) => current.filter((file) => file.id !== id));
  }, []);

  const updateFile = useCallback((id: string, content: string) => {
    setFiles((current) => current.map((file) => file.id === id ? { ...file, content, language: detectLanguage(content), size: new Blob([content]).size } : file));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  return { files, error, addFiles, removeFile, updateFile, clearFiles };
}
