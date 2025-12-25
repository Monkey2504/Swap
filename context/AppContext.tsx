import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { UserProfile, UserPreference, Duty, DepotCode } from '../types';
import { INITIAL_PREFERENCES, DEPOT_MAP, RGPS_RULES, APP_CONFIG } from '../constants';
import { isSupabaseConfigured } from '../lib/supabase';
import { profileService, swapService, formatError } from '../lib/api';

interface TechLog {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source?: string;
  metadata?: Record<string, any>;
}

interface AppState {
  user: UserProfile | null;
  isLoadingUser: boolean;
  lastUserSync: number | null;
  preferences: UserPreference[];
  preferencesVersion: number;
  ui: {
    error: string | null;
    success: string | null;
    warning: string | null;
    isSaving: boolean;
    isLoading: boolean;
  };
  rgpdConsent: boolean;
  techLogs: TechLog[];
  maxLogs: number;
  lastDutiesUpdate: number | null;
  hasUnsyncedChanges: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: UserProfile | null }
  | { type: 'SET_USER_LOADING'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: Partial<UserProfile> }
  | { type: 'MARK_USER_SYNCED' }
  | { type: 'SET_PREFERENCES'; payload: UserPreference[] }
  | { type: 'UPDATE_PREFERENCE'; payload: { id: string; updates: Partial<UserPreference> } }
  | { type: 'ADD_PREFERENCE'; payload: UserPreference }
  | { type: 'REMOVE_PREFERENCE'; payload: string }
  | { type: 'INCREMENT_PREFERENCES_VERSION' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_WARNING'; payload: string | null }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_RGPD_CONSENT'; payload: boolean }
  | { type: 'ADD_TECH_LOG'; payload: Omit<TechLog, 'id' | 'timestamp'> }
  | { type: 'CLEAR_LOGS' }
  | { type: 'MARK_UNSYNCED_CHANGES'; payload: boolean }
  | { type: 'MARK_DUTIES_UPDATED' }
  | { type: 'RESET_APP' };

interface AppContextType extends AppState {
  isSaving: boolean;
  login: (user: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  loadUserProfile: (id: string, authUser?: any) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: (updates: Partial<UserProfile>) => Promise<void>;
  setPreferences: (prefs: UserPreference[]) => void;
  updatePreferences: (preferences: UserPreference[]) => void;
  updatePreference: (id: string, updates: Partial<UserPreference>) => void;
  addPreference: (preference: UserPreference) => void;
  removePreference: (id: string) => void;
  publishDutyForSwap: (duty: Duty, isUrgent?: boolean) => Promise<void>;
  setError: (message: string | null) => void;
  setSuccess: (message: string | null) => void;
  setSuccessMessage: (msg: string | null) => void;
  setWarning: (message: string | null) => void;
  clearMessages: () => void;
  addTechLog: (message: string, level?: TechLog['level'], source?: string, metadata?: Record<string, any>) => void;
  clearTechLogs: () => void;
  validateDepot: (depotCode: string) => boolean;
  validateRGPS: (duty: Duty, otherDuties?: Duty[]) => { valid: boolean; violations: string[] };
  getComputedPreferences: () => { likes: UserPreference[]; dislikes: UserPreference[]; neutrals: UserPreference[] };
  isOnline: boolean;
  isInitialized: boolean;
  hasPendingChanges: boolean;
}

const initialState: AppState = {
  user: null,
  isLoadingUser: false,
  lastUserSync: null,
  preferences: INITIAL_PREFERENCES,
  preferencesVersion: 1,
  ui: {
    error: null,
    success: null,
    warning: null,
    isSaving: false,
    isLoading: false,
  },
  rgpdConsent: false,
  techLogs: [],
  maxLogs: 100,
  lastDutiesUpdate: null,
  hasUnsyncedChanges: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER': return { ...state, user: action.payload, lastUserSync: action.payload ? Date.now() : null };
    case 'SET_USER_LOADING': return { ...state, isLoadingUser: action.payload };
    case 'UPDATE_USER': return state.user ? { ...state, user: { ...state.user, ...action.payload }, hasUnsyncedChanges: true } : state;
    case 'MARK_USER_SYNCED': return { ...state, hasUnsyncedChanges: false, lastUserSync: Date.now() };
    case 'SET_PREFERENCES': return { ...state, preferences: action.payload, hasUnsyncedChanges: true };
    case 'UPDATE_PREFERENCE': return { ...state, preferences: state.preferences.map(pref => pref.id === action.payload.id ? { ...pref, ...action.payload.updates } : pref), hasUnsyncedChanges: true };
    case 'ADD_PREFERENCE': return { ...state, preferences: [...state.preferences, action.payload], hasUnsyncedChanges: true };
    case 'REMOVE_PREFERENCE': return { ...state, preferences: state.preferences.filter(pref => pref.id !== action.payload), hasUnsyncedChanges: true };
    case 'INCREMENT_PREFERENCES_VERSION': return { ...state, preferencesVersion: state.preferencesVersion + 1 };
    case 'SET_ERROR': return { ...state, ui: { ...state.ui, error: action.payload, success: null } };
    case 'SET_SUCCESS': return { ...state, ui: { ...state.ui, success: action.payload, error: null } };
    case 'SET_WARNING': return { ...state, ui: { ...state.ui, warning: action.payload } };
    case 'SET_SAVING': return { ...state, ui: { ...state.ui, isSaving: action.payload } };
    case 'SET_LOADING': return { ...state, ui: { ...state.ui, isLoading: action.payload } };
    case 'CLEAR_MESSAGES': return { ...state, ui: { ...state.ui, error: null, success: null, warning: null } };
    case 'SET_RGPD_CONSENT': return { ...state, rgpdConsent: action.payload, hasUnsyncedChanges: true };
    case 'ADD_TECH_LOG': return { ...state, techLogs: [{ id: `log_${Date.now()}`, timestamp: new Date().toISOString(), ...action.payload }, ...state.techLogs].slice(0, state.maxLogs) };
    case 'CLEAR_LOGS': return { ...state, techLogs: [] };
    case 'MARK_UNSYNCED_CHANGES': return { ...state, hasUnsyncedChanges: action.payload };
    case 'MARK_DUTIES_UPDATED': return { ...state, lastDutiesUpdate: Date.now() };
    case 'RESET_APP': return { ...initialState, techLogs: state.techLogs };
    default: return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const loadUserProfile = useCallback(async (userId: string, authUser?: any) => {
    dispatch({ type: 'SET_USER_LOADING', payload: true });
    try {
      const profile = await profileService.getOrCreateProfile({ id: userId, email: authUser?.email, metadata: authUser?.user_metadata });
      
      // Remapping keys from DB snake_case to UI camelCase
      const mappedProfile: UserProfile = {
        id: profile.id,
        sncbId: profile.sncb_id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        depot: profile.depot,
        onboardingCompleted: profile.onboarding_completed,
        role: profile.role,
        preferences: profile.preferences || [],
        rgpdConsent: profile.rgpd_consent
      };

      dispatch({ type: 'SET_USER', payload: mappedProfile });
      if (mappedProfile.preferences) dispatch({ type: 'SET_PREFERENCES', payload: mappedProfile.preferences });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: formatError(error) });
    } finally {
      dispatch({ type: 'SET_USER_LOADING', payload: false });
    }
  }, []);

  const login = useCallback(async (user: UserProfile) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_USER', payload: user });
    if (user.preferences) dispatch({ type: 'SET_PREFERENCES', payload: user.preferences });
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  // 🚨 CORRECTION INTÉGRÉE : Mise à jour de l'état local avant le rechargement
  const completeOnboarding = useCallback(async (updates: any) => {
    if (!state.user) return;
    dispatch({ type: 'SET_SAVING', payload: true });
    dispatch({ type: 'CLEAR_MESSAGES' });
    
    try {
      // 1. Mise à jour en base de données (utilise snake_case)
      await profileService.updateProfile(state.user.id, { 
        ...updates, 
        onboarding_completed: true,
      });
      
      // 2. MISE À JOUR LOCALE IMMÉDIATE (CORRECTION)
      // Ceci débloque l'UI instantanément pour la redirection vers le dashboard
      dispatch({ type: 'UPDATE_USER', payload: {
        firstName: updates.first_name, 
        lastName: updates.last_name, 
        depot: updates.depot,
        rgpdConsent: updates.rgpd_consent,
        onboardingCompleted: true 
      }});
      
      // 3. Re-téléchargement pour confirmer l'état de la DB
      await loadUserProfile(state.user.id); 
      
      dispatch({ type: 'SET_SUCCESS', payload: 'Profil validé avec succès !' });
    } catch (error) { 
      dispatch({ type: 'SET_ERROR', payload: formatError(error) }); 
    }
    finally { dispatch({ type: 'SET_SAVING', payload: false }); }
  }, [state.user, loadUserProfile]);

  const validateRGPS = useCallback((duty: Duty, otherDuties: Duty[] = []): { valid: boolean; violations: string[] } => {
    const violations: string[] = [];
    if ((duty.duration || 0) > RGPS_RULES.MAX_SERVICE_DURATION_HOURS) {
      violations.push(`Durée excessive (${duty.duration}h)`);
    }
    return { valid: violations.length === 0, violations };
  }, []);

  const logout = useCallback(async () => { dispatch({ type: 'RESET_APP' }); }, []);

  const contextValue: AppContextType = useMemo(() => ({
    ...state,
    isSaving: state.ui.isSaving,
    login,
    logout,
    loadUserProfile,
    updateUserProfile: (updates) => dispatch({ type: 'UPDATE_USER', payload: updates }),
    completeOnboarding,
    setPreferences: (p) => dispatch({ type: 'SET_PREFERENCES', payload: p }),
    updatePreferences: (p) => dispatch({ type: 'SET_PREFERENCES', payload: p }),
    updatePreference: (id, updates) => dispatch({ type: 'UPDATE_PREFERENCE', payload: { id, updates } }),
    addPreference: (p) => dispatch({ type: 'ADD_PREFERENCE', payload: p }),
    removePreference: (id) => dispatch({ type: 'REMOVE_PREFERENCE', payload: id }),
    publishDutyForSwap: async (duty, isUrgent) => { 
        if (!state.user) return;
        await swapService.publishForSwap(state.user, duty, isUrgent); 
    },
    setError: (m) => dispatch({ type: 'SET_ERROR', payload: m }),
    setSuccess: (m) => dispatch({ type: 'SET_SUCCESS', payload: m }),
    setSuccessMessage: (m) => dispatch({ type: 'SET_SUCCESS', payload: m }),
    setWarning: (m) => dispatch({ type: 'SET_WARNING', payload: m }),
    clearMessages: () => dispatch({ type: 'CLEAR_MESSAGES' }),
    addTechLog: (m, l = 'info') => dispatch({ type: 'ADD_TECH_LOG', payload: { message: m, level: l } }),
    clearTechLogs: () => dispatch({ type: 'CLEAR_LOGS' }),
    validateDepot: (c) => DEPOT_MAP.has(c),
    validateRGPS,
    getComputedPreferences: () => ({ 
        likes: state.preferences.filter(p => p.level === 'LIKE'), 
        dislikes: state.preferences.filter(p => p.level === 'DISLIKE'), 
        neutrals: state.preferences.filter(p => p.level === 'NEUTRAL') 
    }),
    isOnline: navigator.onLine,
    isInitialized: !!state.user,
    hasPendingChanges: state.hasUnsyncedChanges,
  }), [state, login, logout, loadUserProfile, completeOnboarding, validateRGPS]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};