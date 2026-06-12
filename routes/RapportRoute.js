const express = require('express');
const router = express.Router();
const rapportController = require('../controller/RapportController');

/** Rapport journalier — stats d'une date (YYYY-MM-DD) */
router.get('/rapportJournalier', rapportController.getRapportJournalier);

/** Rapport sur une période — startDate / endDate */
router.get('/rapportPeriode', rapportController.getRapportPeriode);

/** Rapport mensuel — month (0-11) + year */
router.get('/rapportMensuel', rapportController.getRapportMensuel);

/** Séries mensuelles pour graphiques Chart.js */
router.get(
  '/statsGraphiquesMensuels',
  rapportController.getStatsGraphiquesMensuels
);

module.exports = router;
