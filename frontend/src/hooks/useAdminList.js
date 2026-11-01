'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function normalizePagination(response, fallbackPerPage) {
  const hasPaginatorMeta =
    response?.meta !== undefined || response?.current_page !== undefined;

  if (!hasPaginatorMeta) {
    const count = Array.isArray(response?.data) ? response.data.length : 0;

    return {
      currentPage: 1,
      lastPage: 1,
      perPage: count || fallbackPerPage,
      total: count,
      from: count > 0 ? 1 : null,
      to: count > 0 ? count : null,
    };
  }

  const meta = response?.meta || response || {};

  return {
    currentPage: Number(meta.current_page) || 1,
    lastPage: Number(meta.last_page) || 1,
    perPage: Number(meta.per_page) || fallbackPerPage,
    total: Number(meta.total) || 0,
    from: meta.from ?? null,
    to: meta.to ?? null,
  };
}

/**
 * Shared list state for admin modules.
 *
 * Handles pagination, stale-request protection, refresh without loading
 * flicker, and both raw Laravel paginators and API Resource collections.
 */
export function useAdminList({
  fetchPage,
  query = {},
  enabled = true,
  perPage = 20,
} = {}) {
  const queryKey = JSON.stringify(query || {});
  const fetchRef = useRef(fetchPage);

  const [pageState, setPageState] = useState({ key: queryKey, value: 1 });
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [completedKey, setCompletedKey] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const requestIdRef = useRef(0);

  // A changed query always restarts at page one without an effect-driven reset.
  const page = pageState.key === queryKey ? pageState.value : 1;

  const setPage = useCallback(
    (next) => {
      setPageState((current) => {
        const currentPage = current.key === queryKey ? current.value : 1;

        return {
          key: queryKey,
          value: typeof next === 'function' ? next(currentPage) : next,
        };
      });
    },
    [queryKey]
  );

  useEffect(() => {
    fetchRef.current = fetchPage;
  }, [fetchPage]);

  const requestKey = `${queryKey}|${page}`;
  const isRefreshing = status === 'ready' && completedKey !== requestKey;

  useEffect(() => {
    if (!enabled) return undefined;

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    fetchRef
      .current({ ...query, page, per_page: perPage }, { signal: controller.signal })
      .then((response) => {
        if (requestIdRef.current !== requestId) return;

        setItems(Array.isArray(response?.data) ? response.data : []);
        setPagination(normalizePagination(response, perPage));
        setError(null);
        setCompletedKey(requestKey);
        setStatus('ready');
      })
      .catch((requestError) => {
        if (
          requestIdRef.current !== requestId ||
          requestError?.kind === 'cancelled'
        ) {
          return;
        }

        setError(requestError);
        setCompletedKey(requestKey);
        setStatus('error');
      });

    return () => controller.abort();
    // `query` is represented by its serialized queryKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, queryKey, page, perPage, reloadToken]);

  const refresh = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const resetPage = useCallback(() => setPage(1), [setPage]);

  return {
    items,
    pagination,
    status,
    error,
    page,
    setPage,
    resetPage,
    refresh,
    isRefreshing,
    setItems,
  };
}
