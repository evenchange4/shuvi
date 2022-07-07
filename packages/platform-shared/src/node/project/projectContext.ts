import { IRuntimeConfig } from '@shuvi/service/lib/core';

export interface UserModule {
  app: string | string[];
  error: string | string[];
}

export interface ProjectContext {
  entryCodes: string[];
  polyfills: string[];
  runtimeConfig: IRuntimeConfig;
  platformModule: string;
  userModule: UserModule;
}

export const createProjectContext = (): ProjectContext => {
  return {
    entryCodes: [],
    polyfills: [],
    runtimeConfig: {},
    platformModule: '',
    userModule: {
      app: '',
      error: ''
    }
  };
};
