import { useCallback, useEffect, useRef, useState } from 'react';
import api, { errorMessage } from '../api/client';

/**
 * GET helper with loading/error state. Pass `null` as the url to skip the request.
 * Returns the full response body (so list endpoints expose total/pages too).
 */
export default function useApi(url, { params, deps = [] } = {}) {
  const [body, setBody] = useState(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const paramsKey = JSON.stringify(params || {});

  const load = useCallback(async () => {
    if (!url) {
      setLoading(false);
      return null;
    }
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(url, { params: JSON.parse(paramsKey) });
      if (id === requestId.current) setBody(res.data);
      return res.data;
    } catch (err) {
      if (id === requestId.current) setError(errorMessage(err));
      return null;
    } finally {
      if (id === requestId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, paramsKey, ...deps]);

  useEffect(() => {
    load();
  }, [load]);

  return { body, data: body?.data, loading, error, reload: load, setBody };
}
