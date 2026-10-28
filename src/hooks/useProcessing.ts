import { useState, useRef, useCallback } from 'react';
import type { ProcessingStatus, ProcessingError } from '@/types';

export type UseProcessingReturn = {
  status: ProcessingStatus;
  progress: number;
  error: ProcessingError | null;
  abortController: React.MutableRefObject<AbortController | null>;
  start: () => AbortController;
  setProgress: (p: number) => void;
  setDone: () => void;
  setError: (err: ProcessingError) => void;
  cancel: () => void;
  reset: () => void;
};

export function useProcessing(): UseProcessingReturn {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgressState] = useState(0);
  const [error, setErrorState] = useState<ProcessingError | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const start = useCallback(() => {
    const ac = new AbortController();
    abortController.current = ac;
    setStatus('processing');
    setProgressState(0);
    setErrorState(null);
    return ac;
  }, []);

  const setProgress = useCallback((p: number) => {
    setProgressState(Math.max(0, Math.min(100, p)));
  }, []);

  const setDone = useCallback(() => {
    setStatus('done');
    setProgressState(100);
  }, []);

  const setError = useCallback((err: ProcessingError) => {
    setStatus('error');
    setErrorState(err);
  }, []);

  const cancel = useCallback(() => {
    abortController.current?.abort();
    setStatus('cancelled');
    setProgressState(0);
  }, []);

  const reset = useCallback(() => {
    abortController.current?.abort();
    setStatus('idle');
    setProgressState(0);
    setErrorState(null);
  }, []);

  return { status, progress, error, abortController, start, setProgress, setDone, setError, cancel, reset };
}
