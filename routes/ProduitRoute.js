const express = require('express');
const router = express.Router();
const produitController = require('../controller/ProduitController');

// Créer un Produit
router.post('/addProduit', produitController.createProduit);

// Afficher une toutes les Produit
router.get('/getAllProduits', produitController.getAllProduits);

// Compteur léger Dashboard — nombre de produits en stock (GET uniquement)
router.get('/countProduits', produitController.countProduits);

// Compteur léger Dashboard — produits en stock faible (GET uniquement)
router.get(
  '/countProduitStockFaible',
  produitController.countProduitStockFaible
);

// Pagination + recherche — Liste Produits (GET uniquement, getAllProduits inchangé)
router.get('/paginationProduits', produitController.getPaginationProduits);

// Pagination + recherche — Produits stock faible (GET uniquement)
router.get(
  '/paginationProduitStockFaible',
  produitController.getPaginationProduitStockFaible
);

// Afficher une toutes les Produit sans Stcok
router.get(
  '/getAllProduitWithStockFinish',
  produitController.getAllProduitWithStockFinish
);

// Afficher une seule Produit
router.get('/getOneProduit/:id', produitController.getOneProduit);

// Afficher une seule Produit lors de l'approvisionnement
router.get(
  '/approvisonnement/:id',
  produitController.getOneProduitWhenApprovisionne
);

// Mettre à jour une Produit
router.put('/updateProduit/:id', produitController.updateProduit);

// supprimer un PRODUIT
router.delete('/deleteProduit/:id', produitController.deleteProduitById);

// Supprimer toutes les Produit
router.delete('/deleteAllProduit', produitController.deleteAllProduit);

module.exports = router;
