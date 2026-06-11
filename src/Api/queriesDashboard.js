import { useQuery } from '@tanstack/react-query';
import api from './api';

/**
 * Durée de cache Dashboard (5 min) :
 * les compteurs n'ont pas besoin d'être recalculés à chaque rendu.
 * staleTime évite les requêtes réseau inutiles tant que les données sont "fraîches".
 */
const DASHBOARD_STALE_TIME = 1000 * 60 * 5;

/**
 * Hook : nombre total de produits en stock (> 0).
 * Remplace useAllProduit() qui chargeait tous les documents juste pour .length
 * Endpoint : GET /produits/countProduits → { count: number }
 */
export const useCountProduits = () =>
  useQuery({
    queryKey: ['dashboard', 'countProduits'],
    queryFn: () =>
      api.get('/produits/countProduits').then((res) => res.data),
    staleTime: DASHBOARD_STALE_TIME,
  });

/**
 * Hook : nombre de produits en stock faible (1 à 10 unités).
 * Remplace useAllProduit() + filter côté client.
 * Endpoint : GET /produits/countProduitStockFaible → { count: number }
 */
export const useCountProduitStockFaible = () =>
  useQuery({
    queryKey: ['dashboard', 'countProduitStockFaible'],
    queryFn: () =>
      api
        .get('/produits/countProduitStockFaible')
        .then((res) => res.data),
    staleTime: DASHBOARD_STALE_TIME,
  });

/**
 * Hook : nombre total de fournisseurs.
 * Remplace useAllFournisseur() qui chargeait toute la liste.
 * Endpoint : GET /fournisseurs/countFournisseurs → { count: number }
 */
export const useCountFournisseurs = () =>
  useQuery({
    queryKey: ['dashboard', 'countFournisseurs'],
    queryFn: () =>
      api.get('/fournisseurs/countFournisseurs').then((res) => res.data),
    staleTime: DASHBOARD_STALE_TIME,
  });

/**
 * Hook partagé par les 3 cartes Commandes du Dashboard.
 * Une seule requête HTTP pour total, en attente et en cours.
 * React Query met en cache le résultat : les 3 composants réutilisent les mêmes données.
 * Endpoint : GET /commandes/countCommandesDashboard → { total, enAttente, enCours }
 */
export const useCountCommandesDashboard = () =>
  useQuery({
    queryKey: ['dashboard', 'countCommandes'],
    queryFn: () =>
      api
        .get('/commandes/countCommandesDashboard')
        .then((res) => res.data),
    staleTime: DASHBOARD_STALE_TIME,
  });
