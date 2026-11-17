import { useCallback, useEffect, useState } from 'react';

export function useScheduleDrafts(facultyId) {
    const [drafts, setDrafts] = useState({});
    const scheduleDraft = drafts[facultyId];

    const setScheduleDraft = useCallback(function (draft) {
        setDrafts(function (prev) {
            return Object.assign({}, prev, { [facultyId]: draft });
        });
    }, [facultyId]);

    useEffect(function () {
        if (!scheduleDraft) {
            return;
        }

        function handleBeforeUnload(event) {
            event.preventDefault();
            event.returnValue = '';
        }

        window.addEventListener('beforeunload', handleBeforeUnload);
        return function () {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [scheduleDraft]);

    return {
        scheduleDraft: scheduleDraft,
        setScheduleDraft: setScheduleDraft,
    };
}
