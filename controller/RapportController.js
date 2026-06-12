const Commande = require('../models/CommandeModel');
const Paiement = require('../models/PaiementModel');
const Depense = require('../models/DepenseModel');

/**
 * Fuseau horaire par défaut si le frontend n'en envoie pas.
 */
const DEFAULT_TZ = 'UTC';

/**
 * Construit une condition $expr MongoDB : champ date === dateKey (YYYY-MM-DD) dans le fuseau donné.
 * Évite le décalage UTC de toISOString().slice(0,10) côté client.
 */
const matchDateKeyExpr = (dateField, dateKey, timezone) => ({
  $expr: {
    $eq: [
      {
        $dateToString: {
          format: '%Y-%m-%d',
          date: `$${dateField}`,
          timezone: timezone || DEFAULT_TZ,
        },
      },
      dateKey,
    ],
  },
});

/**
 * Construit une condition $expr : date entre startKey et endKey (inclus), format YYYY-MM-DD.
 */
const matchDateRangeExpr = (dateField, startKey, endKey, timezone) => ({
  $expr: {
    $and: [
      {
        $gte: [
          {
            $dateToString: {
              format: '%Y-%m-%d',
              date: `$${dateField}`,
              timezone: timezone || DEFAULT_TZ,
            },
          },
          startKey,
        ],
      },
      {
        $lte: [
          {
            $dateToString: {
              format: '%Y-%m-%d',
              date: `$${dateField}`,
              timezone: timezone || DEFAULT_TZ,
            },
          },
          endKey,
        ],
      },
    ],
  },
});

/**
 * Construit une condition $expr : mois (0-11) + année calendaire dans le fuseau donné.
 */
const matchMonthYearExpr = (dateField, month, year, timezone) => ({
  $expr: {
    $and: [
      {
        $eq: [
          {
            $month: {
              date: `$${dateField}`,
              timezone: timezone || DEFAULT_TZ,
            },
          },
          Number(month) + 1,
        ],
      },
      {
        $eq: [
          {
            $year: {
              date: `$${dateField}`,
              timezone: timezone || DEFAULT_TZ,
            },
          },
          Number(year),
        ],
      },
    ],
  },
});

/**
 * Calcule le coût d'achat total à partir des paiements peuplés (commande.items.produit).
 * Même logique que l'ancien frontend RapportByDay / RapportBySemaine.
 */
const computeTotalAchatFromPaiements = (paiementsPopulated) => {
  let totalAchat = 0;

  paiementsPopulated.forEach((paiement) => {
    paiement.commande?.items?.forEach((item) => {
      const produit = item?.produit;
      if (!produit) return;
      totalAchat += (Number(produit.achatPrice) || 0) * (Number(item.quantity) || 0);
    });
  });

  return totalAchat;
};

/**
 * Assemble les statistiques finales avec formules UNIFIÉES :
 * - totalAPayer  = Σ totalAmount (factures du jour/période/mois)
 * - totalPaye    = Σ totalPaye   → affiché comme « Revenue / Chiffre d'affaires »
 * - totalImpaye  = totalAPayer - totalPaye
 * - benefice     = totalPaye - totalAchat - totalDepenses  (PAS totalAPayer)
 */
const buildStatsPayload = ({
  totalCommandes,
  totalAPayer,
  totalPaye,
  totalDepenses,
  totalAchat,
}) => {
  const safeAPayer = Number(totalAPayer) || 0;
  const safePaye = Number(totalPaye) || 0;
  const safeDepenses = Number(totalDepenses) || 0;
  const safeAchat = Number(totalAchat) || 0;
  const totalImpaye = Math.max(safeAPayer - safePaye, 0);
  const benefice = safePaye - safeAchat - safeDepenses;

  return {
    totalCommandes: Number(totalCommandes) || 0,
    totalAPayer: safeAPayer,
    totalPaye: safePaye,
    totalImpaye,
    totalDepenses: safeDepenses,
    totalAchat: safeAchat,
    benefice,
  };
};

/**
 * Calcule toutes les stats pour un filtre donné sur commandes, paiements et dépenses.
 */
const computeRapportStats = async ({
  commandeFilter,
  paiementFilter,
  depenseFilter,
}) => {
  const [totalCommandes, paiementAgg, depenseAgg, paiementsPopulated] =
    await Promise.all([
      Commande.countDocuments(commandeFilter),
      Paiement.aggregate([
        { $match: paiementFilter },
        {
          $group: {
            _id: null,
            totalAPayer: { $sum: { $ifNull: ['$totalAmount', 0] } },
            totalPaye: { $sum: { $ifNull: ['$totalPaye', 0] } },
          },
        },
      ]),
      Depense.aggregate([
        { $match: depenseFilter },
        {
          $group: {
            _id: null,
            totalDepenses: { $sum: { $ifNull: ['$totalAmount', 0] } },
          },
        },
      ]),
      Paiement.find(paiementFilter)
        .populate({
          path: 'commande',
          populate: { path: 'items.produit' },
        })
        .lean(),
    ]);

  const totalAchat = computeTotalAchatFromPaiements(paiementsPopulated);

  return buildStatsPayload({
    totalCommandes,
    totalAPayer: paiementAgg[0]?.totalAPayer ?? 0,
    totalPaye: paiementAgg[0]?.totalPaye ?? 0,
    totalDepenses: depenseAgg[0]?.totalDepenses ?? 0,
    totalAchat,
  });
};

/**
 * GET /api/rapports/rapportJournalier?date=YYYY-MM-DD&timezone=
 * Stats du jour — remplace le calcul client RapportByDay (useAllCommandes + useAllPaiements…).
 */
exports.getRapportJournalier = async (req, res) => {
  try {
    const timezone = req.query.timezone || DEFAULT_TZ;
    const dateKey =
      req.query.date && /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.date))
        ? String(req.query.date)
        : new Date().toLocaleDateString('en-CA');

    const stats = await computeRapportStats({
      commandeFilter: matchDateKeyExpr('commandeDate', dateKey, timezone),
      paiementFilter: matchDateKeyExpr('paiementDate', dateKey, timezone),
      depenseFilter: matchDateKeyExpr('dateOfDepense', dateKey, timezone),
    });

    return res.status(200).json({
      stats,
      meta: { type: 'journalier', dateKey, timezone },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/rapports/rapportPeriode?startDate=&endDate=&timezone=
 * Stats sur une plage de dates — remplace RapportBySemaine.
 */
exports.getRapportPeriode = async (req, res) => {
  try {
    const timezone = req.query.timezone || DEFAULT_TZ;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'Les paramètres startDate et endDate sont requis (YYYY-MM-DD).',
      });
    }

    const stats = await computeRapportStats({
      commandeFilter: matchDateRangeExpr(
        'commandeDate',
        startDate,
        endDate,
        timezone
      ),
      paiementFilter: matchDateRangeExpr(
        'paiementDate',
        startDate,
        endDate,
        timezone
      ),
      depenseFilter: matchDateRangeExpr(
        'dateOfDepense',
        startDate,
        endDate,
        timezone
      ),
    });

    return res.status(200).json({
      stats,
      meta: { type: 'periode', startDate, endDate, timezone },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/rapports/rapportMensuel?month=0-11&year=2026&timezone=
 * Stats du mois calendaire — remplace SelectedMounthTotalResult.
 * Corrige l'ancien bug : bénéfice utilisait totalAPayer au lieu de totalPaye.
 */
exports.getRapportMensuel = async (req, res) => {
  try {
    const timezone = req.query.timezone || DEFAULT_TZ;
    const month = Math.min(
      Math.max(parseInt(req.query.month, 10) || new Date().getMonth(), 0),
      11
    );
    const year =
      parseInt(req.query.year, 10) || new Date().getFullYear();

    const stats = await computeRapportStats({
      commandeFilter: matchMonthYearExpr(
        'commandeDate',
        month,
        year,
        timezone
      ),
      paiementFilter: matchMonthYearExpr(
        'paiementDate',
        month,
        year,
        timezone
      ),
      depenseFilter: matchMonthYearExpr(
        'dateOfDepense',
        month,
        year,
        timezone
      ),
    });

    return res.status(200).json({
      stats,
      meta: { type: 'mensuel', month, year, timezone },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * GET /api/rapports/statsGraphiquesMensuels?year=2026&timezone=
 * Données agrégées par mois pour les graphiques (12 valeurs par série).
 * Remplace le chargement de toutes les commandes/paiements/dépenses côté client.
 */
exports.getStatsGraphiquesMensuels = async (req, res) => {
  try {
    const timezone = req.query.timezone || DEFAULT_TZ;
    const year =
      parseInt(req.query.year, 10) || new Date().getFullYear();

    const monthIndex = (dateField) => ({
      $subtract: [
        {
          $month: {
            date: `$${dateField}`,
            timezone,
          },
        },
        1,
      ],
    });

    const yearMatch = (dateField) => ({
      $expr: {
        $eq: [
          {
            $year: {
              date: `$${dateField}`,
              timezone,
            },
          },
          year,
        ],
      },
    });

    const [
      commandesParMois,
      paiementsParMois,
      depensesParMois,
    ] = await Promise.all([
      Commande.aggregate([
        { $match: yearMatch('commandeDate') },
        { $group: { _id: monthIndex('commandeDate'), count: { $sum: 1 } } },
      ]),
      Paiement.aggregate([
        { $match: yearMatch('paiementDate') },
        {
          $group: {
            _id: monthIndex('paiementDate'),
            totalAPayer: { $sum: { $ifNull: ['$totalAmount', 0] } },
            totalPaye: { $sum: { $ifNull: ['$totalPaye', 0] } },
          },
        },
      ]),
      Depense.aggregate([
        { $match: yearMatch('dateOfDepense') },
        {
          $group: {
            _id: monthIndex('dateOfDepense'),
            totalDepenses: { $sum: { $ifNull: ['$totalAmount', 0] } },
          },
        },
      ]),
    ]);

    /** Tableau de 12 mois (index 0 = janvier) initialisé à 0 */
    const empty12 = () => new Array(12).fill(0);

    const commandesCount = empty12();
    commandesParMois.forEach((row) => {
      if (row._id >= 0 && row._id < 12) commandesCount[row._id] = row.count;
    });

    const totalAPayerParMois = empty12();
    const totalPayeParMois = empty12();
    const totalImpayeParMois = empty12();
    paiementsParMois.forEach((row) => {
      if (row._id >= 0 && row._id < 12) {
        totalAPayerParMois[row._id] = row.totalAPayer;
        totalPayeParMois[row._id] = row.totalPaye;
        totalImpayeParMois[row._id] = Math.max(
          row.totalAPayer - row.totalPaye,
          0
        );
      }
    });

    const depensesParMoisArr = empty12();
    depensesParMois.forEach((row) => {
      if (row._id >= 0 && row._id < 12) {
        depensesParMoisArr[row._id] = row.totalDepenses;
      }
    });

    return res.status(200).json({
      year,
      timezone,
      commandes: commandesCount,
      paiements: {
        totalAPayer: totalAPayerParMois,
        totalPaye: totalPayeParMois,
        totalImpaye: totalImpayeParMois,
      },
      depenses: depensesParMoisArr,
      entrees: totalPayeParMois,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};
