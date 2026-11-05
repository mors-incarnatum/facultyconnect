import { useContext } from 'react';
import { AppContext } from '../state/AppContext.js';

export const useApp = () => useContext(AppContext);
