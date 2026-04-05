import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, Method, } from 'axios';
import AuthService from './AuthService';

export interface RequestObject {
  method: string;
  path: string;
  formData?: object;
  params?: object;
  qs?: object;
  body?: object;
  headers?: object;
  baseUrl?: string;
}

export default class HttpService {
  private static httpClassSetup = false;
  private static baseApiUrl: string = '';
  private static on500ErrorNotification: () => void;
  private static on401ErrorNotification?: () => void;

  static setup (input: {
    baseApiUrl: string,
    on500ErrorNotification: () => void,
    on401ErrorNotification?: () => void
  }) {
    HttpService.baseApiUrl = input.baseApiUrl;
    HttpService.setupAxiosInterceptors();
    HttpService.on500ErrorNotification = input.on500ErrorNotification;
    HttpService.on401ErrorNotification = input.on401ErrorNotification;
    HttpService.httpClassSetup = true;
    AuthService.setup({
      onLogout: input.on401ErrorNotification,
    });
  }

  static async sendRequest (requestObject: RequestObject): Promise<any> {
    if (!HttpService.httpClassSetup) {
      throw new Error('You must call HttpService.setup beforehand');
    }

    const baseUrl = requestObject.baseUrl || HttpService.baseApiUrl;
    const path = HttpService.injectParamsToPath(requestObject.params, requestObject.path);
    // If baseUrl is empty/undefined, use path as-is (absolute from domain root)
    const URL = baseUrl ? baseUrl + path : path;

    const axiosReq: AxiosRequestConfig = {
      headers: {
        ...requestObject.headers,
      },
      method: requestObject.method as Method,
      data: requestObject.body || {},
      params: requestObject.qs || {},
      url: URL,
      withCredentials: true,
    };

    return axios(axiosReq)
      .then((response: AxiosResponse) => response.data)
      .catch((err: AxiosError) => {
        throw err;
      });
  }

  static isLogoutRoute (url: string): boolean {
    return /\/auth\/logout/.test(url);
  }

  static injectParamsToPath (params: Record<any, any> = {}, path: string) {
    Object.keys(params).forEach((param) => {
      path = path.replace(':' + param, params[param]);
    });
    return path;
  }

  static setupAxiosInterceptors () {
    axios.defaults.withCredentials = true;

    axios.interceptors.request.use(
      HttpService.preRequestCheck.bind(this),
      (e) => Promise.reject(e)
    );

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          return HttpService.handle401(error);
        } else if (error.response?.status === 500) {
          return HttpService.handle500(error);
        }
        return Promise.reject(error);
      }
    );
  }

  static async preRequestCheck (
    axiosConfig: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> {
    axiosConfig.withCredentials = true;
    return axiosConfig;
  }

  static async handle401 (err: any) {
    if (
      err.response?.status === 401 &&
      !HttpService.isLogoutRoute(err.request?.responseURL || '')
    ) {
      console.warn('Session expired or invalid - logging out');
      if (HttpService.on401ErrorNotification) {
        HttpService.on401ErrorNotification();
      }
      await AuthService.logout(HttpService.baseApiUrl);
    }
    return Promise.reject(err);
  }

  static async logout (): Promise<void> {
    await AuthService.logout(HttpService.baseApiUrl);
  }

  static handle500 (err: any) {
    if (err.response?.status === 500) {
      HttpService.on500ErrorNotification();
      console.error(err);
    }
    return Promise.reject(err);
  }
}
