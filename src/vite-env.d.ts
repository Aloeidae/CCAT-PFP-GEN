/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RUNWARE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
