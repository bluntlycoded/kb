/**
 * Product modules. Each can be switched on or off per tenant, so the
 * reseller can package them into plans however they price it.
 */
export const FEATURES = ['cohort', 'lounge', 'news', 'games', 'chat', 'profile', 'assessments'] as const;
export type Feature = (typeof FEATURES)[number];

/** Placeholder tiers until the client confirms their pricing. */
export const DEFAULT_PLANS: Record<string, readonly Feature[]> = {
  basic: ['cohort', 'lounge', 'news', 'profile'],
  pro: FEATURES,
};
