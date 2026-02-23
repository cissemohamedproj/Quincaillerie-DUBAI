const express = require('express');
const router = express.Router();
const commandeController = require('../controller/CommandeController');

//  Créer une nouvelle Commande
router.post('/createCommande', commandeController.createCommande);

//  Obtenir toutes les Commandes
router.get('/getAllCommandes', commandeController.getAllCommandes);

// Pagination des Commandes
router.get('/paginationCommandes', commandeController.getPagignationCommandes);

//  Obtenir une Commandes
router.get('/getOneCommande/:id', commandeController.getOneCommande);

// PRoduit le plu Commandé
router.get('/topProduitsCommande', commandeController.getTopProduits);

router.put('/updateCommande/:commandeId', commandeController.updateCommande);

//  Supprimer une Commande
router.post('/deleteCommande/:commandeId', commandeController.deleteCommande);

module.exports = router;
