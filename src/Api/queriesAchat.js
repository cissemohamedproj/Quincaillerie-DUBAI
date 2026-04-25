import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

// Créer une nouvelle Achat
export const useCreateAchat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/achats/createAchat', data),
    onSuccess: () => queryClient.invalidateQueries(['achats']),
  });
};

// Mettre à jour une Achat
export const useUpdateAchat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/achats/updateAchat/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries(['achats']),
  });
};
// Lire toutes les achats
export const useAllAchats = () =>
  useQuery({
    queryKey: ['achats'],
    queryFn: () => api.get('/achats/getAllAchat').then((res) => res.data),
  });

// Obtenir une Achat
export const useOneAchat = (id) =>
  useQuery({
    queryKey: ['achats', id],
    queryFn: () =>
      api.get(`/achats/getAchatById/${id}`).then((res) => res.data),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, // chaque 5 minutes rafraichir les données
  });

// Supprimer une Achat
export const useDeleteAchat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/achats/deleteAchat/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['achats']),
  });
};
