import { useEffect, useState } from 'react';

export function useClock() {
    const [now, setNow] = useState(function () {
        return new Date();
    });

    useEffect(function () {
        let timer;

        function refresh() {
            const current = new Date();
            setNow(current);
            clearTimeout(timer);
            timer = setTimeout(refresh, 60000 - (current.getTime() % 60000));
        }

        refresh();
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', refresh);
        return function () {
            clearTimeout(timer);
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, []);

    return now;
}
