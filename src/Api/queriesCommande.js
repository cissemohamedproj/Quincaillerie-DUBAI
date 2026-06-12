import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

// Créer une nouvelle Commande
export const useCreateCommande = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/commandes/createCommande', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] });
      queryClient.invalidateQueries({ queryKey: ['commandes', 'topProduits'] });
    },
  });
};

// Mettre à jour une Commande
export const useUpdateCommande = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commandeId, data }) =>
      api.put(`/commandes/updateCommande/${commandeId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] });
      queryClient.invalidateQueries({ queryKey: ['commandes', 'topProduits'] });
    },
  });
};
// Lire toutes les commandes
export const useAllCommandes = () =>
  useQuery({
    queryKey: ['commandes'],
    queryFn: () =>
      api.get('/commandes/getAllCommandes').then((res) => res.data),
  });

// Pagination des Commandes (utilisé par FactureListe)
export const usePaginationCommandes = (page = 1, limit = 100) =>
  useQuery({
    queryKey: ['commandes', page, limit],
    queryFn: () =>
      api
        .get('/commandes/paginationCommandes', {
          params: { page, limit },
        })
        .then((res) => res.data),
    keepPreviousData: true,
  });

/**
 * Pagination + recherche + filtres — page Historique des Commandes.
 * @param {number} page
 * @param {number} limit
 * @param {string} search — terme debouncé
 * @param {object} filters — { today, enCours, enAttente } (checkboxes)
 */
export const usePaginationCommandesHistorique = (
  page = 1,
  limit = 50,
  search = '',
  filters = {}
) => {
  /** Date locale du navigateur (YYYY-MM-DD) — même logique que l'ancien filtre client */
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
      'commandes',
      'historique',
      'pagination',
      page,
      limit,
      search,
      filters.today,
      filters.enCours,
      filters.enAttente,
      filters.today ? clientToday : null,
    ],
    queryFn: () =>
      api
        .get('/commandes/paginationCommandesHistorique', {
          params: {
            page,
            limit,
            search: search.trim() || undefined,
            today: filters.today ? 'true' : undefined,
            todayDate: filters.today ? clientToday : undefined,
            timezone: filters.today ? clientTimezone : undefined,
            filterEnCours: filters.enCours ? 'true' : undefined,
            filterEnAttente: filters.enAttente ? 'true' : undefined,
          },
        })
        .then((res) => res.data),
    staleTime: 0,
  });
};

// Obtenir une Commande
export const useOneCommande = (id) =>
  useQuery({
    queryKey: ['commandes', id],
    queryFn: () =>
      api.get(`/commandes/getOneCommande/${id}`).then((res) => res.data),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, //chaque 5 minutes rafraichir les données
  });

// Liste des Produits les plus Commandés
// Ancien hook — chargeait TOUS les top produits d'un coup (queryKey en conflit avec useAllCommandes)
// export const useGetTopProduitCommande = () => {
//   return useQuery({
//     queryKey: ['commandes'],
//     queryFn: () =>
//       api.get('/commandes/topProduitsCommande').then((res) => res.data),
//   });
// };

/**
 * Pagination + recherche serveur — page "Top Produit".
 * @param {number} page   — numéro de page (1-based)
 * @param {number} limit  — cartes par page
 * @param {string} search — terme debouncé (nom, quantité, prix…)
 */
export const usePaginationTopProduits = (page = 1, limit = 24, search = '') =>
  useQuery({
    queryKey: ['commandes', 'topProduits', 'pagination', page, limit, search],
    queryFn: () =>
      api
        .get('/commandes/paginationTopProduitsCommande', {
          params: { page, limit, search: search.trim() || undefined },
        })
        .then((res) => res.data),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2,
  });

// Supprimer une Commande
export const useDeleteCommande = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commandeId, items }) =>
      api.post(`/commandes/deleteCommande/${commandeId}`, {
        items,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] });
      queryClient.invalidateQueries({ queryKey: ['commandes', 'topProduits'] });
    },
  });
};
