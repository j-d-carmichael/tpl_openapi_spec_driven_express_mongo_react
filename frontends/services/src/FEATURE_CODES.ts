/**
 * Feature codes for the application.
 * These codes are used to enable/disable features for companies.
 *
 * IMPORTANT: This file is duplicated in apis/api-mono/api/src/constants/FEATURE_CODES.ts
 * Any changes here must be reflected there as well.
 */
export const FEATURE_CODES = {
  /** AI-powered app builder functionality */
  AI_APP_BUILDER: 'ai-app-builder',
  WEBHOOKS: 'webhooks',
} as const;

export type FeatureCode = (typeof FEATURE_CODES)[keyof typeof FEATURE_CODES];

/** Array of all feature codes for iteration/validation */
export const ALL_FEATURE_CODES = Object.values(FEATURE_CODES);
