// 開発環境とVS Code環境での API切り替え
import { mockApi } from './vscode-api-mock';
import { api as vsCodeApi } from './vscode-api';

// 開発環境かどうかを判定
const isDevelopment = typeof window !== 'undefined' && 
  window.location.protocol === 'http:';

export const api = isDevelopment ? mockApi : vsCodeApi;