const express = require('express');
const router = express.Router();
const fournisseurController = require('../controller/FournisseurController');

// Créer un Fournisseur
router.post('/createFournisseur', fournisseurController.createFournisseur);

// Afficher toutes les Fournisseurs
router.get('/getAllFournisseurs', fournisseurController.getAllFournisseurs);

// Compteur léger Dashboard — nombre de fournisseurs (GET uniquement)
router.get('/countFournisseurs', fournisseurController.countFournisseurs);

// Pagination + recherche — Liste Fournisseurs (GET uniquement, FournisseurListe)
router.get(
  '/paginationFournisseurs',
  fournisseurController.getPaginationFournisseurs
);

// Afficher un seul Fournisseur
router.get('/getOneFournisseur/:id', fournisseurController.getFournisseur);

// Mettre à jour un Fournisseur
router.put('/updateFournisseur/:id', fournisseurController.updateFournisseur);

// supprimer un Fournisseur
router.delete(
  '/deleteFournisseur/:id',
  fournisseurController.deleteFournisseur
);

// Supprimer toutes les Fournisseur
router.delete(
  '/deleteAllFournisseur',
  fournisseurController.deleteAllFournisseurs
);

module.exports = router;
