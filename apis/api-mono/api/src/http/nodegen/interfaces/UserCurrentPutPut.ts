export interface UserCurrentPutPut {
  /**
   * Full display name (optional override)
   */
  displayName?: string;
  /**
   * User's email address (from SSO provider)
   */
  email: string;
  /**
   * User's first name
   */
  firstName: string;
  /**
   * User's last name
   */
  lastName: string;
}
