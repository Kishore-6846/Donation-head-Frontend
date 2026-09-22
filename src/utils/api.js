/**
 * Centralized API & Network Resiliency Client for Donation Receipt App
 *
 * Directs API requests directly to the Render backend in production to bypass
 * Vercel Serverless Proxy 429 Rate Limits and Edge Proxy timeouts.
 */

// Production Render Backend URL
const PRODUCTION_BACKEND_URL = 'https://donation-head-backend.onrender.com';

/**
 * Determine if running in local development mode
 */
export function isLocalDev() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

/**
 * Get the target API base URL
 */
export function getApiBaseUrl() {
  if (import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (isLocalDev()) {
    return ''; // Relative URL mapped by Vite proxy
  }
  return PRODUCTION_BACKEND_URL;
}

/**
 * Convert relative endpoint paths to fully resolved URLs in production
 */
export function resolveApiUrl(url) {
  if (!url || typeof url !== 'string') return url;

  // If already absolute HTTP(S) URL, keep as-is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  // Only rewrite API endpoints and receipt PDF streams
  const isApiEndpoint =
    url.startsWith('/api/') ||
    url.startsWith('/trust/api/') ||
    url.startsWith('/superadmin/api/') ||
    url.startsWith('/superAdmin/api/') ||
    url.startsWith('/trust/print-receipt') ||
    url.startsWith('/trust/print_receipt') ||
    url.startsWith('/trust/download-invoice') ||
    url.startsWith('/trust/download_invoice') ||
    url === '/health' ||
    url === '/api/health';

  if (!isApiEndpoint) {
    return url;
  }

  const base = getApiBaseUrl();
  if (!base) return url;

  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${base}${cleanPath}`;
}

/**
 * Safe JSON parsing helper to prevent "Unexpected token" errors on 429/500 HTML responses
 */
export async function parseResponseSafe(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (e) {}
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    if (response.status === 429) {
      return {
        success: false,
        message: 'Server is currently receiving too many requests or waking up. Please wait a few seconds and try again.'
      };
    }
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      return {
        success: false,
        message: 'Backend server is starting up. Please wait 10 seconds and try again.'
      };
    }
    return {
      success: false,
      message: text || `Server returned error (${response.status})`
    };
  }
}

/**
 * Fetch wrapper with automatic URL resolution, safe timeout and single retry on cold start
 */
export async function safeApiFetch(url, options = {}, retriesLeft = 1) {
  const resolvedUrl = resolveApiUrl(url);

  try {
    const res = await fetch(resolvedUrl, {
      ...options,
      headers: {
        ...(options.headers || {})
      }
    });

    // If server is returning 429 or 504 during cold boot, try direct URL fallback if not already direct
    if ((res.status === 429 || res.status === 504 || res.status === 502) && retriesLeft > 0) {
      await new Promise(r => setTimeout(r, 1200));
      return safeApiFetch(url, options, retriesLeft - 1);
    }

    return res;
  } catch (networkError) {
    // If relative request failed, retry with direct production backend
    if (!isLocalDev() && retriesLeft > 0 && !url.startsWith('http')) {
      const fallbackUrl = `${PRODUCTION_BACKEND_URL}${url.startsWith('/') ? url : `/${url}`}`;
      try {
        await new Promise(r => setTimeout(r, 1000));
        return await fetch(fallbackUrl, options);
      } catch (e) {}
    }
    throw networkError;
  }
}

/**
 * Global fetch monkey patch to transparently redirect all /api calls
 * to the Render backend in production and avoid Vercel 429 rewrite throttles.
 */
export function setupGlobalFetchInterceptor() {
  if (typeof window === 'undefined' || window.__fetchInterceptorInitialized) return;
  window.__fetchInterceptorInitialized = true;

  const originalFetch = window.fetch;

  window.fetch = async function (input, init) {
    let url = input;
    if (typeof input === 'string') {
      url = resolveApiUrl(input);
    } else if (input instanceof Request) {
      url = resolveApiUrl(input.url);
    }

    try {
      const response = await originalFetch(url, init);

      // If Vercel proxy or Render gave 429 on a relative call, attempt direct Render connection
      if (
        response.status === 429 &&
        typeof input === 'string' &&
        !input.startsWith('http') &&
        !isLocalDev()
      ) {
        console.warn('Proxy returned 429, retrying directly with backend:', input);
        const directUrl = `${PRODUCTION_BACKEND_URL}${input.startsWith('/') ? input : `/${input}`}`;
        try {
          const directRes = await originalFetch(directUrl, init);
          return directRes;
        } catch (e) {}
      }

      return response;
    } catch (err) {
      // Network failure on relative path: attempt direct Render backend
      if (typeof input === 'string' && !input.startsWith('http') && !isLocalDev()) {
        const directUrl = `${PRODUCTION_BACKEND_URL}${input.startsWith('/') ? input : `/${input}`}`;
        try {
          return await originalFetch(directUrl, init);
        } catch (e) {}
      }
      throw err;
    }
  };
}

/**
 * Pre-warm and keep-alive ping for Render backend to prevent sleep / cold starts
 */
export function initApiKeepAlive() {
  if (typeof window === 'undefined') return;

  const ping = () => {
    const targetUrl = resolveApiUrl('/api/health');
    fetch(targetUrl, { method: 'GET', cache: 'no-store' }).catch(() => {});
  };

  // Immediate ping on page load
  setTimeout(ping, 200);

  // Periodic keep-alive ping every 10 minutes while user is on site
  setInterval(ping, 10 * 60 * 1000);
}
