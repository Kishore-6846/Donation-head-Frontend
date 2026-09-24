import { isSuperUser } from './authStorage';

/**
 * Parses any date format safely (DD/MM/YYYY, ISO, timestamp, or Date)
 */
export function parseDateSafe(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;
    
    // Match DD/MM/YYYY or DD-MM-YYYY
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(trimmed)) {
      const parts = trimmed.split(/[\/\-]/);
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const parsed = new Date(year, month, day);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/**
 * Checks if a user's subscription plan is expired.
 * Super Administrators are never expired.
 */
export function checkIsPlanExpired(user) {
  if (!user || typeof user !== 'object') return false;
  if (isSuperUser(user)) return false;

  // 1. Explicit boolean or status flags
  if (user.isPlanExpired === true || user.isExpired === true) {
    return true;
  }
  
  const statusLower = String(user.status || '').toLowerCase().trim();
  const subStatusLower = String(user.subscriptionStatus || user.planStatus || '').toLowerCase().trim();
  if (statusLower === 'expired' || subStatusLower === 'expired') {
    return true;
  }

  // 2. Check explicit expiry date
  const rawExpiry = user.planExpiresAt || user.planExpiryDate || user.expiryDate || user.subscriptionExpiresAt;
  const expiryDate = parseDateSafe(rawExpiry);
  if (expiryDate) {
    return new Date() > expiryDate;
  }

  // 3. Fallback calculation from user start date (createdAt / joinedDate) + validityDays (default 365 days)
  const rawStart = user.createdAt || user.joinedDate;
  const startDate = parseDateSafe(rawStart);
  if (startDate) {
    const validityDays = Number(user.validityDays) || 365;
    const computedEnd = new Date(startDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
    if (new Date() > computedEnd) {
      return true;
    }
  }

  return false;
}

/**
 * Get comprehensive plan & expiry info
 */
export function getPlanExpiryInfo(user) {
  const isExpired = checkIsPlanExpired(user);
  const planName = user?.plan || 'Standard';

  const rawExpiry = user?.planExpiresAt || user?.planExpiryDate || user?.expiryDate || user?.subscriptionExpiresAt;
  let expiryDate = parseDateSafe(rawExpiry);

  if (!expiryDate && (user?.createdAt || user?.joinedDate)) {
    const startDate = parseDateSafe(user.createdAt || user.joinedDate) || new Date();
    const validityDays = Number(user?.validityDays) || 365;
    expiryDate = new Date(startDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
  }

  return {
    isExpired,
    planName,
    expiryDate,
    canCreateReceipts: !isExpired || isSuperUser(user)
  };
}
