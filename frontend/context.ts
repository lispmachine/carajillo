import {createContext} from '@lit/context';

export const tokenContext = createContext<string | undefined>('token');

const currentScriptOrigin: string = document.currentScript ? new URL((document.currentScript as HTMLScriptElement).src).origin : '';
export const apiRoot = `${currentScriptOrigin}/api`;