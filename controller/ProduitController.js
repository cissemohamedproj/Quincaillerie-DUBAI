const Produit = require('../models/ProduitModel');
const Commande = require('../models/CommandeModel');
const Approvisonnement = require('../models/ApprovisonementModel');

/**
 * Échappe les caractères spéciaux d'une chaîne pour l'utiliser
 * dans une expression régulière MongoDB sans erreur de syntaxe.
 */
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Construit un filtre MongoDB combinant le filtre de base (stock, etc.)
 * et la recherche texte — reproduit la logique du frontend :
 * name, category, stock et price (correspondance partielle).
 */
const buildProduitSearchFilter = (baseFilter, searchTerm) => {
  if (!searchTerm || !String(searchTerm).trim()) {
    return baseFilter;
  }

  const search = escapeRegex(String(searchTerm).trim());
  const regex = new RegExp(search, 'i');

  return {
    ...baseFilter,
    $or: [
      { name: regex },
      { category: regex },
      {
        $expr: {
          $regexMatch: {
            input: { $toString: '$stock' },
            regex: search,
            options: 'i',
          },
        },
      },
      {
        $expr: {
          $regexMatch: {
            input: { $toString: '$price' },
            regex: search,
            options: 'i',
          },
        },
      },
    ],
  };
};

// Enregistrer un Produit
exports.createProduit = async (req, res) => {
  try {
    const { name, price, stock, ...resOfData } = req.body;

    const lowerName = name.toLowerCase();
    const formatPrice = Number(price);

    // Vérifier s'il existe déjà une matière avec ces critères
    const existingProduits = await Produit.findOne({
      name: lowerName,
    }).exec();

    if (existingProduits) {
      return res.status(400).json({
        status: 'error',
        message: 'Ce Produit existe déjà.',
      });
    }

    // Création de la matière
    const produit = await Produit.create({
      name: lowerName,
      stock: stock,
      price: formatPrice,
      ...resOfData,
    });

    return res.status(201).json(produit);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// Mettre à jour une Produit
exports.updateProduit = async (req, res) => {
  try {
    const { name, price, achatPrice, stock, ...resOfData } = req.body;

    const lowerName = name.toLowerCase();
    const formatPrice = Number(price);
    const formatAchatPrice = Number(achatPrice);

    // Vérifier s'il existe déjà un produit avec ces critères
    const existingProduits = await Produit.findOne({
      name: lowerName,
      _id: { $ne: req.params.id },
    }).exec();

    if (existingProduits) {
      return res.status(400).json({
        status: 'error',
        message: 'Ce Produit existe déjà.',
      });
    }

    // Mise à jour de produit
    const updated = await Produit.findByIdAndUpdate(
      req.params.id,
      {
        name: lowerName,
        stock: stock,
        price: formatPrice,
        achatPrice: formatAchatPrice,
        ...resOfData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

//  Afficher les Produit avec une stock minimum de (1)
exports.getAllProduits = async (req, res) => {
  try {
    const produits = await Produit.find({ stock: { $gt: 0 } })
      // Trie par date de création, du plus récent au plus ancien
      .sort({ createdAt: -1 });

    return res.status(200).json(produits);
  } catch (err) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
};

//  Afficher une seule Produit avec une stock terminée (0)
exports.getAllProduitWithStockFinish = async (req, res) => {
  try {
    // Tous les produits dont le stock mximum est 3
    const produits = await Produit.find({ stock: { $lt: 10 } })
      // Trie par date de création, du plus récent au plus ancien
      .sort({ createdAt: -1 });

    return res.status(200).json(produits);
  } catch (err) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
};

//  Afficher une seule Produit
exports.getOneProduit = async (req, res) => {
  try {
    const produits = await Produit.findById(req.params.id);
    return res.status(200).json(produits);
  } catch (err) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
};

//  Afficher Produit lors de l'approvisionnemnet
exports.getOneProduitWhenApprovisionne = async (req, res) => {
  try {
    const produits = await Produit.findById(req.params.id);
    return res.status(200).json(produits);
  } catch (err) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
};

// Supprimer un Produit
exports.deleteProduitById = async (req, res) => {
  try {
    await Produit.findByIdAndDelete(req.params.id);
    return res
      .status(200)
      .json({ status: 'success', message: 'Produit supprimée avec succès' });
  } catch (err) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
};

// Supprimer toute les Produit
exports.deleteAllProduit = async (req, res) => {
  try {
    await Produit.deleteMany({}); // Supprime tous les documents

    return res.status(200).json({
      status: 'success',
      message: 'Toute les Produit ont été supprimés avec succès',
    });
  } catch (e) {
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la suppression de toute les Produit',
      error: e.message,
    });
  }
};

/**
 * GET /api/produits/countProduits
 * Compteur léger pour le Dashboard — retourne uniquement le nombre de produits
 * en stock (> 0), même filtre que getAllProduits, sans charger les documents.
 * countDocuments() interroge MongoDB sans transférer les données → très peu de RAM/CPU.
 */
exports.countProduits = async (req, res) => {
  try {
    const count = await Produit.countDocuments({ stock: { $gt: 0 } });
    return res.status(200).json({ count });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/**
 * GET /api/produits/countProduitStockFaible
 * Compteur pour la carte "Produits En Stock Faible" du Dashboard.
 * Reproduit la logique frontend : produits avec stock > 0 ET stock <= 10
 * (équivalent à useAllProduit + filter stock <= 10).
 */
exports.countProduitStockFaible = async (req, res) => {
  try {
    const count = await Produit.countDocuments({
      stock: { $gt: 0, $lte: 10 },
    });
    return res.status(200).json({ count });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/**
 * GET /api/produits/paginationProduits?page=&limit=&search=
 * Pagination + recherche côté serveur pour la page Liste Produits.
 * Même documents que getAllProduits (stock > 0), mais par pages.
 * .lean() : objets JS légers (moins de RAM que les documents Mongoose).
 *
 * Réponse (nouveau format paginé, getAllProduits inchangé) :
 * {
 *   results: { data, page, limit, total, totalPages, totalValeurBoutique }
 * }
 */
exports.getPaginationProduits = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const filter = buildProduitSearchFilter({ stock: { $gt: 0 } }, search);

    const [produits, total, valeurAgg] = await Promise.all([
      Produit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Produit.countDocuments(filter),
      Produit.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalValeurBoutique: {
              $sum: { $multiply: [{ $ifNull: ['$achatPrice', 0] }, { $ifNull: ['$stock', 0] }] },
            },
          },
        },
      ]),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    return res.status(200).json({
      results: {
        data: produits,
        page,
        limit,
        total,
        totalPages,
        totalValeurBoutique: valeurAgg[0]?.totalValeurBoutique ?? 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/**
 * GET /api/produits/paginationProduitStockFaible?page=&limit=&search=
 * Pagination pour la page "Produits en stock faible".
 * Même filtre que getAllProduitWithStockFinish (stock < 10) + recherche serveur.
 */
exports.getPaginationProduitStockFaible = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const filter = buildProduitSearchFilter({ stock: { $lt: 10 } }, search);

    const [produits, total] = await Promise.all([
      Produit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Produit.countDocuments(filter),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    return res.status(200).json({
      results: {
        data: produits,
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
