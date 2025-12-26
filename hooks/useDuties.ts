import { useState, useEffect, useCallback, useRef } from 'react';
import { Duty, CreateDutyDTO, DutyWithSwapStatus } from '../types';
import { dutyService, formatError } from '../lib/api';
import { APP_CONFIG } from '../constants';

interface UseDutiesOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onError?: (error: string) => void;
}

interface UseDutiesReturn {
  duties: DutyWithSwapStatus[];
  isLoading: boolean;
  error: string | null;
  fetchDuties: () => Promise<void>;
  refresh: () => Promise<void>;
  addDuty: (dutyData: CreateDutyDTO) => Promise<Duty>;
  addDuties: (dutiesData: CreateDutyDTO[]) => Promise<Duty[]>;
  removeDuty: (id: string) => Promise<void>;
  clearError: () => void;
  lastUpdated: Date | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export const useDuties = (
  userId: string | undefined,
  options: UseDutiesOptions = {}
): UseDutiesReturn => {
  const {
    autoRefresh = true,
    refreshInterval = APP_CONFIG.POLLING_INTERVAL_MS,
    onError
  } = options;

  const [duties, setDuties] = useState<DutyWithSwapStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchDuties = useCallback(async (page = 1, append = false) => {
    if (!userId) {
      setDuties([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await dutyService.getUserDuties(userId, { page, limit: 20 });
      
      if (!isMountedRef.current) return;

      if (append) {
        setDuties(prev => [...prev, ...data]);
      } else {
        setDuties(data || []);
      }

      setHasMore(data.length === 20); // Si on a 20 éléments, il y en a peut-être plus
      setCurrentPage(page);
      setLastUpdated(new Date());
      
    } catch (err: any) {
      if (!isMountedRef.current) return;
      
      const errorMsg = formatError(err);
      console.error("[useDuties] Erreur lors de la récupération:", errorMsg, err);
      
      setError(errorMsg);
      
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId, onError]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    
    await fetchDuties(currentPage + 1, true);
  }, [hasMore, isLoading, currentPage, fetchDuties]);

  const refresh = useCallback(async () => {
    await fetchDuties(1, false);
  }, [fetchDuties]);

  const addDuty = useCallback(async (dutyData: CreateDutyDTO): Promise<Duty> => {
    try {
      const created = await dutyService.createDuty(dutyData);
      await refresh();
      return created;
    } catch (err) {
      const errorMsg = formatError(err);
      console.error("[useDuties] Erreur lors de l'ajout:", errorMsg, err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [refresh]);

  const addDuties = useCallback(async (dutiesData: CreateDutyDTO[]): Promise<Duty[]> => {
    try {
      if (dutiesData.length === 0) {
        return [];
      }

      const created = await dutyService.createDuties(dutiesData);
      await refresh();
      return created;
    } catch (err) {
      const errorMsg = formatError(err);
      console.error("[useDuties] Erreur lors de l'ajout groupé:", errorMsg, err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [refresh]);

  const removeDuty = useCallback(async (id: string): Promise<void> => {
    try {
      await dutyService.deleteDuty(id);
      
      // Optimistic update
      setDuties(prev => prev.filter(duty => duty.id !== id));
      
      // Refresh to ensure consistency
      setTimeout(() => {
        if (isMountedRef.current) {
          refresh();
        }
      }, 500);
      
    } catch (err) {
      const errorMsg = formatError(err);
      console.error("[useDuties] Erreur lors de la suppression:", errorMsg, err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [refresh]);

  // Setup auto-refresh
  useEffect(() => {
    if (autoRefresh && userId) {
      refreshIntervalRef.current = setInterval(() => {
        if (isMountedRef.current && !isLoading) {
          refresh();
        }
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, userId, refreshInterval, isLoading, refresh]);

  // Initial fetch and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    if (userId) {
      fetchDuties();
    }

    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [userId, fetchDuties]);

  // Retry logic on error
  useEffect(() => {
    if (error && autoRefresh) {
      const retryTimeout = setTimeout(() => {
        if (isMountedRef.current && userId) {
          refresh();
        }
      }, APP_CONFIG.RETRY_DELAY_MS * 2);

      return () => clearTimeout(retryTimeout);
    }
  }, [error, autoRefresh, userId, refresh]);

  return {
    duties,
    isLoading,
    error,
    fetchDuties: refresh,
    refresh,
    addDuty,
    addDuties,
    removeDuty,
    clearError,
    lastUpdated,
    hasMore,
    loadMore,
  };
};

// Hook simplifié pour les besoins basiques
export const useDutiesSimple = (userId: string | undefined) => {
  return useDuties(userId, { autoRefresh: false });
};

// Hook pour le tableau de bord avec rafraîchissement automatique
export const useDutiesDashboard = (userId: string | undefined) => {
  return useDuties(userId, { 
    autoRefresh: true, 
    refreshInterval: APP_CONFIG.POLLING_INTERVAL_MS 
  });
};

// Hook pour l'édition avec contrôle manuel
export const useDutiesEditor = (userId: string | undefined) => {
  return useDuties(userId, { 
    autoRefresh: false 
  });
};