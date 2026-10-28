/// <reference types="vite/client" />
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_STT_SERVER_URL?: string;
  readonly VITE_STT_ACCESS_CODE?: string;
}
