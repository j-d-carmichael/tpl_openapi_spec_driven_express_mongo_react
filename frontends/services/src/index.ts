/**
 * Services Package Entry Point
 * 
 * Exports all services for use in frontend applications
 */

export { default as HttpService } from './HttpService';
export { default as AuthService } from './AuthService';
export type { RequestObject } from './HttpService';
export { FEATURE_CODES, ALL_FEATURE_CODES } from './FEATURE_CODES';
export type { FeatureCode } from './FEATURE_CODES';

// Shared React Hooks
export {
  useHasPermissionGroup,
  useHasPermissionGroups,
  useHasAnyPermissionGroup,
  useHasAllPermissionGroups,
} from './hooks';

export { WEAVE_FORMS_APP_ID, DEFAULT_FORM_CATEGORIES } from './constantsShared';
