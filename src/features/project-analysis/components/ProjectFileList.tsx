import React, { useRef } from 'react';
import { FileCode2, FolderSearch, FolderUp, Square, Trash2, X } from 'lucide-react';
import type { ProjectFile } from '../types';
import Button from '../../../components/ui/Button';
import { PROJECT_FILE_ACCEPT } from '../hooks/useProjectFiles';

interface ProjectFileListProps {
  files: ProjectFile[];
  error: string | null;
  isDark: boolean;
  selectedFileId: string | null;
  onAddFiles: (files: FileList) => void;
  onSelect: (file: ProjectFile) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

const ProjectFileList: React.FC<ProjectFileListProps> = ({ files, error, isDark, selectedFileId, onAddFiles, onSelect, onRemove, onClear, isAnalyzing, onAnalyze, onCancel, children }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const surface = isDark ? 'border-white/10 bg-white/[0.02]' : 'border-black/10 bg-white/70';
  const muted = isDark ? 'text-neutral-500' : 'text-neutral-500';

  return (
    <section className={`rounded-3xl border p-4 sm:p-5 ${surface}`}>
      <div className="flex items-center justify-between gap-3 text-left">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Project files</p>
          <p className={`mt-1 text-xs ${muted}`}>{files.length ? `${files.length} file${files.length === 1 ? '' : 's'} loaded` : 'Upload files to prepare a project analysis'}</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={inputRef} type="file" accept={PROJECT_FILE_ACCEPT} multiple hidden onChange={(event) => { if (event.target.files) onAddFiles(event.target.files); event.target.value = ''; }} />
          <Button variant="secondary" size="sm" isDark={isDark} onClick={() => inputRef.current?.click()} title="Add project files"><FolderUp className="w-3.5 h-3.5" /><span className="hidden sm:inline">Add files</span></Button>
          {isAnalyzing ? <Button variant="secondary" size="sm" isDark={isDark} onClick={onCancel}><Square className="h-3.5 w-3.5" /><span className="hidden sm:inline">Stop</span></Button> : <Button variant="primary" size="sm" isDark={isDark} onClick={onAnalyze} disabled={files.length === 0}><FolderSearch className="h-3.5 w-3.5" /><span className="hidden sm:inline">Analyze</span></Button>}
          {files.length > 0 && <Button variant="secondary" size="sm" isDark={isDark} onClick={onClear} title="Clear project files"><X className="w-3.5 h-3.5" /></Button>}
        </div>
      </div>
      {error && <p className={`mt-3 rounded-xl border p-3 text-xs ${isDark ? 'border-rose-500/20 bg-rose-500/[0.06] text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{error}</p>}
      {files.length > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {files.map((file) => <div key={file.id} className={`flex items-center gap-2 rounded-xl border p-2.5 ${file.id === selectedFileId ? isDark ? 'border-white/25 bg-white/[0.08]' : 'border-black/20 bg-black/[0.04]' : isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
          <button type="button" onClick={() => onSelect(file)} className="flex min-w-0 flex-1 items-center gap-2 text-left"><FileCode2 className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} /><span className="min-w-0 truncate text-xs font-medium">{file.path}</span></button>
          <button type="button" onClick={() => onRemove(file.id)} className={`shrink-0 rounded-md p-1 ${isDark ? 'text-neutral-500 hover:bg-white/10 hover:text-white' : 'text-neutral-400 hover:bg-black/10 hover:text-black'}`} title="Remove file"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>)}
      </div>}
      {children}
    </section>
  );
};

export default ProjectFileList;
