import { useQuery } from '@tanstack/react-query';
import api from './api';

/** Fuseau IANA du navigateur — aligne les dates avec l'affichage local */
const getClientTimezone = () =>
  typeof window !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC';

/**
 * Stats journalières — page RapportByDay.
 * @param {string} dateKey — YYYY-MM-DD (en-CA)
 */
export const useRapportJournalier = (dateKey) => {
  const timezone = getClientTimezone();

  return useQuery({
    queryKey: ['rapports', 'journalier', dateKey, timezone],
    queryFn: () =>
      api
        .get('/rapports/rapportJournalier', {
          params: { date: dateKey, timezone },
        })
        .then((res) => res.data),
    enabled: Boolean(dateKey),
    staleTime: 0,
  });
};

/**
 * Stats sur une période — page RapportBySemaine.
 */
export const useRapportPeriode = (startDate, endDate) => {
  const timezone = getClientTimezone();

  return useQuery({
    queryKey: ['rapports', 'periode', startDate, endDate, timezone],
    queryFn: () =>
      api
        .get('/rapports/rapportPeriode', {
          params: { startDate, endDate, timezone },
        })
        .then((res) => res.data),
    enabled: Boolean(startDate && endDate),
    staleTime: 0,
  });
};

/**
 * Stats mensuelles — page SelectedMounthTotalResult.
 * @param {number} month — 0 (janvier) à 11 (décembre)
 * @param {number} year
 */
export const useRapportMensuel = (month, year) => {
  const timezone = getClientTimezone();

  return useQuery({
    queryKey: ['rapports', 'mensuel', month, year, timezone],
    queryFn: () =>
      api
        .get('/rapports/rapportMensuel', {
          params: { month, year, timezone },
        })
        .then((res) => res.data),
    staleTime: 0,
  });
};

/**
 * Données agrégées par mois pour les graphiques — DataRaports*.js
 */
export const useStatsGraphiquesMensuels = (year) => {
  const timezone = getClientTimezone();

  return useQuery({
    queryKey: ['rapports', 'graphiques', year, timezone],
    queryFn: () =>
      api
        .get('/rapports/statsGraphiquesMensuels', {
          params: { year, timezone },
        })
        .then((res) => res.data),
    staleTime: 1000 * 60 * 2,
  });
};
