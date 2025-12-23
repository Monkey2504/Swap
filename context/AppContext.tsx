
import { User } from '@supabase/supabase-js';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { UserProfile, UserPreference, Duty } from '../types';
import { INITIAL_PREFERENCES, DEPOTS } from '../constants';
import { isSupabaseConfigured } from '../lib/supabase';
import { profileService, swapService, formatError } from '../lib/api';

interface TechLog {
  timestamp: string;
  message: string;
  type: 'error' | 'info' | 'warn';
  source?: string;
}

interface AppContextType {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  preferences: UserPreference[];
  setPreferences: React.Dispatch<React.SetStateAction<UserPreference[]>>;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  saveProfileToDB: () => Promise<void>;
  publishDutyForSwap: (duty: Duty, isUrgent?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  setError: (msg: string | null) => void;
  successMessage: string | null;
  setSuccessMessage: (msg: string | null) => void;
  isSaving: boolean;
  rgpdConsent: boolean;
  setRgpdConsent: (v: boolean) => void;
  loadUserProfile: (userId: string, authUser?: User) => Promise<void>;
  clearMessages: () => void;
  techLogs: TechLog[];
  addTechLog: (msg: string, type?: 'error' | 'info' | 'warn', source?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreference[]>(INITIAL_PREFERENCES);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [rgpdConsent, setRgpdConsent] = useState(false);
  const [techLogs, setTechLogs] = useState<TechLog[]>([]);
  
  const lastSavedUser = useRef<string | null>(null);

  const addTechLog = useCallback((message: string, type: 'error' | 'info' | 'warn' = 'info', source?: string) => {
    const formattedMsg = typeof message === 'string' ? message : JSON.stringify(message);
    const log: TechLog = {
      timestamp: new Date().toISOString(),
      message: formattedMsg,
      type,
      source
    };
    setTechLogs(prev => [log, ...prev].slice(0, 100));
    if (type === 'error') {
      console.error(`[TECH_LOG][${source || 'APP'}] ${formattedMsg}`);
    }
  }, []);

  const loadUserProfile = useCallback(async (userId: string, authUser?: User) => {
    if (!isSupabaseConfigured()) return;
    setIsSaving(true);
    try {
      addTechLog(`Initialisation profil ${userId}`, 'info', 'Auth');
      const data = await profileService.getOrCreateProfile({
        id: userId,
        email: authUser?.email,
        metadata: authUser?.user_metadata
      });

      const profile: UserProfile = {
        id: userId,
        sncbId: data.sncb_id || 'ID_PENDING',
        firstName: data.first_name || 'Agent',
        lastName: data.last_name || 'SNCB',
        email: authUser?.email || data.email || '',
        depot: data.depot || DEPOTS[0],
        series: data.series || '',
        position: data.position || '',
        isFloating: data.is_floating || false,
        currentDuties: data.current_duties || [],
        rgpdConsent: data.rgpd_consent || false,
        role: data.role || 'Chef de train'
      };
      
      setUser(profile);
      setRgpdConsent(profile.rgpdConsent);
      
      if (data.preferences && Array.isArray(data.preferences)) {
        setPreferences(data.preferences);
      }
      
      lastSavedUser.current = JSON.stringify({ ...profile, preferences: data.preferences });
      addTechLog(`Session active pour ${profile.firstName}`, 'info', 'Profile');
    } catch (err: any) {
      const msg = formatError(err);
      addTechLog(`Avertissement Cloud: ${msg}`, 'warn', 'Supabase');
    } finally {
      setIsSaving(false);
    }
  }, [addTechLog]);

  const saveProfileToDB = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return;
    
    const currentState = JSON.stringify({ ...user, preferences, rgpdConsent });
    if (lastSavedUser.current === currentState) return;

    setIsSaving(true);
    try {
      await profileService.updateProfile(user.id, {
        sncb_id: user.sncbId,
        first_name: user.firstName,
        last_name: user.lastName,
        depot: user.depot,
        series: user.series,
        position: user.position,
        preferences: preferences,
        current_duties: user.currentDuties,
        rgpd_consent: rgpdConsent,
        is_floating: user.isFloating
      });
      lastSavedUser.current = currentState;
    } catch (err: any) {
      addTechLog(`Échec sync: ${formatError(err)}`, 'warn', 'Sync');
    } finally {
      setIsSaving(false);
    }
  }, [user, preferences, rgpdConsent, addTechLog]);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(saveProfileToDB, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, preferences, rgpdConsent, saveProfileToDB]);

  const logout = useCallback(async () => {
    addTechLog('Déconnexion', 'info', 'Auth');
    setUser(null);
    setPreferences(INITIAL_PREFERENCES);
    setRgpdConsent(false);
    lastSavedUser.current = null;
  }, [addTechLog]);

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
    if (updates.rgpdConsent !== undefined) setRgpdConsent(updates.rgpdConsent);
  }, []);

  const publishDutyForSwap = async (duty: Duty, isUrgent: boolean = false) => {
    if (!user || !isSupabaseConfigured()) return;
    setIsSaving(true);
    try {
      await swapService.publishForSwap(user, duty, isUrgent);
      setSuccessMessage(`Service ${duty.code} publié !`);
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  return (
    <AppContext.Provider value={{ 
      user, setUser, preferences, setPreferences, 
      updateUserProfile, saveProfileToDB, publishDutyForSwap, logout,
      error, setError, successMessage, setSuccessMessage, isSaving, 
      rgpdConsent, setRgpdConsent, loadUserProfile, clearMessages,
      techLogs, addTechLog
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
