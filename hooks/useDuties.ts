
import { useState, useEffect, useCallback, useRef } from 'react';
import { dutyService } from '../lib/api';
import { Duty, CreateDutyDTO } from '../types';

/**
 * Hook SNCB : Gère l'état et les opérations sur les tours de service de l'agent
 */
export const useDuties = (userId: string | undefined) => {
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isFetching = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchDuties = useCallback(async () => {
    if (!userId || isFetching.current) return;
    
    isFetching.current = true;
    setLoading(true);
    
    try {
      // Renommé pour cohérence avec le service
      const data = await dutyService.getUserDuties(userId);
      if (isMounted.current) {
        setDuties(data);
        setError(null);
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError(err.message || 'Erreur lors du chargement du planning.');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      isFetching.current = false;
    }
  }, [userId]);

  useEffect(() => {
    fetchDuties();
  }, [fetchDuties]);

  const addDuty = async (duty: CreateDutyDTO) => {
    try {
      const created = await dutyService.createDuty(duty);
      if (isMounted.current) {
        setDuties(prev => [...prev, created]);
      }
      return created;
    } catch (err: any) {
      if (isMounted.current) {
        setError(err.message);
      }
      throw err;
    }
  };

  const removeDuty = async (id: string) => {
    try {
      await dutyService.deleteDuty(id);
      if (isMounted.current) {
        setDuties(prev => prev.filter(d => d.id !== id));
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError("Échec de la suppression sur le serveur : " + err.message);
      }
      throw err;
    }
  };

  return {
    duties,
    loading,
    error,
    refreshDuties: fetchDuties,
    addDuty,
    removeDuty
  };
};
