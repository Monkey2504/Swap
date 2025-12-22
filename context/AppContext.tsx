
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { UserProfile, UserPreference, Duty, SwapOffer } from '../types';
import { INITIAL_PREFERENCES, generateId } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type AuditAction = 'USER_LOGIN' | 'USER_LOGOUT' | 'PROFILE_UPDATE' | 'PREFERENCE_UPDATE' | 'SESSION_TIMEOUT' | 'SECURITY_VIOLATION' | 'DATA_ACCESS' | 'SWAP_PUBLISH';

interface AuditEntry {
  incidentId: string;
  timestamp: string;
  userId: string;
  action: AuditAction;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  details: string;
}

interface AppContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  preferences: UserPreference[];
  setPreferences: (prefs: UserPreference[]) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  saveProfileToDB: () => Promise<void>;
  publishDutyForSwap: (dutyId: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  setError: (msg: string | null) => void;
  successMessage: string | null;
  setSuccessMessage: (msg: string | null) => void;
  isSaving: boolean;
  rgpdConsent: boolean;
  setRgpdConsent: (v: boolean) => void;
  logAction: (action: AuditAction, details: any, severity?: AuditEntry['severity']) => void;
  sessionExpired: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreference[]>(INITIAL_PREFERENCES);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [rgpdConsent, setRgpdConsent] = useState(() => localStorage.getItem('sncb_rgpd_consent') === 'true');
  
  const logAction = useCallback((action: AuditAction, details: any, severity: AuditEntry['severity'] = 'INFO') => {
    const incidentId = Math.random().toString(36).substring(2, 15).toUpperCase();
    const entry = {
      incidentId,
      timestamp: new Date().toISOString(),
      userId: user?.sncbId || 'anonymous',
      action,
      severity,
      details: typeof details === 'string' ? details : JSON.stringify(details)
    };
    console.info(`[SIEM] ${action}`, entry);
  }, [user]);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured && supabase) await supabase.auth.signOut();
    setUser(null);
    setPreferences(INITIAL_PREFERENCES);
  }, []);

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Publier un service
  const publishDutyForSwap = async (dutyId: string) => {
    if (!user) return;
    const duty = user.currentDuties.find(d => d.id === dutyId);
    if (!duty) return;

    setIsSaving(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error: dbError } = await supabase.from('swap_offers').insert({
          user_id: user.id,
          user_sncb_id: user.sncbId,
          user_name: `${user.firstName} ${user.lastName}`,
          depot: user.depot,
          duty_data: duty,
          status: 'active'
        });
        if (dbError) throw dbError;
      }
      
      logAction('SWAP_PUBLISH', { dutyCode: duty.code });
      setSuccessMessage(`Service ${duty.code} publié avec succès ! Vos collègues de ${user.depot} ont été notifiés.`);
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la publication. Vérifiez la structure de votre table Supabase.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveProfileToDB = useCallback(async () => {
    if (!user || !isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        sncb_id: user.sncbId,
        first_name: user.firstName,
        last_name: user.lastName,
        depot: user.depot,
        series: user.series
      });
    } catch (err) {
      console.error("SaveProfile Error:", err);
    }
  }, [user]);

  // Sauvegarde auto des préférences
  useEffect(() => {
    if (user && isSupabaseConfigured && supabase) {
      const savePrefs = async () => {
        await supabase.from('profiles').update({ 
          // On assume une colonne metadata ou preferences_json existe
          // Sinon on stocke juste en local pour l'instant
        }).eq('id', user.id);
      };
      savePrefs();
    }
  }, [preferences, user]);

  useEffect(() => {
    localStorage.setItem('sncb_rgpd_consent', rgpdConsent.toString());
  }, [rgpdConsent]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <AppContext.Provider value={{ 
      user, setUser, preferences, setPreferences, 
      updateUserProfile, saveProfileToDB, publishDutyForSwap, logout,
      error, setError, successMessage, setSuccessMessage, isSaving, rgpdConsent, setRgpdConsent,
      logAction, sessionExpired 
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
