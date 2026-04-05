import Cookies from 'js-cookie';

export default class AuthService {
  private static SESSION_COOKIE_NAME = 'session';
  private static LOGOUT_ENDPOINT = '/auth/logout';
  private static onLogoutCallback?: () => void;

  static setup(config: { onLogout?: () => void }) {
    AuthService.onLogoutCallback = config.onLogout;
  }

  static hasSessionCookie(): boolean {
    return Cookies.get(AuthService.SESSION_COOKIE_NAME) !== undefined;
  }

  static async logout(baseApiUrl: string): Promise<void> {
    try {
      await fetch(`${baseApiUrl}${AuthService.LOGOUT_ENDPOINT}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      AuthService.clearClientCookies();
      if (AuthService.onLogoutCallback) {
        AuthService.onLogoutCallback();
      }
    }
  }

  private static clearClientCookies(): void {
    const allCookies = Cookies.get();
    Object.keys(allCookies).forEach((cookieName) => {
      Cookies.remove(cookieName);
    });
  }

  static isLoggedIn(): boolean {
    return AuthService.hasSessionCookie();
  }
}
