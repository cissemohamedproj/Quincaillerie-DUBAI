import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

// Créer une nouvelle Depense
export const useCreateDepense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/depenses/createDepense', data),
    onSuccess: () => queryClient.invalidateQueries(['depenses']),
  });
};

// Mettre à jour une Depense
export const useUpdateDepense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      api.put(`/depenses/updateDepense/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries(['depenses']),
  });
};
// Lire toutes les depenses
export const useAllDepenses = () =>
  useQuery({
    queryKey: ['depenses'],
    queryFn: () => api.get('/depenses/getAllDepense').then((res) => res.data),
  });

/**
 * Pagination + recherche + filtre « aujourd'hui » — page DepenseListe.
 * Remplace useAllDepenses qui chargeait toutes les dépenses d'un coup.
 *
 * @param {number} page
 * @param {number} limit
 * @param {string} search — terme debouncé
 * @param {object} filters — { today } (bouton toggle)
 */
export const usePaginationDepenses = (
  page = 1,
  limit = 50,
  search = '',
  filters = {}
) => {
  const clientToday =
    typeof window !== 'undefined'
      ? new Date().toLocaleDateString('en-CA')
      : undefined;
  const clientTimezone =
    typeof window !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : undefined;

  return useQuery({
    queryKey: [
      'depenses',
      'pagination',
      page,
      limit,
      search,
      filters.today,
      filters.today ? clientToday : null,
    ],
    queryFn: () =>
      api
        .get('/depenses/paginationDepenses', {
          params: {
            page,
            limit,
            search: search.trim() || undefined,
            today: filters.today ? 'true' : undefined,
            todayDate: filters.today ? clientToday : undefined,
            timezone: filters.today ? clientTimezone : undefined,
          },
        })
        .then((res) => res.data),
    staleTime: 0,
  });
};

// Obtenir une Depense
export const useOneDepense = (id) =>
  useQuery({
    queryKey: ['depenses', id],
    queryFn: () =>
      api.get(`/depenses/getDepenseById/${id}`).then((res) => res.data),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, // chaque 5 minutes rafraichir les données
  });

// Supprimer une Depense
export const useDeleteDepense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/depenses/deleteDepense/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['depenses']),
  });
};
