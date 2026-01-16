import { useState, useCallback } from 'react';
import type { TransformRequest, TransformResponse, ApiStatus } from '@/types/api';

const API_URL = 'http://localhost:4000/transform';

interface UseTransformReturn {
  transform: (request: TransformRequest) => Promise<void>;
  response: TransformResponse | null;
  status: ApiStatus;
  error: string | null;
  clearError: () => void;
}

export function useTransform(): UseTransformReturn {
  const [response, setResponse] = useState<TransformResponse | null>(null);
  const [status, setStatus] = useState<ApiStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const transform = useCallback(async (request: TransformRequest) => {
    setStatus('loading');
    setError(null);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (res.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }

      if (res.status === 500) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Internal server error occurred.');
      }

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data: TransformResponse = await res.json();
      setResponse(data);
      setStatus('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setStatus('error');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { transform, response, status, error, clearError };
}
