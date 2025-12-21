
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, UserPreference, Duty } from '../types';
import { INITIAL_PREFERENCES, MOCK_USER_DUTIES } from '../constants';

interface AppContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  preferences: UserPreference[];
  setPreferences: (prefs: UserPreference[]) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreference[]>(INITIAL_PREFERENCES);

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AppContext.Provider value={{ user, setUser, preferences, setPreferences, updateUserProfile }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
