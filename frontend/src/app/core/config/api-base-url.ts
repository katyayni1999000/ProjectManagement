const DEFAULT_API_BASE_URL = 'http://localhost:3000';

declare global {
  interface Window {
    __API_BASE_URL__?: string;
  }
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.__API_BASE_URL__ ?? DEFAULT_API_BASE_URL;
  }

  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.['API_URL'] ?? DEFAULT_API_BASE_URL;
}

export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export {};
