import { API_BASE_URL } from '../config.js';

/**
 * Rewrite image URLs in post body HTML so that content displays correctly
 * regardless of where the app is hosted (e.g. GitHub Pages vs same origin).
 * - Replaces localhost:3001 with the current API base URL.
 * - Rewrites relative /uploads/ paths to absolute API URLs so images work
 *   when the app is on a different origin (e.g. kapitolos.github.io).
 */
export function fixPostBodyImageUrls(html) {
  if (!html || typeof html !== 'string') return html || '';
  let out = html.replace(/https?:\/\/localhost:3001/g, API_BASE_URL);
  // Rewrite relative /uploads/ paths (e.g. src="/uploads/images/...") so they
  // load from the API server when the app is on GitHub Pages or another origin.
  out = out.replace(/(src=)(["'])(\/uploads\/)/g, `$1$2${API_BASE_URL}$3`);
  return out;
}
