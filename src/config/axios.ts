import axios, { AxiosRequestConfig, AxiosInstance } from 'axios';
import config from './config';

const commonConfig: AxiosRequestConfig = {
  timeout: 10000,
};

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
};
