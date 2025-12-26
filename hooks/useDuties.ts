
import { useState, useEffect, useCallback } from 'react';
import { Duty, CreateDutyDTO, DutyWithSwapStatus } from '../types';
import { dutyService, formatError } from '../lib/api';

export const useDuties = (
  userId: string | undefined
) => {
  const [duties, setDuties] = useState<DutyWithSwapStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDuties = useCallback(async () => {
    if (!userId) {
      setDuties([]);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const data = await dutyService.getUserDuties(userId);
      setDuties(data || []);
    } catch (err: any) {
      const errorMsg = formatError(err);
      console.error("[useDuties] Erreur lors de la récupération:", err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const addDuty = useCallback(async (dutyData: CreateDutyDTO) => {
    try {
      const created = await dutyService.createDuty(dutyData);
      await fetchDuties();
      return created;
    } catch (err) {
      console.error("[useDuties] Erreur lors de l'ajout:", err);
      throw err;
    }
  }, [fetchDuties]);

  const addDuties = useCallback(async (dutiesData: CreateDutyDTO[]) => {
    try {
      const created = await dutyService.createDuties(dutiesData);
      await fetchDuties();
      return created;
    } catch (err) {
      console.error("[useDuties] Erreur lors de l'ajout groupé:", err);
      throw err;
    }
  }, [fetchDuties]);

  const removeDuty = useCallback(async (id: string) => {
    try {
      await dutyService.deleteDuty(id);
      await fetchDuties();
    } catch (err) {
      console.error("[useDuties] Erreur lors de la suppression:", err);
      throw err;
    }
  }, [fetchDuties]);

  useEffect(() => {
    if (userId) {
      fetchDuties();
    }
  }, [userId, fetchDuties]);

  return {
    duties,
    isLoading,
    error,
    fetchDuties,
    refresh: fetchDuties,
    addDuty,
    addDuties,
    removeDuty
  };
};
