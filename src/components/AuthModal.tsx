import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { IosSpinner } from './LoadingSpinner';
import Button from './ui/Button';
import { X, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'signup';
  isDark?: boolean;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'signin',
  isDark = false,
  onSuccess
}) => {
  const { login, register, loginDemo } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  if (prevInitialTab !== initialTab) {
    setPrevInitialTab(initialTab);
    setTab(initialTab);
    setError(null);
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (tab === 'signup') {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await loginDemo();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo sign in failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Frosted Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Apple Floating Glass Card */}
      <div className={`relative w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all z-10 animate-in fade-in zoom-in-95 duration-200 ${
        isDark 
          ? 'bg-[#0f0f15]/95 border-white/15 text-white shadow-[0_25px_60px_rgba(0,0,0,0.8)]' 
          : 'bg-white/95 border-black/10 text-neutral-900 shadow-[0_25px_60px_rgba(0,0,0,0.15)]'
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-1.5 rounded-full transition-colors cursor-pointer ${
            isDark 
              ? 'text-neutral-400 hover:text-white hover:bg-white/10' 
              : 'text-neutral-500 hover:text-black hover:bg-black/5'
          }`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>CodeSense Pro</span>
          </div>
          <h3 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            {tab === 'signin' ? 'Sign in to access Studio' : 'Create your account'}
          </h3>
          <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Unlock deep AI code review, AST diagnostics, and architectural insights
          </p>
        </div>

        {/* Segmented Pill Tab Switcher */}
        <div className={`flex items-center p-1 rounded-2xl border mb-6 ${
          isDark ? 'bg-white/[0.04] border-white/10' : 'bg-black/[0.04] border-black/10'
        }`}>
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(null); }}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              tab === 'signin'
                ? isDark
                  ? 'bg-white text-black shadow font-semibold'
                  : 'bg-white text-black shadow font-semibold'
                : isDark
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-neutral-600 hover:text-black'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(null); }}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              tab === 'signup'
                ? isDark
                  ? 'bg-white text-black shadow font-semibold'
                  : 'bg-white text-black shadow font-semibold'
                : isDark
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-neutral-600 hover:text-black'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'signup' && (
            <div className="space-y-1.5">
              <label className={`block text-xs font-medium uppercase tracking-wider ${
                isDark ? 'text-neutral-400' : 'text-neutral-600'
              }`}>
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Steve Wozniak"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all ${
                    isDark
                      ? 'bg-white/[0.04] border-white/10 text-white focus:border-white/30'
                      : 'bg-black/[0.03] border-black/10 text-neutral-900 focus:border-black/30'
                  }`}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className={`block text-xs font-medium uppercase tracking-wider ${
              isDark ? 'text-neutral-400' : 'text-neutral-600'
            }`}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="developer@apple.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all ${
                  isDark
                    ? 'bg-white/[0.04] border-white/10 text-white focus:border-white/30'
                    : 'bg-black/[0.03] border-black/10 text-neutral-900 focus:border-black/30'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`block text-xs font-medium uppercase tracking-wider ${
              isDark ? 'text-neutral-400' : 'text-neutral-600'
            }`}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all ${
                  isDark
                    ? 'bg-white/[0.04] border-white/10 text-white focus:border-white/30'
                    : 'bg-black/[0.03] border-black/10 text-neutral-900 focus:border-black/30'
                }`}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isDark={isDark}
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 rounded-xl text-sm font-semibold"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <IosSpinner size={16} className={isDark ? 'text-black' : 'text-white'} />
                <span>{tab === 'signin' ? 'Authenticating...' : 'Creating Account...'}</span>
              </div>
            ) : (
              <span>{tab === 'signin' ? 'Sign In' : 'Create Account'}</span>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className={`absolute inset-0 flex items-center ${
            isDark ? 'border-t border-white/10' : 'border-t border-black/10'
          }`} />
          <span className={`relative px-3 text-[11px] uppercase tracking-wider ${
            isDark ? 'bg-[#0f0f15] text-neutral-500' : 'bg-white text-neutral-400'
          }`}>
            or instant access
          </span>
        </div>

        {/* 1-Click Demo Account */}
        <Button
          type="button"
          variant="secondary"
          size="md"
          isDark={isDark}
          disabled={isSubmitting}
          onClick={handleDemoLogin}
          className="w-full py-3 rounded-xl text-xs font-semibold"
        >
          <span>Continue as Demo Developer</span>
        </Button>
      </div>
    </div>
  );
};

export default AuthModal;
