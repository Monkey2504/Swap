
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
      console.error("[useDuties] Erreur lors de la récupération:", errorMsg, err);
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
      const errorMsg = formatError(err);
      console.error("[useDuties] Erreur lors de l'ajout:", errorMsg, err);
      throw new Error(errorMsg);
    }
  }, [fetchDuties]);

  const addDuties = useCallback(async (dutiesData: CreateDutyDTO[]) => {
    try {
      const created = await dutyService.createDuties(dutiesData);
      await fetchDuties();
      return created;
    } catch (err) {
      const errorMsg = formatError(err);
      console.error("[useDuties] Erreur lors de l'ajout groupé:", errorMsg, err);
      throw new Error(errorMsg);
    }
  }, [fetchDuties]);

  const removeDuty = useCallback(async (id: string) => {
    try {
      await dutyService.deleteDuty(id);
      await fetchDuties();
    } catch (err) {
      const errorMsg = formatError(err);
      console.error("[useDuties] Erreur lors de la suppression:", errorMsg, err);
      throw new Error(errorMsg);
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
