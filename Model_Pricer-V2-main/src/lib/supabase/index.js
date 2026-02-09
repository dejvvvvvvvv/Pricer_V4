/*
  Supabase module — barrel export.
*/

export { supabase, isSupabaseAvailable, checkSupabaseConnection } from './client';
export { storageAdapter, getTableForNamespace } from './storageAdapter';
export {
  getStorageMode,
  setStorageMode,
  setAllStorageModes,
  getAllStorageModes,
  isSupabaseEnabled,
  isLocalStorageEnabled,
  ALL_NAMESPACES,
  VALID_MODES,
} from './featureFlags';
export {
  getMigrationList,
  runMigrations,
  backupLocalStorage,
  enableSupabaseForAll,
  enableDualWriteForAll,
  rollbackToLocalStorage,
  MIGRATIONS,
} from './migrationRunner';
