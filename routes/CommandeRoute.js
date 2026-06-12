const express = require('express');
const router = express.Router();
const commandeController = require('../controller/CommandeController');

//  Créer une nouvelle Commande
router.post('/createCommande', commandeController.createCommande);

//  Obtenir toutes les Commandes
router.get('/getAllCommandes', commandeController.getAllCommandes);

// Compteurs légers Dashboard — total / en attente / en cours (GET uniquement)
router.get(
  '/countCommandesDashboard',
  commandeController.countCommandesDashboard
);

// Pagination des Commandes
router.get('/paginationCommandes', commandeController.getPagignationCommandes);

// Pagination + recherche + filtres — Historique des Commandes (GET uniquement)
router.get(
  '/paginationCommandesHistorique',
  commandeController.getPaginationCommandesHistorique
);

//  Obtenir une Commandes
router.get('/getOneCommande/:id', commandeController.getOneCommande);

// PRoduit le plu Commandé
router.get('/topProduitsCommande', commandeController.getTopProduits);

// Pagination + recherche — Top Produits les plus commandés (GET uniquement)
router.get(
  '/paginationTopProduitsCommande',
  commandeController.getPaginationTopProduits
);

router.put('/updateCommande/:commandeId', commandeController.updateCommande);

//  Supprimer une Commande
router.post('/deleteCommande/:commandeId', commandeController.deleteCommande);

module.exports = router;
