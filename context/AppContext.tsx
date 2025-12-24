
import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { UserProfile, UserPreference, Duty, DepotCode } from '../types';
import { INITIAL_PREFERENCES, DEPOT_MAP, RGPS_RULES, APP_CONFIG } from '../constants';
import { isSupabaseConfigured } from '../lib/supabase';
import { profileService, swapService, formatError } from '../lib/api';

// ============================================================================
// INTERFACES ET TYPES
// ============================================================================

interface TechLog {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source?: string;
  metadata?: Record<string, any>;
}

interface AppState {
  // Utilisateur
  user: UserProfile | null;
  isLoadingUser: boolean;
  lastUserSync: number | null;
  
  // Préférences
  preferences: UserPreference[];
  preferencesVersion: number;
  
  // UI/Etat
  ui: {
    error: string | null;
    success: string | null;
    warning: string | null;
    isSaving: boolean;
    isLoading: boolean;
  };
  
  // Consentement
  rgpdConsent: boolean;
  
  // Logs techniques
  techLogs: TechLog[];
  maxLogs: number;
  
  // Données métier
  lastDutiesUpdate: number | null;
  hasUnsyncedChanges: boolean;
}

type AppAction =
  // Utilisateur
  | { type: 'SET_USER'; payload: UserProfile | null }
  | { type: 'SET_USER_LOADING'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: Partial<UserProfile> }
  | { type: 'MARK_USER_SYNCED' }
  
  // Préférences
  | { type: 'SET_PREFERENCES'; payload: UserPreference[] }
  | { type: 'UPDATE_PREFERENCE'; payload: { id: string; updates: Partial<UserPreference> } }
  | { type: 'ADD_PREFERENCE'; payload: UserPreference }
  | { type: 'REMOVE_PREFERENCE'; payload: string }
  | { type: 'INCREMENT_PREFERENCES_VERSION' }
  
  // UI
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_WARNING'; payload: string | null }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_MESSAGES' }
  
  // Consentement
  | { type: 'SET_RGPD_CONSENT'; payload: boolean }
  
  // Logs
  | { type: 'ADD_TECH_LOG'; payload: Omit<TechLog, 'id' | 'timestamp'> }
  | { type: 'CLEAR_LOGS' }
  
  // État global
  | { type: 'MARK_UNSYNCED_CHANGES'; payload: boolean }
  | { type: 'MARK_DUTIES_UPDATED' }
  | { type: 'RESET_APP' };

interface AppContextType extends AppState {
  // Added properties used in App.tsx and ProfilePage.tsx
  isSaving: boolean;

  // Actions utilisateur
  login: (user: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  loadUserProfile: (id: string, authUser?: any) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Gestion préférences
  setPreferences: (prefs: UserPreference[]) => void;
  updatePreferences: (preferences: UserPreference[]) => void;
  updatePreference: (id: string, updates: Partial<UserPreference>) => void;
  addPreference: (preference: UserPreference) => void;
  removePreference: (id: string) => void;
  
  // Gestion SWAP
  publishDutyForSwap: (duty: Duty, isUrgent?: boolean) => Promise<void>;
  
  // Gestion messages
  setError: (message: string | null) => void;
  setSuccess: (message: string | null) => void;
  setSuccessMessage: (msg: string | null) => void;
  setWarning: (message: string | null) => void;
  clearMessages: () => void;
  
  // Logs
  addTechLog: (message: string, level?: TechLog['level'], source?: string, metadata?: Record<string, any>) => void;
  clearTechLogs: () => void;
  
  // Utilitaires
  validateDepot: (depotCode: string) => boolean;
  validateRGPS: (duty: Duty, otherDuties?: Duty[]) => { valid: boolean; violations: string[] };
  getComputedPreferences: () => { likes: UserPreference[]; dislikes: UserPreference[]; neutrals: UserPreference[] };
  
  // État
  isOnline: boolean;
  isInitialized: boolean;
  hasPendingChanges: boolean;
}

// ============================================================================
// REDUCER
// ============================================================================

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
    // Utilisateur
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        lastUserSync: action.payload ? Date.now() : null,
      };
    
    case 'SET_USER_LOADING':
      return {
        ...state,
        isLoadingUser: action.payload,
      };
    
    case 'UPDATE_USER':
      if (!state.user) return state;
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        hasUnsyncedChanges: true,
      };
    
    case 'MARK_USER_SYNCED':
      return {
        ...state,
        hasUnsyncedChanges: false,
        lastUserSync: Date.now(),
      };
    
    // Préférences
    case 'SET_PREFERENCES':
      return {
        ...state,
        preferences: action.payload,
        hasUnsyncedChanges: true,
      };
    
    case 'UPDATE_PREFERENCE':
      return {
        ...state,
        preferences: state.preferences.map(pref =>
          pref.id === action.payload.id ? { ...pref, ...action.payload.updates } : pref
        ),
        hasUnsyncedChanges: true,
      };
    
    case 'ADD_PREFERENCE':
      return {
        ...state,
        preferences: [...state.preferences, action.payload],
        hasUnsyncedChanges: true,
      };
    
    case 'REMOVE_PREFERENCE':
      return {
        ...state,
        preferences: state.preferences.filter(pref => pref.id !== action.payload),
        hasUnsyncedChanges: true,
      };
    
    case 'INCREMENT_PREFERENCES_VERSION':
      return {
        ...state,
        preferencesVersion: state.preferencesVersion + 1,
      };
    
    // UI
    case 'SET_ERROR':
      return {
        ...state,
        ui: { ...state.ui, error: action.payload },
      };
    
    case 'SET_SUCCESS':
      return {
        ...state,
        ui: { ...state.ui, success: action.payload },
      };
    
    case 'SET_WARNING':
      return {
        ...state,
        ui: { ...state.ui, warning: action.payload },
      };
    
    case 'SET_SAVING':
      return {
        ...state,
        ui: { ...state.ui, isSaving: action.payload },
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        ui: { ...state.ui, isLoading: action.payload },
      };
    
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        ui: {
          ...state.ui,
          error: null,
          success: null,
          warning: null,
        },
      };
    
    // Consentement
    case 'SET_RGPD_CONSENT':
      return {
        ...state,
        rgpdConsent: action.payload,
        hasUnsyncedChanges: true,
      };
    
    // Logs
    case 'ADD_TECH_LOG':
      const newLog: TechLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      
      return {
        ...state,
        techLogs: [newLog, ...state.techLogs].slice(0, state.maxLogs),
      };
    
    case 'CLEAR_LOGS':
      return {
        ...state,
        techLogs: [],
      };
    
    // État global
    case 'MARK_UNSYNCED_CHANGES':
      return {
        ...state,
        hasUnsyncedChanges: action.payload,
      };
    
    case 'MARK_DUTIES_UPDATED':
      return {
        ...state,
        lastDutiesUpdate: Date.now(),
      };
    
    case 'RESET_APP':
      return {
        ...initialState,
        techLogs: state.techLogs, // Garder les logs même après reset
      };
    
    default:
      return state;
  }
}

// ============================================================================
// CONTEXTE
// ============================================================================

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const lastSaveRef = useRef<{ user: string; prefs: string }>({ user: '', prefs: '' });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  
  // Gestion du montage/démontage
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  // Sauvegarde automatique des changements non synchronisés
  useEffect(() => {
    if (!state.hasUnsyncedChanges || !state.user || state.ui.isSaving) {
      return;
    }
    
    // Debounce de la sauvegarde
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && state.hasUnsyncedChanges && state.user) {
        saveProfileToDB();
      }
    }, APP_CONFIG.AUTO_SAVE_DELAY_MS);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.hasUnsyncedChanges, state.user, state.ui.isSaving]);
  
  // ==========================================================================
  // ACTIONS ASYNCHRONES
  // ==========================================================================
  
  const login = useCallback(async (user: UserProfile) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_USER', payload: user });
      
      if (user.preferences) {
        dispatch({ type: 'SET_PREFERENCES', payload: user.preferences });
      }
      
      if (user.rgpdConsent !== undefined) {
        dispatch({ type: 'SET_RGPD_CONSENT', payload: user.rgpdConsent });
      }
      
      dispatch({ type: 'SET_SUCCESS', payload: 'Connexion réussie' });
      
      // Log technique
      dispatch({
        type: 'ADD_TECH_LOG',
        payload: {
          message: `Utilisateur connecté: ${user.firstName} ${user.lastName} (${user.depot})`,
          level: 'info',
          source: 'Auth',
          metadata: { userId: user.id, depot: user.depot },
        },
      });
      
    } catch (error) {
      dispatch({
        type: 'ADD_TECH_LOG',
        payload: {
          message: `Erreur connexion: ${formatError(error)}`,
          level: 'error',
          source: 'Auth',
          metadata: { error },
        },
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Added loadUserProfile to fix error in App.tsx
  const loadUserProfile = useCallback(async (userId: string, authUser?: any) => {
    dispatch({ type: 'SET_USER_LOADING', payload: true });
    try {
      const profile = await profileService.getOrCreateProfile({ 
        id: userId, 
        email: authUser?.email, 
        metadata: authUser?.user_metadata 
      });
      dispatch({ type: 'SET_USER', payload: profile as any });
      if (profile.preferences) {
        dispatch({ type: 'SET_PREFERENCES', payload: profile.preferences as any });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: formatError(error) });
    } finally {
      dispatch({ type: 'SET_USER_LOADING', payload: false });
    }
  }, []);

  // Added completeOnboarding to fix error in ProfilePage.tsx
  const completeOnboarding = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.user) return;
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const finalUpdates = { ...updates, onboarding_completed: true };
      await profileService.updateProfile(state.user.id, finalUpdates);
      dispatch({ type: 'UPDATE_USER', payload: { ...updates, onboardingCompleted: true } });
      dispatch({ type: 'SET_SUCCESS', payload: 'Compte activé avec succès !' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: formatError(error) });
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.user]);
  
  const logout = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Log de déconnexion
      dispatch({
        type: 'ADD_TECH_LOG',
        payload: {
          message: `Déconnexion utilisateur ${state.user?.firstName} ${state.user?.lastName}`,
          level: 'info',
          source: 'Auth',
        },
      });
      
      // Reset de l'état
      dispatch({ type: 'RESET_APP' });
      
    } catch (error) {
      dispatch({
        type: 'ADD_TECH_LOG',
        payload: {
          message: `Erreur déconnexion: ${formatError(error)}`,
          level: 'error',
          source: 'Auth',
        },
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user]);
  
  const saveProfileToDB = useCallback(async () => {
    if (!state.user || !isSupabaseConfigured() || state.ui.isSaving) {
      return;
    }
    
    // Vérifier si des changements réels ont eu lieu
    const currentUserHash = JSON.stringify({
      id: state.user.id,
      firstName: state.user.firstName,
      lastName: state.user.lastName,
      depot: state.user.depot,
      preferences: state.preferences,
    });
    
    const currentPrefsHash = JSON.stringify(state.preferences);
    
    if (
      lastSaveRef.current.user === currentUserHash &&
      lastSaveRef.current.prefs === currentPrefsHash
    ) {
      return; // Aucun changement
    }
    
    dispatch({ type: 'SET_SAVING', payload: true });
    
    try {
      await profileService.updateProfile(state.user.id, {
        first_name: state.user.firstName,
        last_name: state.user.lastName,
        depot: state.user.depot,
        preferences: state.preferences,
        rgpd_consent: state.rgpdConsent,
        updated_at: new Date().toISOString(),
      });
      
      // Mettre à jour les références de sauvegarde
      lastSaveRef.current = {
        user: currentUserHash,
        prefs: currentPrefsHash,
      };
      
      dispatch({ type: 'MARK_USER_SYNCED' });
      
      // Log de succès
      dispatch({
        type: 'ADD_TECH_LOG',
        payload: {
          message: 'Profil synchronisé avec succès',
          level: 'info',
          source: 'Sync',
          metadata: { userId: state.user.id },
        },
      });
      
    } catch (error) {
      dispatch({
        type: 'ADD_TECH_LOG',
        payload: {
          message: `Échec synchronisation: ${formatError(error)}`,
          level: 'error',
          source: 'Sync',
          metadata: { error, userId: state.user.id },
        },
      });
      
      // Ne pas marquer comme synchronisé en cas d'erreur
      dispatch({ type: 'SET_ERROR', payload: 'Échec de la synchronisation' });
      
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.user, state.preferences, state.rgpdConsent, state.ui.isSaving]);
  
  const publishDutyForSwap = useCallback(async (duty: Duty, isUrgent = false) => {
    if (!state.user || !isSupabaseConfigured()) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Utilisateur non connecté ou configuration manquante',
      });
      return;
    }
    
    // Validation RGPS avant publication
    const rgpsValidation = validateRGPS(duty);
    if (!rgpsValidation.valid) {
      dispatch({
        type: 'SET_ERROR',
        payload: `Service invalide: ${rgpsValidation.violations.join(', ')}`,
      });
      return;
    }
    
    dispatch({ type: 'SET_SAVING', payload: true });
    
    try {
      await swapService.publishForSwap(state.user, duty, isUrgent);
      
      dispatch({
        type: 'SET_SUCCESS',
        payload: `Service ${duty.code} publié pour échange${isUrgent ? ' (URGENT)' : ''}`,
      });
      
      dispatch({
        type: 'ADD_TECH_LOG',
        payload: {
          message: `Service publié: ${duty.code} (${duty.date})`,
          level: 'info',
          source: 'Swap',
          metadata: { dutyId: duty.id, isUrgent },
        },
      });
      
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: `Échec publication: ${formatError(error)}`,
      });
      
      dispatch({
        type: 'ADD_TECH_LOG',
        payload: {
          message: `Erreur publication service: ${formatError(error)}`,
          level: 'error',
          source: 'Swap',
          metadata: { error, dutyId: duty.id },
        },
      });
      
      throw error;
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.user]);
  
  // ==========================================================================
  // ACTIONS SYNCHRONES
  // ==========================================================================
  
  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  }, []);

  const setPreferences = useCallback((preferences: UserPreference[]) => {
    dispatch({ type: 'SET_PREFERENCES', payload: preferences });
  }, []);
  
  const updatePreferences = useCallback((preferences: UserPreference[]) => {
    dispatch({ type: 'SET_PREFERENCES', payload: preferences });
  }, []);
  
  const updatePreference = useCallback((id: string, updates: Partial<UserPreference>) => {
    dispatch({ type: 'UPDATE_PREFERENCE', payload: { id, updates } });
  }, []);
  
  const addPreference = useCallback((preference: UserPreference) => {
    dispatch({ type: 'ADD_PREFERENCE', payload: preference });
  }, []);
  
  const removePreference = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_PREFERENCE', payload: id });
  }, []);
  
  const setError = useCallback((message: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: message });
  }, []);
  
  const setSuccess = useCallback((message: string | null) => {
    dispatch({ type: 'SET_SUCCESS', payload: message });
  }, []);

  const setSuccessMessage = useCallback((message: string | null) => {
    dispatch({ type: 'SET_SUCCESS', payload: message });
  }, []);
  
  const setWarning = useCallback((message: string | null) => {
    dispatch({ type: 'SET_WARNING', payload: message });
  }, []);
  
  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);
  
  const addTechLog = useCallback((
    message: string,
    level: TechLog['level'] = 'info',
    source?: string,
    metadata?: Record<string, any>
  ) => {
    dispatch({
      type: 'ADD_TECH_LOG',
      payload: { message, level, source, metadata },
    });
  }, []);
  
  const clearTechLogs = useCallback(() => {
    dispatch({ type: 'CLEAR_LOGS' });
  }, []);
  
  // ==========================================================================
  // VALIDATIONS ET UTILITAIRES
  // ==========================================================================
  
  const validateDepot = useCallback((depotCode: string): boolean => {
    return DEPOT_MAP.has(depotCode);
  }, []);
  
  const validateRGPS = useCallback((duty: Duty, otherDuties: Duty[] = []): { valid: boolean; violations: string[] } => {
    const violations: string[] = [];
    
    // Durée maximale
    if ((duty.duration || 0) > RGPS_RULES.MAX_SERVICE_DURATION_HOURS) {
      violations.push(`Durée trop longue: ${duty.duration}h > ${RGPS_RULES.MAX_SERVICE_DURATION_HOURS}h`);
    }
    
    // Service de nuit
    if (duty.isNightShift) {
      // Vérifier le nombre de services de nuit consécutifs
      const nightShiftsCount = otherDuties.filter(d => d.isNightShift).length;
      if (nightShiftsCount >= RGPS_RULES.MAX_NIGHT_SHIFTS_PER_WEEK) {
        violations.push(`Trop de services de nuit: ${nightShiftsCount + 1}/${RGPS_RULES.MAX_NIGHT_SHIFTS_PER_WEEK}`);
      }
    }
    
    // Temps de repos (simplifié)
    const lastDuty = otherDuties[otherDuties.length - 1];
    if (lastDuty) {
      // Vérifier qu'il y a au moins 11h de repos
      // Note: Implémentation simplifiée - devrait utiliser les dates/heures réelles
      violations.push('Vérification temps de repos requise (implémentation à compléter)');
    }
    
    return {
      valid: violations.length === 0,
      violations,
    };
  }, []);
  
  const getComputedPreferences = useCallback(() => {
    const likes = state.preferences.filter(p => p.level === 'LIKE');
    const dislikes = state.preferences.filter(p => p.level === 'DISLIKE');
    const neutrals = state.preferences.filter(p => p.level === 'NEUTRAL');
    
    // Trier par priorité
    const sortByPriority = (a: UserPreference, b: UserPreference) => 
      (b.priority || 0) - (a.priority || 0);
    
    return {
      likes: likes.sort(sortByPriority),
      dislikes: dislikes.sort(sortByPriority),
      neutrals: neutrals.sort(sortByPriority),
    };
  }, [state.preferences]);
  
  // ==========================================================================
  // VALEURS CALCULÉES
  // ==========================================================================
  
  const isOnline = useMemo(() => navigator.onLine, []);
  const isInitialized = useMemo(() => state.user !== null, [state.user]);
  const hasPendingChanges = useMemo(() => state.hasUnsyncedChanges, [state.hasUnsyncedChanges]);
  
  // ==========================================================================
  // CONTEXTE VALUE
  // ==========================================================================
  
  const contextValue: AppContextType = useMemo(() => ({
    // État
    ...state,
    isSaving: state.ui.isSaving,
    
    // Actions utilisateur
    login,
    logout,
    loadUserProfile,
    updateUserProfile,
    completeOnboarding,
    
    // Gestion préférences
    setPreferences,
    updatePreferences,
    updatePreference,
    addPreference,
    removePreference,
    
    // Gestion SWAP
    publishDutyForSwap,
    
    // Gestion messages
    setError,
    setSuccess,
    setSuccessMessage,
    setWarning,
    clearMessages,
    
    // Logs
    addTechLog,
    clearTechLogs,
    
    // Utilitaires
    validateDepot,
    validateRGPS,
    getComputedPreferences,
    
    // État calculé
    isOnline,
    isInitialized,
    hasPendingChanges,
    
  }), [
    state,
    login,
    logout,
    loadUserProfile,
    updateUserProfile,
    completeOnboarding,
    setPreferences,
    updatePreferences,
    updatePreference,
    addPreference,
    removePreference,
    publishDutyForSwap,
    setError,
    setSuccess,
    setSuccessMessage,
    setWarning,
    clearMessages,
    addTechLog,
    clearTechLogs,
    validateDepot,
    validateRGPS,
    getComputedPreferences,
    isOnline,
    isInitialized,
    hasPendingChanges,
  ]);
  
  // ==========================================================================
  // RENDU
  // ==========================================================================
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp doit être utilisé à l\'intérieur d\'un AppProvider');
  }
  return context;
};

// ============================================================================
// HOOKS DÉRIVÉS (pour une utilisation plus spécifique)
// ============================================================================

/**
 * Hook pour accéder uniquement aux préférences de l'utilisateur
 */
export const usePreferences = () => {
  const { preferences, updatePreferences, updatePreference, addPreference, removePreference } = useApp();
  return { preferences, updatePreferences, updatePreference, addPreference, removePreference };
};

/**
 * Hook pour accéder uniquement aux logs techniques
 */
export const useTechLogs = () => {
  const { techLogs, addTechLog, clearTechLogs } = useApp();
  return { techLogs, addTechLog, clearTechLogs };
};

/**
 * Hook pour accéder uniquement aux messages UI
 */
export const useAppMessages = () => {
  const { ui: { error, success, warning }, setError, setSuccess, setWarning, clearMessages } = useApp();
  return { error, success, warning, setError, setSuccess, setWarning, clearMessages };
};

/**
 * Hook pour accéder uniquement aux informations utilisateur
 */
export const useUser = () => {
  const { user, updateUserProfile, logout, isInitialized } = useApp();
  return { user, updateUserProfile, logout, isInitialized };
};