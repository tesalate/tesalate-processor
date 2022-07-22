import axios, { AxiosRequestConfig, AxiosInstance } from 'axios';
import { teslaAccountController } from '../controllers';
import config from './config';
import Logger from './logger';

const logger = Logger('axios');

const commonConfig: AxiosRequestConfig = {
  timeout: 10000,
};

const appApiConfig: AxiosRequestConfig = {
  ...commonConfig,
  baseURL: config.apiUrl,
};
const appApiInstance: AxiosInstance = axios.create(appApiConfig);

const authConfig: AxiosRequestConfig = {
  ...commonConfig,
  baseURL: config.tesla.oauthUrl,
};
const authInstance: AxiosInstance = axios.create(authConfig);

const ownerConfig: AxiosRequestConfig = {
  ...commonConfig,
  baseURL: config.tesla.ownerUrl,
};
const ownerInstance: AxiosInstance = axios.create(ownerConfig);

ownerInstance.interceptors.request.use(
  (config) => {
    // Do something before request is sent
    return config;
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

ownerInstance.interceptors.response.use(
  (response) => {
    // Any status code from range of 2xx
    // Do something with response data
    return response;
  },
  async (error) => {
    logger.error('response error', {
      data: error?.response?.data,
      status: error?.response?.status,
      headers: error?.response?.headers,
    });

    const originalRequest = error.config;
    if (error?.response?.status === 401 && originalRequest?.url?.includes('/token')) {
      return Promise.reject(error);
    }

    if (error?.response?.status === 401 && !originalRequest._retry && error?.config?.headers['x-teslaAccount']) {
      const { refresh_token, _id } = JSON.parse(error.config.headers['x-teslaAccount']);
      const vehicle = error.config.headers['x-vehicle'];

      originalRequest._retry = true;

      const res = await authInstance.post('/token', {
        refresh_token,
        grant_type: 'refresh_token',
        client_id: 'ownerapi',
        scope: 'openid email offline_access',
      });

      const { data } = res;

      if (res.status === 200) {
        const { access_token, refresh_token } = data;
        await teslaAccountController.updateTeslaAccount({ access_token, refresh_token, _id }, vehicle);
        originalRequest.headers = { Authorization: `Bearer ${access_token}` };
        return ownerInstance(originalRequest);
      } else {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default {
  authApi: {
    get: authInstance.get,
    post: authInstance.post,
    put: authInstance.put,
    delete: authInstance.delete,
    patch: authInstance.patch,
  },
  ownerApi: {
    get: ownerInstance.get,
    post: ownerInstance.post,
    put: ownerInstance.put,
    delete: ownerInstance.delete,
    patch: ownerInstance.patch,
  },
  appApi: {
    get: appApiInstance.get,
    post: appApiInstance.post,
    put: appApiInstance.put,
    delete: appApiInstance.delete,
    patch: appApiInstance.patch,
  },
};
