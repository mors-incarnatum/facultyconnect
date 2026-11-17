import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from './useApp.js';
import { apiUrl } from '../utils/api.js';

export function useFacultyResults() {
    const { faculty } = useApp();
    const [params, setParams] = useSearchParams();
    const q = params.get('q') || '';
    const dept = params.get('dept') || '';
    const [results, setResults] = useState(faculty);

    useEffect(function () {
        let cancelled = false;
        const queryObj = {};
        if (q.trim()) {
            queryObj.q = q.trim();
        }
        if (dept) {
            queryObj.dept = dept;
        }
        const queryString = new URLSearchParams(queryObj).toString();
        const suffix = queryString ? `?${queryString}` : '';

        async function searchFaculty() {
            try {

                const response = await fetch(apiUrl(`/faculty${suffix}`), {
                    method: 'GET',
                });
                const data = await response.json();
                if (!cancelled && Array.isArray(data)) {
                    setResults(data);
                }
            } catch (err) {
                console.error('Request error:', err);
                if (!cancelled) {
                    setResults([]);
                }
            }
        }

        searchFaculty();
        return function () {
            cancelled = true;
        };
    }, [q, dept, faculty]);

    return {
        q: q,
        dept: dept,
        results: results,
        params: params,
        setParams: setParams,
    };
}
