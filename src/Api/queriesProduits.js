import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

// Créer une nouvelle produits
export const useCreateProduit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/produits/addProduit', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Mettre à jour une produits
export const useUpdateProduit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      api.put(`/produits/updateProduit/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Lire toutes les produits
export const useAllProduit = () =>
  useQuery({
    queryKey: ['produits'],
    queryFn: () => api.get('/produits/getAllProduits').then((res) => res.data),
  });

/**
 * Pagination + recherche serveur — page Liste Produits.
 * @param {number} page   — numéro de page (1-based)
 * @param {number} limit  — produits par page (grille de cartes)
 * @param {string} search — terme debouncé envoyé au backend
 */
export const usePaginationProduits = (page = 1, limit = 24, search = '') =>
  useQuery({
    queryKey: ['produits', 'pagination', page, limit, search],
    queryFn: () =>
      api
        .get('/produits/paginationProduits', {
          params: { page, limit, search: search.trim() || undefined },
        })
        .then((res) => res.data),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2,
  });

// Produit dont le Stock est terminé / faible
export const useAllProduitWithStockInferieure = () =>
  useQuery({
    queryKey: ['produits', 'stockFaible'],
    queryFn: () =>
      api.get('/produits/getAllProduitWithStockFinish').then((res) => res.data),
  });

/**
 * Pagination + recherche serveur — page Produits en stock faible (stock < 10).
 */
export const usePaginationProduitStockFaible = (
  page = 1,
  limit = 24,
  search = ''
) =>
  useQuery({
    queryKey: ['produits', 'stockFaible', 'pagination', page, limit, search],
    queryFn: () =>
      api
        .get('/produits/paginationProduitStockFaible', {
          params: { page, limit, search: search.trim() || undefined },
        })
        .then((res) => res.data),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2,
  });

// Obtenir un Produit
export const useOneProduit = (id) =>
  useQuery({
    queryKey: ['getProduit', id],
    queryFn: () =>
      api.get(`/produits/getOneProduit/${id}`).then((res) => res.data),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, //chaque 5 minutes rafraichir les données
  });

// Affficher le produit lors de l'approvisonnement
export const useOneProduitWhenApprovisionne = (id) =>
  useQuery({
    queryKey: ['getProduit', id],
    queryFn: () => api.get(`/approvisonnement/${id}`).then((res) => res.data),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, //chaque 5 minutes rafraichir les données
  });

// Supprimer une produits
export const useDeleteProduit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/produits/deleteProduit/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
