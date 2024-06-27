/// <reference types="svelte" />
/// <reference types="vite/client" />

declare const PKG: {
  name: string;
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
};