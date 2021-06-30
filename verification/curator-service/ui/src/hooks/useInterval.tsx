import { useEffect, useRef } from 'react';

/**
 * Custom hook to perform actions on an interval.
 *
 *   https://reactjs.org/docs/hooks-custom.html
 *   https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 */
export function useInterval(callback: () => void, delayMs: number): void {
    const savedCallback = useRef<() => void>();

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick(): void {
            if (savedCallback.current) {
                savedCallback.current();
            }
        }
        const id = setInterval(tick, delayMs);
        return (): void => clearInterval(id);
    }, [delayMs]);
}
