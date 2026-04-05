export interface User {
  _id: string;
  createdAt: Date;
  createdBy: string;
  /**
   * Full display name (optional override)
   */
  displayName?: string;
  /**
   * User's email address (from SSO provider)
   */
  email: string;
  /**
   * External SSO provider user ID (Google, etc.)
   */
  externalId?: string;
  /**
   * User's first name
   */
  firstName: string;
  /**
   * User's last name
   */
  lastName: string;
  roles: string[];
  updatedAt: Date;
}
