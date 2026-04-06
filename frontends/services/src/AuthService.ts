export default class AuthService {
  private static LOGIN_ENDPOINT = '/auth/login';
  private static LOGOUT_ENDPOINT = '/auth/logout';
  private static SESSION_ENDPOINT = '/auth/session';
  private static onLogoutCallback?: () => void;

  static setup (config: { onLogout?: () => void }) {
    AuthService.onLogoutCallback = config.onLogout;
  }

  /**
   * Navigates to the WorkOS hosted sign-in page.
   */
  static login (baseApiUrl: string): void {
    window.location.href = `${baseApiUrl}${AuthService.LOGIN_ENDPOINT}`;
  }

  /**
   * Logs out via form submission so the browser follows the server
   * redirect to the WorkOS logout URL (fetch cannot do this).
   */
  static logout (baseApiUrl: string): void {
    if (AuthService.onLogoutCallback) {
      AuthService.onLogoutCallback();
    }
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${baseApiUrl}${AuthService.LOGOUT_ENDPOINT}`;
    document.body.appendChild(form);
    form.submit();
  }

  /**
   * Checks whether the current session is valid by calling the API.
   * The wos-session cookie is httpOnly so it cannot be read from JS.
   */
  static async isLoggedIn (baseApiUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${baseApiUrl}${AuthService.SESSION_ENDPOINT}`, {
        credentials: 'include',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
