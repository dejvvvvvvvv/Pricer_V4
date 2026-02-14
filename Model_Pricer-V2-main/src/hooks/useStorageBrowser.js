import { useState, useCallback } from 'react';
import { browseFolder, searchFiles, deleteFile, restoreFile, createFolder as apiFolderCreate, renameItem as apiRename, uploadFiles as apiUpload } from '../services/storageApi';

/**
 * Hook for managing Model Storage browser state.
 * Handles current path, loading, items, selection, search, and CRUD operations.
 */
export default function useStorageBrowser(initialPath = '') {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selection, setSelection] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  const loadFolder = useCallback(async (folderPath = '') => {
    setLoading(true);
    setError(null);
    setSelection(new Set());
    setSearchResults(null);
    setSearchQuery('');

    try {
      const result = await browseFolder(folderPath);
      setItems(result.items || []);
      setCurrentPath(folderPath);
    } catch (e) {
      setError(e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const navigateTo = useCallback((folderPath) => {
    loadFolder(folderPath);
  }, [loadFolder]);

  const navigateUp = useCallback(() => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    loadFolder(parts.join('/'));
  }, [currentPath, loadFolder]);

  const refresh = useCallback(() => {
    loadFolder(currentPath);
  }, [currentPath, loadFolder]);

  const doSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setLoading(true);
    try {
      const results = await searchFiles(query);
      setSearchResults(results);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleSelection = useCallback((itemPath, shiftKey, ctrlKey) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (ctrlKey || shiftKey) {
        if (next.has(itemPath)) next.delete(itemPath);
        else next.add(itemPath);
      } else {
        if (next.has(itemPath) && next.size === 1) {
          next.clear();
        } else {
          next.clear();
          next.add(itemPath);
        }
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(new Set());
  }, []);

  const doDelete = useCallback(async (itemPath) => {
    try {
      await deleteFile(itemPath);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }, [refresh]);

  const doRestore = useCallback(async (trashPath) => {
    try {
      await restoreFile(trashPath);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }, [refresh]);

  const doCreateFolder = useCallback(async (folderName) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    try {
      await apiFolderCreate(newPath);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }, [currentPath, refresh]);

  const doRename = useCallback(async (itemPath, newName) => {
    try {
      await apiRename(itemPath, newName);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }, [refresh]);

  const doUpload = useCallback(async (files) => {
    const targetPath = currentPath || 'CompanyLibrary';
    try {
      await apiUpload(files, targetPath);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }, [currentPath, refresh]);

  return {
    currentPath,
    items: searchResults || items,
    loading,
    error,
    selection,
    searchQuery,
    isSearching: searchResults !== null,
    viewMode,

    navigateTo,
    navigateUp,
    refresh,
    loadFolder,
    doSearch,
    toggleSelection,
    clearSelection,
    setViewMode,
    doDelete,
    doRestore,
    doCreateFolder,
    doRename,
    doUpload,
    setError,
  };
}
