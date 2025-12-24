
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Duty, CreateDutyDTO, DutyValidationResult, DutyWithSwapStatus } from '../types';
import { dutyService } from '../lib/api';
import { RGPS_RULES, APP_CONFIG } from '../constants';

// ============================================================================
// INTERFACES ET TYPES
// ============================================================================

interface UseDutiesOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onError?: (error: Error) => void;
  onSuccess?: (duties: Duty[]) => void;
}

interface UseDutiesReturn {
  // Données
  duties: DutyWithSwapStatus[];
  upcomingDuties: DutyWithSwapStatus[];
  pastDuties: DutyWithSwapStatus[];
  
  // États
  isLoading: boolean;
  isFetching: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Actions
  fetchDuties: () => Promise<void>;
  addDuty: (duty: CreateDutyDTO) => Promise<Duty>;
  updateDuty: (id: string, updates: Partial<Duty>) => Promise<Duty>;
  removeDuty: (id: string) => Promise<void>;
  validateDuty: (duty: Duty | CreateDutyDTO) => DutyValidationResult;
  
  // Métadonnées
  lastUpdated: number | null;
  hasChanges: boolean;
  stats: DutyStats;
  
  // Gestion de cache/sync
  refresh: () => Promise<void>;
  reset: () => void;
  syncWithServer: () => Promise<SyncResult>;
}

interface DutyStats {
  totalCount: number;
  upcomingCount: number;
  pastCount: number;
  totalHours: number;
  nightShifts: number;
  weekendShifts: number;
  violations: string[];
}

interface SyncResult {
  success: boolean;
  added: number;
  updated: number;
  removed: number;
  conflicts: DutyConflict[];
}

interface DutyConflict {
  localDuty: Duty;
  serverDuty: Duty;
  resolution: 'local' | 'server' | 'merged';
}

// ============================================================================
// IMPLÉMENTATION
// ============================================================================

export const useDuties = (
  userId: string | undefined,
  options: UseDutiesOptions = {}
): UseDutiesReturn => {
  // Destructuration des options avec valeurs par défaut
  const {
    autoRefresh = true,
    refreshInterval = APP_CONFIG.POLLING_INTERVAL_MS,
    onError,
    onSuccess,
  } = options;

  // ==========================================================================
  // RÉFÉRENCES
  // ==========================================================================

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);
  const optimisticUpdatesRef = useRef<Map<string, Duty>>(new Map());
  const retryCountRef = useRef<number>(0);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ==========================================================================
  // ÉTATS
  // ==========================================================================

  const [duties, setDuties] = useState<DutyWithSwapStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // ==========================================================================
  // MÉMOIZED VALUES
  // ==========================================================================

  const upcomingDuties = useMemo(() => {
    const now = new Date();
    return duties.filter(duty => {
      const dutyDate = new Date(duty.date);
      return dutyDate >= now || (duty.endTime && new Date(`${duty.date}T${duty.endTime}`) >= now);
    });
  }, [duties]);

  const pastDuties = useMemo(() => {
    const now = new Date();
    return duties.filter(duty => {
      const dutyDate = new Date(duty.date);
      return dutyDate < now && (!duty.endTime || new Date(`${duty.date}T${duty.endTime}`) < now);
    });
  }, [duties]);

  const stats = useMemo((): DutyStats => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const violations: string[] = [];
    let totalHours = 0;
    let nightShifts = 0;
    let weekendShifts = 0;

    // Calcul des statistiques
    duties.forEach(duty => {
      // Heures totales
      totalHours += duty.duration || 0;

      // Services de nuit
      if (duty.isNightShift) {
        nightShifts++;
      }

      // Weekends
      const dutyDate = new Date(duty.date);
      const dayOfWeek = dutyDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendShifts++;
      }

      // Vérifications RGPS basiques
      if ((duty.duration || 0) > RGPS_RULES.MAX_SERVICE_DURATION_HOURS) {
        violations.push(`Service ${duty.code}: durée excessive (${duty.duration}h)`);
      }
    });

    // Vérification hebdomadaire
    const weeklyDuties = duties.filter(duty => 
      new Date(duty.date) >= sevenDaysAgo
    );
    const weeklyHours = weeklyDuties.reduce((sum, duty) => sum + (duty.duration || 0), 0);
    
    if (weeklyHours > RGPS_RULES.MAX_WEEKLY_HOURS) {
      violations.push(`Heures hebdomadaires excessives: ${weeklyHours}h (max: ${RGPS_RULES.MAX_WEEKLY_HOURS}h)`);
    }

    return {
      totalCount: duties.length,
      upcomingCount: upcomingDuties.length,
      pastCount: pastDuties.length,
      totalHours,
      nightShifts,
      weekendShifts,
      violations,
    };
  }, [duties, upcomingDuties, pastDuties]);

  // ==========================================================================
  // FONCTIONS UTILITAIRES
  // ==========================================================================

  /**
   * Annule la requête en cours
   */
  const cancelPendingRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Gestion propre des erreurs
   */
  const handleError = useCallback((err: unknown, context: string) => {
    const error = err instanceof Error ? err : new Error(String(err));
    
    // Ne pas traiter les annulations comme des erreurs
    if (error.name === 'AbortError') {
      return;
    }

    // Journalisation
    console.error(`[useDuties] ${context}:`, error);

    // Mise à jour de l'état d'erreur
    if (isMountedRef.current) {
      setError(error.message);
    }

    // Callback d'erreur
    if (onError) {
      onError(error);
    }

    // Stratégie de retry
    if (retryCountRef.current < 3 && context === 'fetch') {
      retryCountRef.current++;
      setTimeout(() => {
        if (isMountedRef.current) {
          fetchDuties();
        }
      }, 1000 * retryCountRef.current); // Retry exponentiel
    }
  }, [onError]);

  /**
   * Validation d'un service
   */
  const validateDuty = useCallback((duty: Duty | CreateDutyDTO): DutyValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation basique
    if (!duty.code?.trim()) {
      errors.push('Code de service requis');
    }

    if (!duty.date) {
      errors.push('Date requise');
    }

    if (!duty.startTime) {
      errors.push('Heure de début requise');
    }

    // Validation RGPS
    if (duty.duration && duty.duration > RGPS_RULES.MAX_SERVICE_DURATION_HOURS) {
      errors.push(`Durée maximale dépassée: ${duty.duration}h > ${RGPS_RULES.MAX_SERVICE_DURATION_HOURS}h`);
    }

    // Vérification des conflits avec les services existants
    if ('id' in duty && duty.id) {
      // C'est un service existant
      const conflictingDuty = duties.find(d => 
        d.id !== duty.id && 
        d.date === duty.date &&
        ((d.startTime <= duty.startTime && d.endTime > duty.startTime) ||
         (d.startTime < duty.endTime && d.endTime >= duty.endTime))
      );

      if (conflictingDuty) {
        errors.push(`Conflit horaire avec le service ${conflictingDuty.code}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      duty: duty as Duty,
    };
  }, [duties]);

  // ==========================================================================
  // ACTIONS PRINCIPALES
  // ==========================================================================

  /**
   * Récupération des services
   */
  const fetchDuties = useCallback(async () => {
    if (!userId) {
      console.warn('[useDuties] Aucun userId fourni');
      return;
    }

    // Éviter les appels simultanés
    if (isFetching || isLoading) {
      return;
    }

    // Annuler la requête précédente
    cancelPendingRequest();

    // Créer un nouveau contrôleur d'annulation
    abortControllerRef.current = new AbortController();
    
    setIsFetching(true);
    setError(null);
    retryCountRef.current = 0;

    try {
      // Corrected arguments passed to dutyService.getUserDuties
      const data = await dutyService.getUserDuties(userId);

      if (!isMountedRef.current) return;

      // Appliquer les mises à jour optimistes
      const finalDuties = data.map(serverDuty => {
        const optimisticDuty = optimisticUpdatesRef.current.get(serverDuty.id);
        // Fixed property access with check
        if (optimisticDuty && optimisticDuty.updatedAt && serverDuty.updatedAt && optimisticDuty.updatedAt > serverDuty.updatedAt) {
          return optimisticDuty;
        }
        return serverDuty;
      });

      // Nettoyer les mises à jour optimistes appliquées
      optimisticUpdatesRef.current.clear();

      setDuties(finalDuties as DutyWithSwapStatus[]);
      setLastUpdated(Date.now());
      setHasChanges(false);
      lastFetchRef.current = Date.now();

      if (onSuccess) {
        onSuccess(finalDuties);
      }

    } catch (err) {
      handleError(err, 'fetch');
    } finally {
      if (isMountedRef.current) {
        setIsFetching(false);
        setIsLoading(false);
      }
    }
  }, [userId, isFetching, isLoading, cancelPendingRequest, handleError, onSuccess]);

  /**
   * Ajout d'un service
   */
  const addDuty = useCallback(async (dutyData: CreateDutyDTO): Promise<Duty> => {
    if (!userId) {
      throw new Error('Utilisateur non identifié');
    }

    // Validation
    const validation = validateDuty(dutyData);
    if (!validation.valid) {
      throw new Error(`Service invalide: ${validation.errors.join(', ')}`);
    }

    setIsSaving(true);

    try {
      // Mise à jour optimiste
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempDuty: DutyWithSwapStatus = {
        ...dutyData,
        id: tempId,
        user_id: userId, // Corrected userId to user_id
        status: 'draft',
        isSynced: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setDuties(prev => [...prev, tempDuty]);
      setHasChanges(true);

      // Appel API
      const createdDuty = await dutyService.createDuty(dutyData);

      // Remplacer le temporaire par la vraie donnée
      setDuties(prev => prev.map(duty => 
        duty.id === tempId ? { ...createdDuty, isSynced: true } : duty
      ));

      setLastUpdated(Date.now());
      return createdDuty;

    } catch (err) {
      // Rollback en cas d'erreur
      setDuties(prev => prev.filter(duty => !duty.id.startsWith('temp_')));
      handleError(err, 'add');
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [userId, validateDuty, handleError]);

  /**
   * Mise à jour d'un service
   */
  const updateDuty = useCallback(async (id: string, updates: Partial<Duty>): Promise<Duty> => {
    setIsSaving(true);

    try {
      // Mise à jour optimiste
      const previousDuty = duties.find(d => d.id === id);
      if (!previousDuty) {
        throw new Error('Service non trouvé');
      }

      const updatedDuty: DutyWithSwapStatus = {
        ...previousDuty,
        ...updates,
        updatedAt: new Date().toISOString(),
        isSynced: false,
      };

      // Validation
      const validation = validateDuty(updatedDuty);
      if (!validation.valid) {
        throw new Error(`Service invalide: ${validation.errors.join(', ')}`);
      }

      // Stocker la version optimiste
      optimisticUpdatesRef.current.set(id, updatedDuty);

      // Mettre à jour l'état local
      setDuties(prev => prev.map(duty => 
        duty.id === id ? updatedDuty : duty
      ));
      setHasChanges(true);

      // Appel API
      const result = await dutyService.updateDuty(id, updates);

      // Mettre à jour avec la réponse serveur
      const finalDuty: DutyWithSwapStatus = {
        ...result,
        isSynced: true,
      };

      setDuties(prev => prev.map(duty => 
        duty.id === id ? finalDuty : duty
      ));

      setLastUpdated(Date.now());
      return result;

    } catch (err) {
      // Rollback en cas d'erreur
      if (isMountedRef.current) {
        setDuties(prev => prev.map(duty => 
          optimisticUpdatesRef.current.has(duty.id) ? 
          duties.find(d => d.id === duty.id)! : duty
        ));
      }
      optimisticUpdatesRef.current.delete(id);
      handleError(err, 'update');
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [duties, validateDuty, handleError]);

  /**
   * Suppression d'un service
   */
  const removeDuty = useCallback(async (id: string): Promise<void> => {
    setIsSaving(true);

    try {
      // Vérifier si le service existe
      const dutyToRemove = duties.find(d => d.id === id);
      if (!dutyToRemove) {
        throw new Error('Service non trouvé');
      }

      // Vérifier les SWAP en cours
      if (dutyToRemove.swapStatus === 'pending' || dutyToRemove.swapStatus === 'in_progress') {
        throw new Error('Impossible de supprimer un service avec un SWAP en cours');
      }

      // Mise à jour optimiste
      setDuties(prev => prev.filter(duty => duty.id !== id));
      setHasChanges(true);

      // Appel API
      await dutyService.deleteDuty(id);

      setLastUpdated(Date.now());

    } catch (err) {
      // Rollback en cas d'erreur
      if (isMountedRef.current) {
        fetchDuties(); // Recharger les données
      }
      handleError(err, 'remove');
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [duties, fetchDuties, handleError]);

  /**
   * Synchronisation avec le serveur
   */
  const syncWithServer = useCallback(async (): Promise<SyncResult> => {
    if (!userId || isFetching || isSaving) {
      return {
        success: false,
        added: 0,
        updated: 0,
        removed: 0,
        conflicts: [],
      };
    }

    try {
      await fetchDuties();
      return {
        success: true,
        added: 0,
        updated: 0,
        removed: 0,
        conflicts: [],
      };
    } catch (err) {
      handleError(err, 'sync');
      return {
        success: false,
        added: 0,
        updated: 0,
        removed: 0,
        conflicts: [],
      };
    }
  }, [userId, isFetching, isSaving, fetchDuties, handleError]);

  /**
   * Réinitialisation du hook
   */
  const reset = useCallback(() => {
    setDuties([]);
    setError(null);
    setIsLoading(false);
    setIsFetching(false);
    setIsSaving(false);
    setLastUpdated(null);
    setHasChanges(false);
    optimisticUpdatesRef.current.clear();
    retryCountRef.current = 0;
    cancelPendingRequest();
  }, [cancelPendingRequest]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  // Gestion du cycle de vie
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      cancelPendingRequest();
      
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [cancelPendingRequest]);

  // Chargement initial
  useEffect(() => {
    if (userId && !isLoading && !isFetching && duties.length === 0) {
      setIsLoading(true);
      fetchDuties();
    }
  }, [userId, isLoading, isFetching, duties.length, fetchDuties]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !userId || refreshInterval <= 0) {
      return;
    }

    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    refreshTimerRef.current = setInterval(() => {
      if (isMountedRef.current && userId && !isFetching && !isSaving) {
        const timeSinceLastFetch = Date.now() - lastFetchRef.current;
        if (timeSinceLastFetch >= refreshInterval) {
          fetchDuties();
        }
      }
    }, refreshInterval);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, userId, refreshInterval, isFetching, isSaving, fetchDuties]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // Données
    duties,
    upcomingDuties,
    pastDuties,
    
    // États
    isLoading,
    isFetching,
    isSaving,
    error,
    
    // Actions
    fetchDuties,
    addDuty,
    updateDuty,
    removeDuty,
    validateDuty,
    
    // Métadonnées
    lastUpdated,
    hasChanges,
    stats,
    
    // Gestion de cache/sync
    refresh: fetchDuties,
    reset,
    syncWithServer,
  };
};

// ============================================================================
// HOOKS DÉRIVÉS
// ============================================================================

/**
 * Hook simplifié pour la lecture seule des services
 */
export const useDutiesReadOnly = (userId: string | undefined) => {
  const { duties, upcomingDuties, pastDuties, isLoading, error, fetchDuties } = useDuties(userId, {
    autoRefresh: true,
  });

  return {
    duties,
    upcomingDuties,
    pastDuties,
    isLoading,
    error,
    refresh: fetchDuties,
  };
};

/**
 * Hook pour la gestion des services à venir
 */
export const useUpcomingDuties = (userId: string | undefined) => {
  const { upcomingDuties, isLoading, error, fetchDuties } = useDuties(userId);

  return {
    duties: upcomingDuties,
    isLoading,
    error,
    refresh: fetchDuties,
  };
};

/**
 * Hook pour la validation RGPS
 */
export const useRGPSCheck = (duties: Duty[]) => {
  return useMemo(() => {
    const violations: string[] = [];
    
    // Vérifier les règles RGPS
    duties.forEach((duty, index) => {
      // Durée maximale
      if ((duty.duration || 0) > RGPS_RULES.MAX_SERVICE_DURATION_HOURS) {
        violations.push(`Service ${duty.code}: durée de ${duty.duration}h > ${RGPS_RULES.MAX_SERVICE_DURATION_HOURS}h max`);
      }
      
      // Temps de repos entre services (simplifié)
      if (index > 0) {
        const previousDuty = duties[index - 1];
        // Note: Implémentation simplifiée - devrait comparer les dates/heures réelles
        const hoursBetween = 12; // Placeholder
        if (hoursBetween < RGPS_RULES.MIN_REST_BETWEEN_SERVICES_HOURS) {
          violations.push(`Repos insuffisant entre ${previousDuty.code} et ${duty.code}: ${hoursBetween}h < ${RGPS_RULES.MIN_REST_BETWEEN_SERVICES_HOURS}h min`);
        }
      }
    });
    
    return {
      isValid: violations.length === 0,
      violations,
      count: violations.length,
    };
  }, [duties]);
};