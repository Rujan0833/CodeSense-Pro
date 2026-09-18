import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, FileCode2, GitBranch, Link2, Lock, LogOut, RefreshCw, Search, ShieldCheck, Unlink, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { IosSpinner } from '../../../components/LoadingSpinner';
import { useGitHubPullRequestFiles, useGitHubPullRequests, useGitHubRepositories } from '../hooks/useGitHub';
import { useCodeAnalysis } from '../../../hooks/useCodeAnalysis';
import type { AnalysisRequest } from '../../../types/analysis';
import PullRequestAnalysisModal from '../components/PullRequestAnalysisModal';
import { useGitHubReviewHistory } from '../../../hooks/useAnalysisHistory';
import { githubRoutes } from '../routes';

interface GitHubAccount {
  id: string;
  username: string;
  scopes: string;
  connectedAt: string;
}

interface GitHubStatus {
  configured: boolean;
  connected: boolean;
  reconnectRequired?: boolean;
  account: GitHubAccount | null;
}

interface GitHubPageProps {
  isDark: boolean;
  onNavigateStudio: () => void;
}

const GitHubPage: React.FC<GitHubPageProps> = ({ isDark, onNavigateStudio }) => {
  const { token, logout } = useAuth();
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repositorySearch, setRepositorySearch] = useState('');
  const [selectedRepository, setSelectedRepository] = useState<string | null>(null);
  const [selectedPullNumber, setSelectedPullNumber] = useState<number | null>(null);
  const [selectedFileSha, setSelectedFileSha] = useState<string | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [postCommentError, setPostCommentError] = useState<string | null>(null);
  const [postCommentSuccess, setPostCommentSuccess] = useState<string | null>(null);
  const { repositories, isLoading: isRepositoriesLoading, error: repositoriesError, reload: reloadRepositories } = useGitHubRepositories(token, Boolean(status?.connected));
  const { pullRequests, isLoading: isPullRequestsLoading, error: pullRequestsError, reload: reloadPullRequests } = useGitHubPullRequests(token, selectedRepository);
  const { files, isLoading: isFilesLoading, error: filesError, reload: reloadFiles } = useGitHubPullRequestFiles(token, selectedRepository, selectedPullNumber);
  const { mutate: analyzeCode, data: reviewAnalysis, isPending: isReviewing, error: reviewMutationError, reset: resetReview } = useCodeAnalysis();
  const { saveReview } = useGitHubReviewHistory(token);

  const loadStatus = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(githubRoutes.status, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load GitHub status.');
      setStatus(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load GitHub status.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleConnect = async () => {
    if (!token) return;
    setError(null);
    setIsWorking(true);
    try {
      const response = await fetch('/api/github/connect', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not start GitHub connection.');
      window.location.assign(data.authorizationUrl);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not start GitHub connection.');
      setIsWorking(false);
    }
  };

  const handleDisconnect = async () => {
    if (!token) return;
    setError(null);
    setIsWorking(true);
    try {
      const response = await fetch('/api/github/connection', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not disconnect GitHub.');
      setStatus((current) => current ? { ...current, connected: false, account: null } : current);
      setRepositorySearch('');
      setSelectedRepository(null);
      setSelectedPullNumber(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not disconnect GitHub.');
    } finally {
      setIsWorking(false);
    }
  };

  const filteredRepositories = repositories.filter((repository) => {
    const query = repositorySearch.trim().toLowerCase();
    return !query || repository.fullName.toLowerCase().includes(query) || repository.description?.toLowerCase().includes(query);
  });
  const selectedFile = files.find((file) => file.sha === selectedFileSha) || null;

  const getLanguage = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (extension === 'ts' || extension === 'tsx') return 'typescript';
    if (extension === 'py') return 'python';
    if (extension === 'java') return 'java';
    if (extension === 'go') return 'go';
    if (extension === 'rs') return 'rust';
    if (extension === 'css') return 'css';
    return 'javascript';
  };

  const handleReviewChanges = () => {
    const selectedFile = files.find((file) => file.sha === selectedFileSha);
    if (!selectedFile?.patch) {
      setReviewError('No reviewable code patches were returned for this pull request.');
      return;
    }

    const language = getLanguage(selectedFile.filename);
    const patchContent = `File: ${selectedFile.filename}\nStatus: ${selectedFile.status}\n\n${selectedFile.patch}`;
    setReviewError(null);
    setPostCommentError(null);
    setPostCommentSuccess(null);
    analyzeCode({ code: patchContent, language } as AnalysisRequest, {
      onSuccess: (analysis) => {
        if (selectedRepository && selectedPullNumber && selectedFile) {
          saveReview.mutate({
            repository: selectedRepository,
            pullNumber: selectedPullNumber,
            filename: selectedFile.filename,
            code: patchContent,
            analysis,
          });
        }
        setIsAnalysisModalOpen(true);
      },
    });
  };

  const handlePostComment = async (comment: string) => {
    if (!token || !selectedRepository || !selectedPullNumber) return;
    setIsPostingComment(true);
    setPostCommentError(null);
    setPostCommentSuccess(null);
    try {
      const response = await fetch(githubRoutes.pullRequestComment, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ repository: selectedRepository, pullNumber: selectedPullNumber, comment }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not post the review comment to GitHub.');
      setPostCommentSuccess('Review posted to GitHub successfully.');
    } catch (requestError) {
      setPostCommentError(requestError instanceof Error ? requestError.message : 'Could not post the review comment to GitHub.');
    } finally {
      setIsPostingComment(false);
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      isDark ? 'bg-[#050508] text-neutral-100' : 'bg-[#f5f5f7] text-[#1d1d1f]'
    }`}>
      <header className={`sticky top-0 z-40 backdrop-blur-2xl border-b ${
        isDark ? 'bg-[#050508]/80 border-white/[0.08]' : 'bg-[#f5f5f7]/85 border-black/[0.08]'
      }`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onNavigateStudio} className={`p-2 rounded-xl border cursor-pointer ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'}`} title="Back to Studio">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <GitBranch className="w-5 h-5 shrink-0" />
            <span className="font-semibold truncate">GitHub Integration</span>
          </div>

          {/* Connection controls inline in header */}
          <div className="flex items-center gap-3">
            {!isLoading && status && (
              <>
                {status.connected ? (
                  <>
                    <div className={`hidden sm:flex items-center gap-2 text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Token server-side</span>
                    </div>
                    <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {status.account?.username}
                    </div>
                    <Button variant="secondary" size="sm" isDark={isDark} onClick={handleDisconnect} disabled={isWorking}>
                      <Unlink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Disconnect</span>
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" size="sm" isDark={isDark} onClick={handleConnect} disabled={isWorking || !status.configured}>
                    <Link2 className="w-3.5 h-3.5" />
                    Connect GitHub
                  </Button>
                )}
              </>
            )}
            <button
              onClick={async () => { await logout(); onNavigateStudio(); }}
              className={`p-2 rounded-xl border cursor-pointer ${isDark ? 'border-white/10 text-neutral-400 hover:text-white' : 'border-black/10 text-neutral-600 hover:text-black'}`}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="github-main max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-6 sm:py-8 space-y-8">
        {/* Page title */}
        <div className="space-y-3.5 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm">
            <span className={`uppercase tracking-widest font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
              GitHub Workspace
            </span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>
              Browse repositories, review pull requests, and inspect changed files
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><IosSpinner size={28} className={isDark ? 'text-white' : 'text-neutral-800'} /></div>
        ) : !status?.connected ? (
          /* Not-connected state: centered card */
          <div className="max-w-lg mx-auto space-y-5">
            <Card isDark={isDark} tiltEnabled={false} className={`flex flex-col items-center text-center p-8 sm:p-10 space-y-5 ${
              isDark ? 'bg-[#09090e]/90 border-white/10' : 'bg-white/90 border-black/10'
            }`}>
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${
                isDark ? 'bg-white/[0.06] border-white/10' : 'bg-black/[0.04] border-black/10'
              }`}>
                <GitBranch className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{status?.reconnectRequired ? 'Reconnect your GitHub account' : 'Connect your GitHub account'}</h2>
                <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {status?.reconnectRequired
                    ? 'GitHub rejected the saved authorization. Reconnect to restore repository access. Your CodeSense account is still signed in.'
                    : 'Start with a secure OAuth connection. Your repositories and pull requests will appear once connected.'}
                </p>
              </div>

              {!status?.configured && (
                <div className={`w-full rounded-2xl border p-4 text-sm leading-relaxed text-left ${isDark ? 'border-amber-500/20 bg-amber-500/[0.06] text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
                  GitHub OAuth is not configured yet. Add <code>GITHUB_CLIENT_ID</code>, <code>GITHUB_CLIENT_SECRET</code>, and optionally <code>GITHUB_CALLBACK_URL</code> to the server environment.
                </div>
              )}

              {error && (
                <div className={`w-full rounded-2xl border p-4 text-sm text-left ${isDark ? 'border-rose-500/20 bg-rose-500/[0.06] text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                  {error}
                </div>
              )}

              <Button variant="primary" size="lg" isDark={isDark} onClick={handleConnect} disabled={isWorking || !status?.configured} className="px-8">
                <Link2 className="w-4 h-4" />
                Connect GitHub
              </Button>
              <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Token stays server-side — never exposed to the browser
              </div>
            </Card>
          </div>
        ) : (
          /* Connected state: two-panel grid */
          <>
            {error && (
              <div className={`rounded-2xl border p-4 text-sm ${isDark ? 'border-rose-500/20 bg-rose-500/[0.06] text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Repositories (5 cols) */}
              <div className="flex flex-col space-y-5 lg:col-span-5">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2.5">
                    <h2 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      Repositories
                    </h2>
                    <Badge variant="default" isDark={isDark}>
                      {repositories.length}
                    </Badge>
                  </div>
                  <Button variant="secondary" size="sm" isDark={isDark} onClick={() => void reloadRepositories()} disabled={isRepositoriesLoading} title="Refresh repositories">
                    <RefreshCw className={`w-3.5 h-3.5 ${isRepositoriesLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                <Card isDark={isDark} tiltEnabled={false} className={`github-panel-card p-5 sm:p-6 rounded-3xl ${
                  isDark ? 'bg-[#09090e]/90 border-white/10' : 'bg-white/90 border-black/10'
                }`}>
                  {/* Search bar (sticky header inside card) */}
                  <div className={`relative rounded-xl border mb-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-black/10 bg-black/[0.02]'}`}>
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} />
                    <input
                      value={repositorySearch}
                      onChange={(event) => setRepositorySearch(event.target.value)}
                      placeholder="Search repositories..."
                      className={`w-full rounded-xl bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none ${isDark ? 'text-white placeholder:text-neutral-600' : 'text-neutral-900 placeholder:text-neutral-400'}`}
                    />
                  </div>

                  {/* Scrollable body */}
                  <div className="github-panel-body space-y-2">
                    {isRepositoriesLoading ? (
                      <div className="flex justify-center py-8"><IosSpinner size={24} className={isDark ? 'text-white' : 'text-neutral-800'} /></div>
                    ) : repositoriesError ? (
                      <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-rose-500/20 bg-rose-500/[0.06] text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <span>{repositoriesError}</span>
                          <Button variant="secondary" size="sm" isDark={isDark} onClick={() => void reloadRepositories()}>Retry</Button>
                        </div>
                      </div>
                    ) : filteredRepositories.length === 0 ? (
                      <div className={`rounded-xl border p-6 text-center text-sm ${isDark ? 'border-white/[0.08] text-neutral-500' : 'border-black/[0.08] text-neutral-500'}`}>
                        {repositories.length === 0 ? 'No repositories were returned for this GitHub account.' : 'No repositories match your search.'}
                      </div>
                    ) : (
                      filteredRepositories.map((repository) => (
                        <a
                          key={repository.id}
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            setSelectedRepository(repository.fullName);
                            setSelectedPullNumber(null);
                            setIsAnalysisModalOpen(false);
                            setSelectedFileSha(null);
                            setPostCommentError(null);
                            setPostCommentSuccess(null);
                            resetReview();
                          }}
                          className={`block rounded-2xl border p-4 transition-all duration-200 ${
                            selectedRepository === repository.fullName
                              ? isDark
                                ? 'border-white/20 bg-white/[0.06] shadow-[0_0_20px_rgba(255,255,255,0.04)]'
                                : 'border-black/20 bg-black/[0.03] shadow-[0_4px_12px_rgba(0,0,0,0.06)]'
                              : isDark
                                ? 'border-white/[0.08] hover:bg-white/[0.04]'
                                : 'border-black/[0.08] hover:bg-black/[0.03]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-2 text-sm font-semibold truncate">
                              {repository.private && <Lock className="w-3.5 h-3.5 shrink-0 text-amber-500" />}
                              {repository.fullName}
                            </span>
                            <span className={`shrink-0 text-[10px] font-mono ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{repository.defaultBranch}</span>
                          </div>
                          {repository.description && <p className={`mt-2 text-xs line-clamp-2 ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>{repository.description}</p>}
                        </a>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Right Column: Pull Requests (7 cols) */}
              <div className="flex flex-col space-y-5 lg:col-span-7">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2.5">
                    <h2 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      Pull Requests
                    </h2>
                    <Badge variant={selectedRepository ? 'success' : 'default'} isDark={isDark}>
                      {selectedRepository ? pullRequests.length : 'Standby'}
                    </Badge>
                  </div>
                  {selectedRepository && (
                    <Button variant="secondary" size="sm" isDark={isDark} onClick={() => { setSelectedRepository(null); setSelectedPullNumber(null); setSelectedFileSha(null); setPostCommentError(null); setPostCommentSuccess(null); }} title="Deselect repository">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>

                <Card isDark={isDark} tiltEnabled={false} className={`github-panel-card p-5 sm:p-6 rounded-3xl ${
                  isDark ? 'bg-[#09090e]/90 border-white/10' : 'bg-white/90 border-black/10'
                }`}>
                  <div className="github-panel-body space-y-4">
                    {!selectedRepository ? (
                      <div className={`flex min-h-[28rem] items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm ${isDark ? 'border-white/10 text-neutral-500' : 'border-black/10 text-neutral-500'}`}>
                        Select a repository to view its open pull requests.
                      </div>
                    ) : (
                      <>
                        {/* Repository context */}
                        <div className={`flex items-center gap-2 px-1 pb-2 border-b text-xs ${isDark ? 'border-white/[0.08] text-neutral-400' : 'border-black/[0.08] text-neutral-500'}`}>
                          <GitBranch className="w-3.5 h-3.5" />
                          <span className="font-medium truncate">{selectedRepository}</span>
                        </div>

                        {/* PR list */}
                        {isPullRequestsLoading ? (
                          <div className="flex justify-center py-8"><IosSpinner size={24} className={isDark ? 'text-white' : 'text-neutral-800'} /></div>
                        ) : pullRequestsError ? (
                          <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-rose-500/20 bg-rose-500/[0.06] text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                            <div className="flex items-center justify-between gap-3">
                              <span>{pullRequestsError}</span>
                              <Button variant="secondary" size="sm" isDark={isDark} onClick={() => void reloadPullRequests()}>Retry</Button>
                            </div>
                          </div>
                        ) : pullRequests.length === 0 ? (
                          <div className={`rounded-xl border p-6 text-center text-sm ${isDark ? 'border-white/[0.08] text-neutral-500' : 'border-black/[0.08] text-neutral-500'}`}>
                            No open pull requests in this repository.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {pullRequests.map((pullRequest) => (
                              <button
                                key={pullRequest.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPullNumber(pullRequest.number);
                                  setSelectedFileSha(null);
                                  setIsAnalysisModalOpen(false);
                                  setReviewError(null);
                                  setPostCommentError(null);
                                  setPostCommentSuccess(null);
                                  resetReview();
                                }}
                                className={`w-full text-left block rounded-2xl border p-4 transition-all duration-200 ${
                                  selectedPullNumber === pullRequest.number
                                    ? isDark
                                      ? 'border-white/20 bg-white/[0.06]'
                                      : 'border-black/20 bg-black/[0.03]'
                                    : isDark
                                      ? 'border-white/[0.08] hover:bg-white/[0.04]'
                                      : 'border-black/[0.08] hover:bg-black/[0.03]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold">#{pullRequest.number} {pullRequest.title}</p>
                                    <p className={`mt-2 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-600'}`}>
                                      {pullRequest.author} · {pullRequest.sourceBranch} → {pullRequest.targetBranch}
                                    </p>
                                  </div>
                                  <Badge variant={pullRequest.draft ? 'warning' : 'success'} isDark={isDark}>
                                    {pullRequest.draft ? 'Draft' : 'Open'}
                                  </Badge>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Changed files section */}
                        {selectedPullNumber && !isAnalysisModalOpen && (
                          <div className={`space-y-4 border-t pt-5 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h3 className="text-sm font-semibold">Changed files</h3>
                                <p className={`mt-1 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                                  Pull request #{selectedPullNumber}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="secondary" size="sm" isDark={isDark} onClick={() => void reloadFiles()} disabled={isFilesLoading} title="Refresh changed files">
                                  <RefreshCw className={`w-3.5 h-3.5 ${isFilesLoading ? 'animate-spin' : ''}`} />
                                </Button>
                                <Button variant="primary" size="sm" isDark={isDark} onClick={handleReviewChanges} disabled={isFilesLoading || isReviewing || !selectedFileSha}>
                                  {isReviewing ? 'Reviewing...' : 'Analyze selected file'}
                                </Button>
                              </div>
                            </div>

                            {isFilesLoading ? (
                              <div className="flex justify-center py-8"><IosSpinner size={24} className={isDark ? 'text-white' : 'text-neutral-800'} /></div>
                            ) : filesError ? (
                              <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-rose-500/20 bg-rose-500/[0.06] text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                                <div className="flex items-center justify-between gap-3">
                                  <span>{filesError}</span>
                                  <Button variant="secondary" size="sm" isDark={isDark} onClick={() => void reloadFiles()}>Retry</Button>
                                </div>
                              </div>
                            ) : files.length === 0 ? (
                              <div className={`rounded-xl border p-6 text-center text-sm ${isDark ? 'border-white/[0.08] text-neutral-500' : 'border-black/[0.08] text-neutral-500'}`}>
                                No changed files were returned for this pull request.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {files.map((file) => (
                                  <details key={file.sha} onClick={() => { setSelectedFileSha(file.sha); setReviewError(null); setPostCommentError(null); setPostCommentSuccess(null); resetReview(); setIsAnalysisModalOpen(false); }} className={`rounded-2xl border ${selectedFileSha === file.sha ? isDark ? 'border-white/25 bg-white/[0.06]' : 'border-black/20 bg-black/[0.04]' : isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.01]'}`}>
                                    <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                                      <FileCode2 className={`w-4 h-4 shrink-0 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
                                      <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold">{file.filename}</span>
                                      <span className="shrink-0 text-xs font-mono text-emerald-500">+{file.additions}</span>
                                      <span className="shrink-0 text-xs font-mono text-rose-500">-{file.deletions}</span>
                                      <Badge variant={file.status === 'removed' ? 'error' : file.status === 'added' ? 'success' : 'default'} isDark={isDark}>{file.status}</Badge>
                                    </summary>
                                    {file.patch && (
                                      <pre className={`mx-4 mb-4 overflow-x-auto rounded-xl border p-3 text-[11px] leading-relaxed ${isDark ? 'border-white/[0.06] bg-[#07070a] text-neutral-300' : 'border-black/[0.06] bg-[#f4f4f7] text-neutral-700'}`}>
                                        {file.patch}
                                      </pre>
                                    )}
                                  </details>
                                ))}
                              </div>
                            )}

                            {(reviewError || reviewMutationError) && (
                              <div className={`rounded-xl border p-4 text-sm ${isDark ? 'border-rose-500/20 bg-rose-500/[0.06] text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                                {reviewError || reviewMutationError?.message}
                              </div>
                            )}

                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </main>

      {isAnalysisModalOpen && reviewAnalysis && selectedFile && (
        <PullRequestAnalysisModal
          analysis={reviewAnalysis}
          filename={selectedFile.filename}
          code={selectedFile.patch || ''}
          repository={selectedRepository || ''}
          pullNumber={selectedPullNumber || 0}
          isDark={isDark}
          isPosting={isPostingComment}
          postError={postCommentError}
          postSuccess={postCommentSuccess}
          onPostComment={handlePostComment}
          onClose={() => setIsAnalysisModalOpen(false)}
        />
      )}
    </div>
  );
};

export default GitHubPage;
