import { AppContext } from '../state/AppContext.js';
import { useAppState } from '../hooks/useAppState.js';

// Mount the shared state hook once; consumers read this provider through useApp.
const AppProvider = ({ children }) => {
  const value = useAppState();
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppProvider;
