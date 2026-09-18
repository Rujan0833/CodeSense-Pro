import { useCallback, useEffect, useState } from 'react';
import type { AnalysisSnapshot } from '../types/analysis';

interface StudioSession {
  code: string;
  snapshot: AnalysisSnapshot | null;
}

function getStorageKey(userId: string) {
  return `codesense_studio_session_${userId}`;
}

function readSession(userId: string, fallbackCode: string): StudioSession {
  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    if (stored) {
      const session = JSON.parse(stored) as StudioSession;
      if (typeof session.code === 'string') return session;
    }
  } catch {
    // Use a fresh session when local storage is unavailable or malformed.
  }

  return { code: fallbackCode, snapshot: null };
}

export function useStudioSession(userId: string, fallbackCode: string) {
  const [session, setSession] = useState<StudioSession>(() => readSession(userId, fallbackCode));

  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(session));
    } catch {
      // The studio remains usable when local storage is unavailable.
    }
  }, [session, userId]);

  const updateCode = useCallback((code: string) => {
    setSession((current) => ({ ...current, code }));
  }, []);

  const saveSnapshot = useCallback((snapshot: AnalysisSnapshot) => {
    setSession((current) => ({ ...current, code: snapshot.code, snapshot }));
  }, []);

  const clearSession = useCallback(() => {
    setSession({ code: '', snapshot: null });
  }, []);

  return {
    code: session.code,
    snapshot: session.snapshot,
    updateCode,
    saveSnapshot,
    clearSession,
  };
}
