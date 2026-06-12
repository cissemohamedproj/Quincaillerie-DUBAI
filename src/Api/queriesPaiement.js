import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

// Créer une nouvelle Paiement
export const useCreatePaiement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/paiements/createPaiement', data),
    onSuccess: () => queryClient.invalidateQueries(['paiements']),
  });
};

// Mettre à jour une Paiement
export const useUpdatePaiement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      api.put(`/paiements/updatePaiement/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries(['paiements']),
  });
};
// Lire toutes les paiements
export const useAllPaiements = () =>
  useQuery({
    queryKey: ['paiements'],
    queryFn: () =>
      api.get('/paiements/getAllPaiements').then((res) => res.data),
  });

// Pagination des paiements
export const usePaginationPaiements = (page = 1, limit = 600) =>
  useQuery({
    queryKey: ['paiements', page, limit],
    queryFn: () =>
      api
        .get('/paiements/getPagignationPaiements', { params: { page, limit } })
        .then((res) => res.data),
    keepPreviousData: true,
  });

/**
 * Pagination + recherche serveur — page « Historique des Factures » (FactureListe).
 * Remplace usePaginationCommandes qui chargeait commandes + factures inutilement.
 *
 * @param {number} page   — numéro de page (1-based)
 * @param {number} limit  — factures par page (cartes)
 * @param {string} search — terme debouncé (client, téléphone, montants, date…)
 */
export const usePaginationFacturesHistorique = (
  page = 1,
  limit = 12,
  search = ''
) =>
  useQuery({
    queryKey: ['paiements', 'factures', 'historique', page, limit, search],
    queryFn: () =>
      api
        .get('/paiements/paginationFacturesHistorique', {
          params: {
            page,
            limit,
            search: search.trim() || undefined,
          },
        })
        .then((res) => res.data),
    staleTime: 0,
  });

// Obtenir une Paiement
export const useOnePaiement = (id) =>
  useQuery({
    queryKey: ['getOnePaiement', id],
    queryFn: () =>
      api.get(`/paiements/getOnePaiement/${id}`).then((res) => res.data),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, //chaque 5 minutes rafraichir les données
  });

// Obtenir un Paiement via ID de COMMANDE sélectionnée
export const useOnePaiementBySelectedCommandeID = (id) =>
  useQuery({
    queryKey: ['getOnePaiementBySelectedCommandeID', id],
    queryFn: () =>
      api
        .get(`/paiements/getPaiementBySelectedCommandeID/${id}`)
        .then((res) => res.data),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, //chaque 5 minutes rafraichir les données
  });

// Supprimer une Paiement
export const useDeletePaiement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/paiements/deletePaiement/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['paiements']),
  });
};
