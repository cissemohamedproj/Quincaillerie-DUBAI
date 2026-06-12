const mongoose = require('mongoose');
const Approvisonement = require('../models/ApprovisonementModel');
const Produit = require('../models/ProduitModel');

/**
 * Échappe les caractères spéciaux pour une regex MongoDB sûre.
 */
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Construit l'étape $match de recherche sur les champs populés
 * (produit, fournisseur) — reproduit la logique du filtre frontend.
 */
const buildApproSearchMatchStage = (searchTerm) => {
  if (!searchTerm || !String(searchTerm).trim()) {
    return null;
  }

  const search = escapeRegex(String(searchTerm).trim());

  return {
    $match: {
      $or: [
        { 'produitDoc.name': { $regex: search, $options: 'i' } },
        { 'fournisseurDoc.firstName': { $regex: search, $options: 'i' } },
        { 'fournisseurDoc.lastName': { $regex: search, $options: 'i' } },
        { 'fournisseurDoc.adresse': { $regex: search, $options: 'i' } },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: '$fournisseurDoc.phoneNumber' },
              regex: search,
              options: 'i',
            },
          },
        },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: '$quantity' },
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
        {
          $expr: {
            $regexMatch: {
              input: {
                $dateToString: { format: '%d/%m/%Y', date: '$deliveryDate' },
              },
              regex: search,
              options: 'i',
            },
          },
        },
      ],
    },
  };
};

// Create a new approvisonement
exports.createApprovisonement = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { produit, quantity, price, ...restOfData } = req.body;
    const formatQuantity = Number(quantity);
    const formatPrice = Number(price);

    // Vérification si le produit est fourni
    if (!produit) {
      throw new Error('Produit non trouvé');
    }

    // 1. Mise à jour du stock produit
    const updatedProduct = await Produit.findByIdAndUpdate(
      produit,
      { $inc: { stock: formatQuantity } },
      { new: true, session }
    );

    if (!updatedProduct) {
      throw new Error('Produit introuvable en base');
    }

    // 2. Création de l’approvisionnement
    const approvisonement = await Approvisonement.create(
      [
        {
          produit,
          quantity: formatQuantity,
          price: formatPrice,
          ...restOfData,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(approvisonement[0]);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Get all approvisonements
exports.getAllApprovisonements = async (req, res) => {
  try {
    const approvisonements = await Approvisonement.find()
      // Trie par date de création, du plus récent au plus ancien
      .sort({ createdAt: -1 })
      .populate('produit')
      .populate('fournisseur');
    return res.status(200).json(approvisonements);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * GET /api/approvisonnements/paginationApprovisonements?page=&limit=&search=
 * Pagination + recherche côté serveur pour la liste Approvisionnements.
 * Utilise $lookup (équivalent populate) puis $facet pour data + total en 1 requête.
 * Structure de chaque item identique à getAllApprovisonements (produit + fournisseur objets).
 *
 * Réponse :
 * { results: { data, page, limit, total, totalPages } }
 */
exports.getPaginationApprovisonements = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const pipeline = [
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'produits',
          localField: 'produit',
          foreignField: '_id',
          as: 'produitDoc',
        },
      },
      { $unwind: { path: '$produitDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'fournisseurs',
          localField: 'fournisseur',
          foreignField: '_id',
          as: 'fournisseurDoc',
        },
      },
      { $unwind: { path: '$fournisseurDoc', preserveNullAndEmptyArrays: true } },
    ];

    const searchStage = buildApproSearchMatchStage(search);
    if (searchStage) {
      pipeline.push(searchStage);
    }

    pipeline.push({
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              produit: '$produitDoc',
              fournisseur: '$fournisseurDoc',
              quantity: 1,
              price: 1,
              deliveryDate: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
      },
    });

    const [aggregationResult] = await Approvisonement.aggregate(pipeline);
    const total = aggregationResult?.totalCount[0]?.count ?? 0;
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    return res.status(200).json({
      results: {
        data: aggregationResult?.data ?? [],
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get a single approvisonement by ID
exports.getApprovisonementById = async (req, res) => {
  try {
    const approvisonement = await Approvisonement.findById(req.params.id)
      .populate('Produit')
      .populate('fournisseur');

    if (!approvisonement) {
      return res.status(404).json({ message: 'Approvisonement not found' });
    }

    return res.status(200).json(approvisonement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an approvisonement by ID
exports.cancelApprovisonement = async (req, res) => {
  try {
    const approvisonement = await Approvisonement.findByIdAndDelete(
      req.params.id
    );

    if (!approvisonement) {
      return res.status(404).json({ message: 'Approvisonement not found' });
    }

    // On décrémente le stock du PRODUIT associé
    await Produit.findByIdAndUpdate(
      approvisonement.produit,
      { $inc: { stock: -approvisonement.quantity } },
      { new: true }
    );

    return res
      .status(200)
      .json({ message: 'Approvisonement deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer une APPROVISONNEMENT
exports.deleteApprovisonement = async (req, res) => {
  try {
    const approvisonement = await Approvisonement.findByIdAndDelete(
      req.params.id
    );

    if (!approvisonement) {
      return res.status(404).json({ message: 'Approvisonement not found' });
    }

    return res
      .status(200)
      .json({ message: 'Approvisonement deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
