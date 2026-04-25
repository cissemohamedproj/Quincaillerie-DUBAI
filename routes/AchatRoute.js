const express = require('express');
const router = express.Router();
const achatController = require('../controller/AchatController');

// Create a new Achat
router.post('/createAchat', achatController.createAchat);

// Update an Achat
router.put('/updateAchat/:id', achatController.updateAchat);

// Get all Achats
router.get('/getAllAchat', achatController.getAllAchats);

// Get a single Achat by ID
router.get('/getAchatById/:id', achatController.getAchatById);

// Delete an Achat
router.delete('/deleteAchat/:id', achatController.deleteAchat);

module.exports = router;
