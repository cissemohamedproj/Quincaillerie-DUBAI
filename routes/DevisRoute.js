const express = require('express');
const router = express.Router();
const devisController = require('../controller/DevisController');

//  Créer une nouvelle Devis
router.post('/createDevis', devisController.createDevis);

//  Obtenir toutes les Deviss
router.get('/getAllDevis', devisController.getAllDevis);

// Pagination + recherche — Historique des Devis (GET uniquement, DevisListe)
router.get(
  '/paginationDevisHistorique',
  devisController.getPaginationDevisHistorique
);

//  Obtenir une Deviss
router.get('/getOneDevis/:id', devisController.getOneDevis);

router.put('/updateDevis/:id', devisController.updateDevis);

//  Supprimer une Devis
router.delete('/deleteDevis/:id', devisController.deleteDevis);

module.exports = router;
