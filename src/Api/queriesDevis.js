import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

// Créer une nouvelle Devis
export const useCreateDevis = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/devis/createDevis', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['devis'] }),
  });
};

// Mettre à jour une Deviss
export const useUpdateDevis = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/devis/updateDevis/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['devis'] }),
  });
};

// Lire toutes les Deviss
export const useAllDevis = () =>
  useQuery({
    queryKey: ['devis'],
    queryFn: () => api.get('/devis/getAllDevis').then((res) => res.data),
  });

/**
 * Pagination + recherche serveur — page « Historique des Devis » (DevisListe).
 * Remplace useAllDevis qui chargeait tous les devis d'un coup.
 *
 * @param {number} page
 * @param {number} limit
 * @param {string} search — terme debouncé (montant, date, nom produit…)
 */
export const usePaginationDevisHistorique = (
  page = 1,
  limit = 12,
  search = ''
) =>
  useQuery({
    queryKey: ['devis', 'historique', 'pagination', page, limit, search],
    queryFn: () =>
      api
        .get('/devis/paginationDevisHistorique', {
          params: {
            page,
            limit,
            search: search.trim() || undefined,
          },
        })
        .then((res) => res.data),
    staleTime: 0,
  });

// Obtenir un Devis
export const useOneDevis = (id) =>
  useQuery({
    queryKey: ['getDevis', id],
    queryFn: () => api.get(`/devis/getOneDevis/${id}`).then((res) => res.data),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, //chaque 5 minutes rafraichir les données
  });

// Supprimer une Deviss
export const useDeleteDevis = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/devis/deleteDevis/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['devis'] }),
  });
};
