import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

// Créer une nouvelle approvisonnements
export const useCreateApprovisonnement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api.post('/approvisonnements/createApprovisonement', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvisonnements'] });
      queryClient.invalidateQueries({ queryKey: ['produits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Update Approvisonnement
export const useUpdateApprovisonnement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      api.put(`/approvisonnements/updateApprovisonement/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvisonnements'] });
    },
  });
};

// Lire toutes les approvisonnements
export const useAllApprovisonnement = () =>
  useQuery({
    queryKey: ['approvisonnements'],
    queryFn: () =>
      api
        .get('/approvisonnements/getAllApprovisonements')
        .then((res) => res.data),
  });

/**
 * Pagination + recherche serveur — page Liste Approvisionnements.
 * @param {number} page   — numéro de page
 * @param {number} limit  — lignes par page (tableau)
 * @param {string} search — terme debouncé (produit, fournisseur, date, etc.)
 */
export const usePaginationApprovisonnements = (
  page = 1,
  limit = 50,
  search = ''
) =>
  useQuery({
    queryKey: ['approvisonnements', 'pagination', page, limit, search],
    queryFn: () =>
      api
        .get('/approvisonnements/paginationApprovisonements', {
          params: { page, limit, search: search.trim() || undefined },
        })
        .then((res) => res.data),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2,
  });

// Obtenir une Approvisonnement
export const useOneApprovisonnement = (id) =>
  useQuery({
    queryKey: ['getApprovisonnement', id],
    queryFn: () =>
      api
        .get(`/approvisonnements/getApprovisonement/${id}`)
        .then((res) => res.data),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, //chaque 5 minutes rafraichir les données
  });

// Supprimer une approvisonnements
export const useCancelApprovisonnement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.delete(`/approvisonnements/cancelApprovisonement/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvisonnements'] });
      queryClient.invalidateQueries({ queryKey: ['produits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Supprimer une approvisonnements
export const useDeleteApprovisonnement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.delete(`/approvisonnements/deleteApprovisonement/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvisonnements'] });
    },
  });
};
