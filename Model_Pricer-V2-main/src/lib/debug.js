/**
 * Development-only debug logger.
 * Silent in production builds (tree-shaken by Vite).
 */
export const debug = (...args) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};
