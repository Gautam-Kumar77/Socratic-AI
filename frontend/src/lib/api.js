export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';

export function makeApiUrl(path) {
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  return `${API_BASE_URL}${path}`;
}
