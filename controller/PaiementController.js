const Paiement = require('../models/PaiementModel');
const PaiementHistorique = require('../models/PaiementHistoriqueModel');
const Commande = require('../models/CommandeModel');

/**
 * Échappe les caractères spéciaux pour une regex MongoDB sûre (recherche factures).
 */
const escapeRegexPaiement = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Construit le filtre MongoDB pour l'historique des factures (page FactureListe).
 * Recherche sur les champs du paiement ET sur la commande liée (client, téléphone…).
 */
const buildFacturesHistoriqueFilter = async (search) => {
  if (!search || !String(search).trim()) {
    return {};
  }

  const escaped = escapeRegexPaiement(String(search).trim());
  const regex = new RegExp(escaped, 'i');

  /** IDs des commandes dont le client / adresse / téléphone matchent la recherche */
  const matchingCommandes = await Commande.find({
    $or: [
      { fullName: regex },
      { adresse: regex },
      { statut: regex },
      {
        $expr: {
          $regexMatch: {
            input: { $toString: '$phoneNumber' },
            regex: escaped,
            options: 'i',
          },
        },
      },
    ],
  })
    .select('_id')
    .lean();

  const commandeIds = matchingCommandes.map((c) => c._id);

  const orConditions = [
    { methode: regex },
    {
      $expr: {
        $regexMatch: {
          input: { $toString: '$totalAmount' },
          regex: escaped,
          options: 'i',
        },
      },
    },
    {
      $expr: {
        $regexMatch: {
          input: { $toString: '$totalPaye' },
          regex: escaped,
          options: 'i',
        },
      },
    },
    {
      $expr: {
        $regexMatch: {
          input: { $toString: { $ifNull: ['$reduction', 0] } },
          regex: escaped,
          options: 'i',
        },
      },
    },
    {
      $expr: {
        $regexMatch: {
          input: {
            $dateToString: { format: '%d/%m/%Y', date: '$paiementDate' },
          },
          regex: escaped,
          options: 'i',
        },
      },
    },
    {
      $expr: {
        $regexMatch: {
          input: {
            $dateToString: { format: '%d/%m/%Y', date: '$createdAt' },
          },
          regex: escaped,
          options: 'i',
        },
      },
    },
  ];

  if (commandeIds.length > 0) {
    orConditions.unshift({ commande: { $in: commandeIds } });
  }

  return { $or: orConditions };
};

/**
 * Interprète un query param Express ("true", true, "1", etc.) en booléen.
 */
const parseQueryBoolPaiement = (value) =>
  value === true ||
  value === 'true' ||
  value === '1' ||
  value === 1;

/**
 * Construit le filtre MongoDB pour la page Liste Paiements (PaiementsListe).
 * Combine : recherche texte + impayés (reliquat > 0) + filtre « aujourd'hui ».
 */
const buildPaiementsListeFilter = async (
  search,
  filterImpayes,
  today,
  todayDate,
  timezone
) => {
  const andConditions = [];

  /** Recherche — même logique que l'historique des factures */
  const searchFilter = await buildFacturesHistoriqueFilter(search);
  if (Object.keys(searchFilter).length > 0) {
    andConditions.push(searchFilter);
  }

  /** Impayés : somme facture > somme payée (reliquat strictement positif) */
  if (parseQueryBoolPaiement(filterImpayes)) {
    andConditions.push({
      $expr: { $gt: ['$totalAmount', '$totalPaye'] },
    });
  }

  /**
   * Aujourd'hui — date locale du navigateur (todayDate YYYY-MM-DD + timezone IANA).
   * Reproduit : new Date(paiementDate).toLocaleDateString() === new Date().toLocaleDateString()
   */
  if (parseQueryBoolPaiement(today)) {
    const dateKey =
      todayDate && /^\d{4}-\d{2}-\d{2}$/.test(String(todayDate))
        ? String(todayDate)
        : new Date().toLocaleDateString('en-CA');
    const tz = timezone && String(timezone).trim() ? String(timezone) : 'UTC';

    andConditions.push({
      $expr: {
        $eq: [
          {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$paiementDate',
              timezone: tz,
            },
          },
          dateKey,
        ],
      },
    });
  }

  if (andConditions.length === 0) return {};
  if (andConditions.length === 1) return andConditions[0];
  return { $and: andConditions };
};

exports.createPaiement = async (req, res) => {
  try {
    // On vérifie si le PAIEMENT n'existe pas via ID de Commande
    const commandeID = req.body.commande;
    const existingPaiement = await Paiement.findOne({
      commande: commandeID,
    }).exec();

    // si la COMMANDE existe alors cela veux dire que le PAIEMENT existe déjà
    if (existingPaiement) {
      return res
        .status(404)
        .json({ message: 'Il existe déjà un Paiement pour cette Commande' });
    }

    // sinon on créer un nouveau PAIEMENT
    const paiement = await Paiement.create(req.body);

    // Et On Ajout le paiement dans son l'historique
    await PaiementHistorique.create({
      amount: req.body.totalPaye,
      ...req.body,
    });
    res.status(201).json(paiement);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

// Mettre à jour un paiement
exports.updatePaiement = async (req, res) => {
  try {
    // On vérifie si le PAIEMENT n'existe pas via ID de Commande
    const commandeID = req.body.commande;
    const existingPaiement = await Paiement.findOne({
      commande: commandeID,
      _id: { $ne: req.params.id },
    }).exec();

    // si la COMMANDE existe alors cela veux dire que le PAIEMENT existe déjà
    if (existingPaiement) {
      return res.status(404).json({ message: 'Cette Commande est déjà payé' });
    }

    const updated = await Paiement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

// Historique des paiements
exports.getAllPaiements = async (req, res) => {
  try {
    const paiements = await Paiement.find()
      // Trie par date de création, du plus récent au plus ancien
      .sort({ createdAt: -1 })
      .populate({
        path: 'commande',
        populate: { path: 'items.produit' },
      });
    return res.status(200).json(paiements);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

// Pagination des paiements
exports.getPagignationPaiements = async (req, res) => {
  try {
    // 1️ Récupération des paramètres
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 600;
    const skip = (page - 1) * limit;

    const paiements = await Paiement.find()
      .limit(limit)
      .skip(skip)
      .populate({
        path: 'commande',
        populate: { path: 'items.produit' },
      })
      .sort({ paiementDate: -1 });

    const totalPages = await Paiement.countDocuments();

    return res.status(200).json({
      results: {
        data: paiements,
        page,
        limit,
        total: totalPages,
        totalPages: Math.ceil(totalPages / limit),
      },
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ status: 'error', message: err.message });
  }
};

/**
 * GET /api/paiements/paginationFacturesHistorique
 * Pagination + recherche serveur — page « Historique des Factures » (FactureListe).
 * getPagignationPaiements et paginationCommandes restent inchangés (même URLs / JSON).
 *
 * Query params : page, limit, search
 *
 * Réponse :
 * {
 *   results: {
 *     data: [...paiements avec commande + items.produit peuplés],
 *     page, limit, total, totalPages
 *   }
 * }
 */
exports.getPaginationFacturesHistorique = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const filter = await buildFacturesHistoriqueFilter(search);

    const [paiementsListe, total] = await Promise.all([
      Paiement.find(filter)
        .sort({ paiementDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'commande',
          populate: { path: 'items.produit' },
        })
        .lean(),
      Paiement.countDocuments(filter),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    return res.status(200).json({
      results: {
        data: paiementsListe,
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/**
 * GET /api/paiements/paginationPaiementsListe
 * Pagination + recherche + filtres — page « Paiements » (PaiementsListe).
 * getPagignationPaiements reste inchangé (même URL / JSON).
 *
 * Query params :
 * - page, limit, search
 * - filterImpayes=true  → reliquat > 0
 * - today=true + todayDate + timezone → paiements du jour (fuseau navigateur)
 *
 * Réponse :
 * {
 *   results: {
 *     data: [...paiements avec commande peuplée],
 *     page, limit, total, totalPages,
 *     stats: { sumTotalAmount, sumTotalPaye, sumNonPaye }
 *   }
 * }
 */
exports.getPaginationPaiementsListe = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const filterImpayes = req.query.filterImpayes;
    const today = req.query.today;
    const todayDate = req.query.todayDate;
    const timezone = req.query.timezone;

    const filter = await buildPaiementsListeFilter(
      search,
      filterImpayes,
      today,
      todayDate,
      timezone
    );

    const [paiementsListe, total, statsAgg] = await Promise.all([
      Paiement.find(filter)
        .sort({ paiementDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'commande',
          populate: { path: 'items.produit' },
        })
        .lean(),
      Paiement.countDocuments(filter),
      Paiement.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            sumTotalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
            sumTotalPaye: { $sum: { $ifNull: ['$totalPaye', 0] } },
          },
        },
      ]),
    ]);

    const statsRaw = statsAgg[0] ?? { sumTotalAmount: 0, sumTotalPaye: 0 };
    const sumTotalAmount = statsRaw.sumTotalAmount ?? 0;
    const sumTotalPaye = statsRaw.sumTotalPaye ?? 0;
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    return res.status(200).json({
      results: {
        data: paiementsListe,
        page,
        limit,
        total,
        totalPages,
        stats: {
          sumTotalAmount,
          sumTotalPaye,
          sumNonPaye: Math.max(sumTotalAmount - sumTotalPaye, 0),
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// Trouver un PAIEMENT
exports.getPaiement = async (req, res) => {
  try {
    const paiements = await Paiement.findById(req.params.id).populate({
      path: 'commande',
      populate: { path: 'items.produit' },
    });

    return res.status(200).json(paiements);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

// Trouver le PAIEMENT via la COMMANDE sélectionnée
exports.getPaiementBySelectedCommandeID = async (req, res) => {
  try {
    // Récupération de PAIEMENT via ID de COMMANDE sélectionnée
    const selectedCommandePaiement = await Paiement.findOne({
      commande: req.params.id,
    }).populate({
      path: 'commande',
      populate: { path: 'items.produit' },
    });

    return res.status(200).json(selectedCommandePaiement);
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

// Supprimer un paiement
exports.deletePaiement = async (req, res) => {
  try {
    // Trouver le PAIEMENT à supprimer via son ID
    const deletedPaiement = await Paiement.findById(req.params.id);

    // On Trouve la liste des HISTORIQUE de PAIEMENT dont ID de COMMANDE correspond à celle qu'on veux supprimer
    await PaiementHistorique.deleteMany({
      commande: deletedPaiement.commande,
    });

    // On supprimer HISTORIQUE de PAIEMENT
    // const hisdelete = await PaiementHistorique.findByIdAndDelete(
    //   deletedHistoriquePaiement
    // );
    // console.log('------ Historique supprimés---------\n ', hisdelete);

    // après on supprime le PAIEMENT
    await Paiement.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({ status: 'success', message: 'Paiement supprimé avec succès' });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};
