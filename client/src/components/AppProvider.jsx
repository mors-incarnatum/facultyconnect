import { AppContext } from '../hooks/useApp.js';
import { useAppState } from '../hooks/useAppState.js';

function AppProvider({ children }) {
    const value = useAppState();
    return <AppContext.Provider value={value}>{value.loading ? null : children}</AppContext.Provider>;
}

export default AppProvider;
