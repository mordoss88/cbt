import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/* The current time, refreshed when the app comes back to the front, so "today" moves on after midnight. */
export function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') setNow(Date.now()); });
    return () => sub.remove();
  }, []);
  return now;
}
