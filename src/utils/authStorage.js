/**
 * Authentication and Session Storage Utility
 *
 * Provides strict namespace isolation between Super Admin and Trust Admin sessions.
 * Prioritizes `sessionStorage` for tab-level isolation while synchronizing with `localStorage`
 * for tab persistence, preventing multi-tab collisions and session leakage.
 */

const SUPERADMIN_USER_KEY = 'superadmin_user_info';
const SUPERADMIN_TOKEN_KEY = 'superadmin_auth_token';

const TRUST_USER_KEY = 'trust_user_info';
const TRUST_TOKEN_KEY = 'trust_auth_token';

const LEGACY_USER_KEY = 'user_info';
const LEGACY_TOKEN_KEY = 'auth_token';

/**
 * Check if a user object represents a Super Administrator
 */
export function isSuperUser(user) {
  if (!user || typeof user !== 'object') return false;
  const role = (user.role || '').toLowerCase();
  const isSuper = Boolean(user.isSuperAdmin);
  const email = (user.email || '').toLowerCase().trim();
  const trustName = (user.trustName || '').toUpperCase().trim();
  const name = (user.name || '').toLowerCase().trim();

  return (
    isSuper ||
    role.includes('super') ||
    email === 'admin@donationreceipt.in' ||
    email === 'superadmin@gmail.com' ||
    trustName === 'DONATION RECEIPT SUPER ADMIN' ||
    name === 'super administrator'
  );
}

/**
 * Safely parse JSON from storage
 */
function safeParse(str) {
  if (!str) return null;
  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed === 'object' && (parsed.email || parsed.id || parsed._id || parsed.name)) {
      return parsed;
    }
  } catch (e) {}
  return null;
}

// ==========================================
// Super Admin Session Management
// ==========================================

export function getSuperAdminSession() {
  try {
    // Tab-isolated sessionStorage ONLY: ensures one tab never inherits another tab's session
    const user = safeParse(sessionStorage.getItem(SUPERADMIN_USER_KEY));
    const token = sessionStorage.getItem(SUPERADMIN_TOKEN_KEY);

    if (user && isSuperUser(user)) {
      return { user, token: token || '' };
    }
  } catch (e) {
    console.error('Error reading superadmin session:', e);
  }
  return null;
}

export function setSuperAdminSession(user, token = '') {
  if (!user) return;
  const superUser = {
    ...user,
    role: user.role || 'Super Admin',
    isSuperAdmin: true,
    trustName: user.trustName || 'DONATION RECEIPT SUPER ADMIN',
    name: user.name || 'Super Administrator'
  };

  const userStr = JSON.stringify(superUser);

  try {
    // Isolate this tab strictly for Super Admin
    sessionStorage.setItem(SUPERADMIN_USER_KEY, userStr);
    if (token) sessionStorage.setItem(SUPERADMIN_TOKEN_KEY, token);

    // Clear any Trust session lingering in this tab
    sessionStorage.removeItem(TRUST_USER_KEY);
    sessionStorage.removeItem(TRUST_TOKEN_KEY);

    // Save profile cache
    if (superUser.email) {
      localStorage.setItem(`profile_data_${superUser.email.toLowerCase()}`, userStr);
    }

    // Dispatch events for in-tab reactivity
    window.dispatchEvent(new CustomEvent('superadmin-session-change', { detail: superUser }));
    window.dispatchEvent(new CustomEvent('trust-session-change', { detail: null }));
  } catch (e) {
    console.error('Error setting superadmin session:', e);
  }
}

export function clearSuperAdminSession() {
  try {
    sessionStorage.removeItem(SUPERADMIN_USER_KEY);
    sessionStorage.removeItem(SUPERADMIN_TOKEN_KEY);
    localStorage.removeItem(SUPERADMIN_USER_KEY);
    localStorage.removeItem(SUPERADMIN_TOKEN_KEY);

    window.dispatchEvent(new CustomEvent('superadmin-session-change', { detail: null }));
  } catch (e) {
    console.error('Error clearing superadmin session:', e);
  }
}

// ==========================================
// Trust Admin Session Management
// ==========================================

export function getTrustSession() {
  try {
    // Tab-isolated sessionStorage ONLY: ensures one tab never inherits another tab's session
    const user = safeParse(sessionStorage.getItem(TRUST_USER_KEY));
    const token = sessionStorage.getItem(TRUST_TOKEN_KEY);

    // STRICT CHECK: Reject any Super Admin object from being returned as a Trust user
    if (user && !isSuperUser(user)) {
      return { user, token: token || '' };
    }
  } catch (e) {
    console.error('Error reading trust session:', e);
  }
  return null;
}

export function setTrustSession(user, token = '') {
  if (!user) return;

  // Make sure it's not a super admin being saved as a trust
  if (isSuperUser(user)) {
    console.warn('Attempted to save Super Admin as a Trust session. Ignoring.');
    return;
  }

  const userStr = JSON.stringify(user);

  try {
    // Isolate this tab strictly for Trust Admin
    sessionStorage.setItem(TRUST_USER_KEY, userStr);
    if (token) sessionStorage.setItem(TRUST_TOKEN_KEY, token);

    // Clear any SuperAdmin session lingering in this tab
    sessionStorage.removeItem(SUPERADMIN_USER_KEY);
    sessionStorage.removeItem(SUPERADMIN_TOKEN_KEY);

    // Save profile cache
    if (user.email) {
      localStorage.setItem(`profile_data_${user.email.toLowerCase()}`, userStr);
    }

    // Dispatch events for in-tab reactivity
    window.dispatchEvent(new CustomEvent('trust-session-change', { detail: user }));
    window.dispatchEvent(new CustomEvent('superadmin-session-change', { detail: null }));
  } catch (e) {
    console.error('Error setting trust session:', e);
  }
}

export function clearTrustSession() {
  try {
    sessionStorage.removeItem(TRUST_USER_KEY);
    sessionStorage.removeItem(TRUST_TOKEN_KEY);
    localStorage.removeItem(TRUST_USER_KEY);
    localStorage.removeItem(TRUST_TOKEN_KEY);

    window.dispatchEvent(new CustomEvent('trust-session-change', { detail: null }));
  } catch (e) {
    console.error('Error clearing trust session:', e);
  }
}

/**
 * Clear all sessions for the current tab
 */
export function clearCurrentTabSessions() {
  try {
    sessionStorage.removeItem(SUPERADMIN_USER_KEY);
    sessionStorage.removeItem(SUPERADMIN_TOKEN_KEY);
    sessionStorage.removeItem(TRUST_USER_KEY);
    sessionStorage.removeItem(TRUST_TOKEN_KEY);
    window.dispatchEvent(new CustomEvent('superadmin-session-change', { detail: null }));
    window.dispatchEvent(new CustomEvent('trust-session-change', { detail: null }));
  } catch (e) {
    console.error('Error clearing current tab sessions:', e);
  }
}

// ==========================================
// Route-Aware Helpers
// ==========================================

export function isSuperAdminPath(pathname) {
  const path = (pathname || window.location.pathname || '').toLowerCase();
  return (
    path.startsWith('/superadmin') ||
    path.startsWith('/super-admin')
  );
}

export function getCurrentUser(pathname) {
  if (isSuperAdminPath(pathname)) {
    return getSuperAdminSession()?.user || null;
  }
  return getTrustSession()?.user || null;
}

export function getCurrentToken(pathname) {
  if (isSuperAdminPath(pathname)) {
    return getSuperAdminSession()?.token || '';
  }
  return getTrustSession()?.token || '';
}

// Clean up any legacy or cross-contaminated keys
try {
  localStorage.removeItem(LEGACY_USER_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(SUPERADMIN_USER_KEY);
  localStorage.removeItem(SUPERADMIN_TOKEN_KEY);
  localStorage.removeItem(TRUST_USER_KEY);
  localStorage.removeItem(TRUST_TOKEN_KEY);
  sessionStorage.removeItem(LEGACY_USER_KEY);
  sessionStorage.removeItem(LEGACY_TOKEN_KEY);
} catch (e) {}

