/**
 * API base URL for backend requests.
 * Set REACT_APP_API_URL in .env (or in your host's environment) for production.
 * Defaults to localhost:3001 for development.
 */
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
