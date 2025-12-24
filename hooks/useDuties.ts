
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Duty, CreateDutyDTO, DutyValidationResult, DutyWithSwapStatus } from '../types';
import { dutyService, formatError } from '../lib/api';
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
  const {
    autoRefresh = true,
    refreshInterval = APP_CONFIG.POLLING_INTERVAL_MS,
    onError,
    onSuccess,
  } = options;

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);
  const optimisticUpdatesRef = useRef<Map<string, Duty>>(new Map());
  const retryCountRef = useRef<number>(0);
  const refreshTimerRef = useRef<any>(null);

  const [duties, setDuties] = useState<DutyWithSwapStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

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
    const violations: string[] = [];
    let totalHours = 0;
    let nightShifts = 0;
    let weekendShifts = 0;

    duties.forEach(duty => {
      totalHours += duty.duration || 0;
      if (duty.isNightShift) nightShifts++;
      const dutyDate = new Date(duty.date);
      const dayOfWeek = dutyDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) weekendShifts++;
      if ((duty.duration || 0) > RGPS_RULES.MAX_SERVICE_DURATION_HOURS) {
        violations.push(`Service ${duty.code}: durée excessive (${duty.duration}h)`);
      }
    });

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

  const cancelPendingRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleError = useCallback((err: unknown, context: string) => {
    if (err instanceof Error && err.name === 'AbortError') return;

    const errorMsg = formatError(err);
    console.error(`[useDuties] Error during ${context}:`, err);

    if (isMountedRef.current) {
      setError(errorMsg);
    }

    if (onError) {
      onError(err instanceof Error ? err : new Error(errorMsg));
    }
  }, [onError]);

  const validateDuty = useCallback((duty: Duty | CreateDutyDTO): DutyValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!duty.code?.trim()) errors.push('Code de service requis');
    if (!duty.date) errors.push('Date requise');
    if (!duty.startTime) errors.push('Heure de début requise');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      duty: duty as Duty,
    };
  }, []);

  const fetchDuties = useCallback(async () => {
    if (!userId) return;
    if (isFetching) return;

    cancelPendingRequest();
    abortControllerRef.current = new AbortController();
    
    setIsFetching(true);
    setError(null);

    try {
      const data = await dutyService.getUserDuties(userId);
      if (!isMountedRef.current) return;

      setDuties(data as DutyWithSwapStatus[]);
      setLastUpdated(Date.now());
      setHasChanges(false);
      lastFetchRef.current = Date.now();
      retryCountRef.current = 0;

      if (onSuccess) onSuccess(data);
    } catch (err) {
      handleError(err, 'fetch');
    } finally {
      if (isMountedRef.current) {
        setIsFetching(false);
        setIsLoading(false);
      }
    }
  }, [userId, isFetching, cancelPendingRequest, handleError, onSuccess]);

  const addDuty = useCallback(async (dutyData: CreateDutyDTO): Promise<Duty> => {
    if (!userId) throw new Error('Utilisateur non identifié');
    setIsSaving(true);
    try {
      const createdDuty = await dutyService.createDuty(dutyData);
      await fetchDuties();
      return createdDuty;
    } catch (err) {
      handleError(err, 'add');
      throw err;
    } finally {
      if (isMountedRef.current) setIsSaving(false);
    }
  }, [userId, fetchDuties, handleError]);

  const updateDuty = useCallback(async (id: string, updates: Partial<Duty>): Promise<Duty> => {
    setIsSaving(true);
    try {
      const result = await dutyService.updateDuty(id, updates);
      await fetchDuties();
      return result;
    } catch (err) {
      handleError(err, 'update');
      throw err;
    } finally {
      if (isMountedRef.current) setIsSaving(false);
    }
  }, [fetchDuties, handleError]);

  const removeDuty = useCallback(async (id: string): Promise<void> => {
    setIsSaving(true);
    try {
      await dutyService.deleteDuty(id);
      await fetchDuties();
    } catch (err) {
      handleError(err, 'remove');
      throw err;
    } finally {
      if (isMountedRef.current) setIsSaving(false);
    }
  }, [fetchDuties, handleError]);

  const syncWithServer = useCallback(async (): Promise<SyncResult> => {
    try {
      await fetchDuties();
      return { success: true, added: 0, updated: 0, removed: 0, conflicts: [] };
    } catch (err) {
      return { success: false, added: 0, updated: 0, removed: 0, conflicts: [] };
    }
  }, [fetchDuties]);

  const reset = useCallback(() => {
    setDuties([]);
    setError(null);
    setIsLoading(false);
    setIsFetching(false);
    setIsSaving(false);
    cancelPendingRequest();
  }, [cancelPendingRequest]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancelPendingRequest();
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [cancelPendingRequest]);

  useEffect(() => {
    if (userId && duties.length === 0 && !isLoading && !isFetching) {
      setIsLoading(true);
      fetchDuties();
    }
  }, [userId, duties.length, isLoading, isFetching, fetchDuties]);

  return {
    duties,
    upcomingDuties,
    pastDuties,
    isLoading,
    isFetching,
    isSaving,
    error,
    fetchDuties,
    addDuty,
    updateDuty,
    removeDuty,
    validateDuty,
    lastUpdated,
    hasChanges,
    stats,
    refresh: fetchDuties,
    reset,
    syncWithServer,
  };
};
