'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Shared single-record state for admin detail pages.
 *
 * State starts in `loading`, the initial fetch runs once per id/enabled change,
 * and `refresh` re-runs it with a loading skeleton (used by retry buttons).
 */
export function useAdminResource(fetchResource, { enabled = true } = {}) {
  const fetchRef = useRef(fetchResource);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    fetchRef.current = fetchResource;
  }, [fetchResource]);

  useEffect(() => {
    if (!enabled) return undefined;

    const controller = new AbortController();
    let active = true;

    fetchRef
      .current({ signal: controller.signal })
      .then((response) => {
        if (!active) return;

        setData(response?.data ?? response);
        setError(null);
        setStatus('ready');
      })
      .catch((requestError) => {
        if (!active || requestError?.kind === 'cancelled') return;

        setError(requestError);
        setStatus('error');
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [enabled, reloadToken]);

  const refresh = useCallback(() => {
    setStatus('loading');
    setReloadToken((token) => token + 1);
  }, []);

  return { data, setData, status, error, refresh };
}
