import { useState, useEffect, useCallback } from 'react';

export type AppRoute = '/' | '/studio' | '/login' | '/signup';

function getNormalizedPath(): AppRoute {
  if (typeof window === 'undefined') return '/';
  const path = window.location.pathname.toLowerCase();
  if (path === '/studio') return '/studio';
  if (path === '/login') return '/login';
  if (path === '/signup') return '/signup';
  return '/';
}

const routeListeners = new Set<() => void>();

export function useRouter() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getNormalizedPath);

  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentRoute(getNormalizedPath());
    };

    routeListeners.add(handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      routeListeners.delete(handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const navigate = useCallback((route: AppRoute) => {
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route);
      routeListeners.forEach(listener => listener());
    }
  }, []);

  return { currentRoute, navigate };
}
