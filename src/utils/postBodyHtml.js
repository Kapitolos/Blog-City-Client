import { API_BASE_URL } from '../config.js';

/**
 * Rewrite image URLs in post body HTML so that content created on localhost
 * displays correctly when viewed on production (and vice versa).
 */
export function fixPostBodyImageUrls(html) {
  if (!html || typeof html !== 'string') return html || '';
  return html.replace(/https?:\/\/localhost:3001/g, API_BASE_URL);
}
