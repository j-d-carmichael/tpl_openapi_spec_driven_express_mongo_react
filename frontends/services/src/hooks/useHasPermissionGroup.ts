import { useMemo } from 'react';
import { Company } from 'apis/api-mono/services/interfaces/Company';

/**
 * Shared hook to check if a user has a specific permission group.
 * 
 * This hook is store-agnostic - it accepts the company and role as parameters,
 * allowing it to work with different user store implementations across apps.
 * 
 * Permission check flow:
 * 1. Get the company's role definitions (includes permissionGroups for each role)
 * 2. Find the user's role and get its permissionGroups
 * 3. Check if the requested group name is in the user's role's permissionGroups
 * 
 * @param company - The current company object (must include roles with permissionGroups)
 * @param currentRole - The user's current role name (e.g., 'ADMIN', 'MEMBER')
 * @param groupName - The permission group name to check (e.g., 'app-manage', 'rules-and-webhooks-manage')
 * @returns boolean - true if user has the permission group, false otherwise
 * 
 * @example
 * // In a component:
 * const company = useUserStore((state) => state.currentCompany);
 * const role = useUserStore((state) => state.currentRole);
 * const canManageApps = useHasPermissionGroup(company, role, 'app-manage');
 */
export function useHasPermissionGroup(
  company: Company | null,
  currentRole: string | null,
  groupName: string
): boolean {
  return useMemo(() => {
    // Need company and role to check permission
    if (!company || !currentRole) {
      return false;
    }

    // Find the user's role definition in the company
    const userRole = company.roles?.find((role) => role.name === currentRole);
    if (!userRole || !userRole.permissionGroups || userRole.permissionGroups.length === 0) {
      return false;
    }

    return userRole.permissionGroups.includes(groupName);
  }, [company, currentRole, groupName]);
}

/**
 * Shared hook to check multiple permission groups at once.
 * 
 * @param company - The current company object
 * @param currentRole - The user's current role name
 * @param groupNames - Array of permission group names to check
 * @returns Record<string, boolean> - Object with group names as keys and boolean values
 * 
 * @example
 * const permissions = useHasPermissionGroups(company, role, ['app-manage', 'rules-and-webhooks-manage']);
 * if (permissions['app-manage']) {
 *   // Show app management UI
 * }
 */
export function useHasPermissionGroups(
  company: Company | null,
  currentRole: string | null,
  groupNames: string[]
): Record<string, boolean> {
  return useMemo(() => {
    const result: Record<string, boolean> = {};

    if (!company || !currentRole) {
      groupNames.forEach((name) => {
        result[name] = false;
      });
      return result;
    }

    // Find the user's role definition in the company
    const userRole = company.roles?.find((role) => role.name === currentRole);
    const userGroups = new Set(userRole?.permissionGroups || []);

    groupNames.forEach((name) => {
      result[name] = userGroups.has(name);
    });

    return result;
  }, [company, currentRole, groupNames]);
}

/**
 * Shared hook to check if user has ANY of the specified permission groups.
 * 
 * @param company - The current company object
 * @param currentRole - The user's current role name
 * @param groupNames - Array of permission group names to check
 * @returns boolean - true if user has at least one of the groups
 */
export function useHasAnyPermissionGroup(
  company: Company | null,
  currentRole: string | null,
  groupNames: string[]
): boolean {
  const results = useHasPermissionGroups(company, currentRole, groupNames);
  return Object.values(results).some(Boolean);
}

/**
 * Shared hook to check if user has ALL of the specified permission groups.
 * 
 * @param company - The current company object
 * @param currentRole - The user's current role name
 * @param groupNames - Array of permission group names to check
 * @returns boolean - true if user has all of the groups
 */
export function useHasAllPermissionGroups(
  company: Company | null,
  currentRole: string | null,
  groupNames: string[]
): boolean {
  const results = useHasPermissionGroups(company, currentRole, groupNames);
  return Object.values(results).every(Boolean);
}
