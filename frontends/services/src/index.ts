/**
 * Services Package Entry Point
 * 
 * Exports all services for use in frontend applications
 */

export { default as HttpService } from './HttpService';
export { default as AuthService } from './AuthService';
export type { RequestObject } from './HttpService';

// Shared React Hooks pattern to copy as needed
// export {
//   useHasPermissionGroup,
//   useHasPermissionGroups,
//   useHasAnyPermissionGroup,
//   useHasAllPermissionGroups,
// } from './hooks';
