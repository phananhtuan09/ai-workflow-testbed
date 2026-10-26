import { useCallback, useEffect, useState } from 'react';

export type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'success'; data: T };

interface Settled<T> {
  load: () => Promise<T>;
  attempt: number;
  state: ResourceState<T>;
}

// Project-wide pattern for loading server data into a component.
// `load` must be stable (module function or useCallback); a new function starts a new request.
export function useResource<T>(load: () => Promise<T>): ResourceState<T> & { reload: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    let active = true;
    load().then(
      (data) => active && setSettled({ load, attempt, state: { status: 'success', data } }),
      (error: unknown) => active && setSettled({ load, attempt, state: { status: 'error', error } }),
    );
    return () => {
      active = false;
    };
  }, [load, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  const current = settled && settled.load === load && settled.attempt === attempt;
  return { ...(current ? settled.state : { status: 'loading' }), reload };
}
