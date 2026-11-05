import { useCallback, useEffect, useState } from 'react';

export const useScheduleDrafts = (facultyId) => {
  const [drafts, setDrafts] = useState({});
  const scheduleDraft = drafts[facultyId];
  const setScheduleDraft = useCallback((draft) => {
    setDrafts((prev) => ({ ...prev, [facultyId]: draft }));
  }, [facultyId]);

  useEffect(() => {
    if (!scheduleDraft) return;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [scheduleDraft]);

  return { scheduleDraft, setScheduleDraft };
};
