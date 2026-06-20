/** Lifetime premium — owner / early access (never pay, never see ads). */
export const GRANDFATHERED_PREMIUM_EMAILS = ['brivera2005@gmail.com'] as const;

export function isGrandfatheredPremiumEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return GRANDFATHERED_PREMIUM_EMAILS.some((entry) => entry === normalized);
}

export function userHasPremium(user: {
  email: string;
  is_premium?: boolean | number | null;
}): boolean {
  if (Boolean(user.is_premium)) return true;
  return isGrandfatheredPremiumEmail(user.email);
}
