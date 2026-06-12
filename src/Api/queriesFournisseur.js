import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

// Ajouter une Fournisseur
export const useCreateFournisseur = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.post('/fournisseurs/createFournisseur', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fournisseur'] });
      queryClient.invalidateQueries({ queryKey: ['fournisseurs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Obtenir une Fournisseur
export const useAllFournisseur = () =>
  useQuery({
    queryKey: ['fournisseur'],
    queryFn: () =>
      api.get('/fournisseurs/getAllFournisseurs').then((res) => res.data),
    staleTime: 1000 * 60 * 5, //chaque 5 minutes rafraichir les données
  });

/**
 * Pagination + recherche serveur — page FournisseurListe.
 * Remplace useAllFournisseur qui chargeait tous les fournisseurs d'un coup.
 *
 * @param {number} page
 * @param {number} limit
 * @param {string} search — terme debouncé (nom, email, téléphone…)
 */
export const usePaginationFournisseurs = (page = 1, limit = 50, search = '') =>
  useQuery({
    queryKey: ['fournisseur', 'pagination', page, limit, search],
    queryFn: () =>
      api
        .get('/fournisseurs/paginationFournisseurs', {
          params: {
            page,
            limit,
            search: search.trim() || undefined,
          },
        })
        .then((res) => res.data),
    staleTime: 0,
  });

// Obtenir une Fournisseur
export const useOneFournisseur = (id) =>
  useQuery({
    queryKey: ['fournisseur', id],
    queryFn: () =>
      api.get(`/fournisseurs/getOneFournisseur/${id}`).then((res) => res.data),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, //chaque 5 minutes rafraichir les données
  });

// Mettre à jour une Fournisseur
export const useUpdateFournisseur = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      api.put(`/fournisseurs/updateFournisseur/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fournisseur'] });
      queryClient.invalidateQueries({ queryKey: ['fournisseurs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Supprimer une Fournisseur
export const useDeleteFournisseur = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/fournisseurs/deleteFournisseur/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fournisseur'] });
      queryClient.invalidateQueries({ queryKey: ['fournisseurs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Supprimer toutes les fournisseurs
export const useDeleteAllFournisseur = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/fournisseurs/deleteAllFournisseurs'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fournisseur'] });
      queryClient.invalidateQueries({ queryKey: ['fournisseurs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
