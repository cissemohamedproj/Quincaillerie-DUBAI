const mongoose = require('mongoose');
const Devis = require('../models/DevisModel');
const Produit = require('../models/ProduitModel');

/**
 * Échappe les caractères spéciaux pour une regex MongoDB sûre (recherche devis).
 */
const escapeRegexDevis = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Construit le filtre MongoDB pour l'historique des devis (page DevisListe).
 * Recherche sur : montant total, date, nom des produits dans les lignes.
 */
const buildDevisHistoriqueFilter = async (search) => {
  if (!search || !String(search).trim()) {
    return {};
  }

  const escaped = escapeRegexDevis(String(search).trim());
  const regex = new RegExp(escaped, 'i');

  /** IDs produits dont le nom matche — pour filtrer les devis contenant ces articles */
  const matchingProduits = await Produit.find({ name: regex })
    .select('_id')
    .lean();
  const produitIds = matchingProduits.map((p) => p._id);

  const orConditions = [
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
          input: {
            $dateToString: { format: '%d/%m/%Y', date: '$createdAt' },
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
            $dateToString: { format: '%d/%m/%Y', date: '$updatedAt' },
          },
          regex: escaped,
          options: 'i',
        },
      },
    },
  ];

  if (produitIds.length > 0) {
    orConditions.push({ 'items.produit': { $in: produitIds } });
  }

  return { $or: orConditions };
};

// Créer un Devis
exports.createDevis = async (req, res) => {
  try {
    const { items, ...restOfData } = req.body;

    // Créer le Devis
    const newDevis = await Devis.create({
      items,

      ...restOfData,
    });

    return res.status(201).json(newDevis);
  } catch (error) {
    console.log('Erreur de validation de Devis :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Trouver toutes les Devis
exports.getAllDevis = async (req, res) => {
  try {
    const devisListe = await Devis.find()
      // Trie par date de création, du plus récent au plus ancien
      .sort({ createdAt: -1 })
      .populate('items.produit');

    return res.status(201).json(devisListe);
  } catch (e) {
    return res.status(404).json(e);
  }
};

/**
 * GET /api/devis/paginationDevisHistorique
 * Pagination + recherche serveur — page « Historique des Devis » (DevisListe).
 * getAllDevis reste inchangé (même URL / JSON tableau simple).
 *
 * Query params : page, limit, search
 *
 * Réponse :
 * {
 *   results: {
 *     data: [...devis avec items.produit peuplés],
 *     page, limit, total, totalPages,
 *     stats: { sumTotalAmount }
 *   }
 * }
 */
exports.getPaginationDevisHistorique = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const filter = await buildDevisHistoriqueFilter(search);

    const [devisListe, total, statsAgg] = await Promise.all([
      Devis.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.produit')
        .lean(),
      Devis.countDocuments(filter),
      Devis.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            sumTotalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
          },
        },
      ]),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
    const sumTotalAmount = statsAgg[0]?.sumTotalAmount ?? 0;

    return res.status(200).json({
      results: {
        data: devisListe,
        page,
        limit,
        total,
        totalPages,
        stats: { sumTotalAmount },
      },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// Trouver une seulle Devis
exports.getOneDevis = async (req, res) => {
  try {
    const devisData = await Devis.findById(req.params.id).populate(
      'items.produit'
    );

    return res.status(201).json(devisData);
  } catch (e) {
    return res.status(404).json(e);
  }
};

// -----------------------------------------------

// --------------------------------------------------------------------------
// --------- Modifier un Devis ----------------------------------

exports.updateDevis = async (req, res) => {
  try {
    const { items, ...resOfData } = req.body;

    await Devis.findByIdAndUpdate(req.params.id, {
      items,
      ...resOfData,
    });

    return res.status(200).json({ message: 'Devis mise à jour avec succès' });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};

// ----------------------------------------------------------------------------
// Supprimer un Devis
exports.deleteDevis = async (req, res) => {
  try {
    await Devis.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Devis supprimé avec succès' });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: err.message });
  }
};
