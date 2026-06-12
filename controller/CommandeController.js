const mongoose = require('mongoose');
const Commande = require('../models/CommandeModel');
const Paiement = require('../models/PaiementModel');
const Produit = require('../models/ProduitModel');
const PaiementHistorique = require('../models/PaiementHistoriqueModel');
const LivraisonHistorique = require('../models/LivraisonHistoriqueModel');

// Créer une COMMANDE
exports.createCommande = async (req, res) => {
  const session = await Produit.startSession();
  session.startTransaction();
  try {
    const { fullName, phoneNumber, adresse, items, ...restOfData } = req.body;
    const lowerName = fullName.toLowerCase();
    const lowerAdresse = adresse.toLowerCase();
    const formattedPhoneNumber = Number(phoneNumber);

    // Etape 1 :  Vérifier si les items existent et si le stock est suffisant
    for (const { produit, quantity } of items) {
      // Parcourir chaque produit dans les items
      const prod = await Produit.findById(produit).session(session);
      if (!prod) {
        throw new Error(`Produit ${produit} non trouvé`);
      }

      // Vérifier si le stock est suffisant
      // Si le stock est insuffisant, retourner une erreur
      if (prod.stock < quantity) {
        console.log(
          `Stock insuffisant pour ${prod.name}. Disponible : ${prod.stock}`
        );
        return res.status(404).json({
          message: `Stock insuffisant pour: ${prod.name} Stock: ${prod.stock}`,
        });
      }

      // Si le stock est suffisant, décrémenter le stock
      // et sauvegarder le produit
      prod.stock -= quantity;
      await prod.save({ session });
    }

    // -----------------------------------------------------------

    // Etape 2 : Créer la COMMANDE
    // Créer une nouvelle commande avec les données fournies
    const newCommande = await Commande.create({
      items,
      fullName: lowerName,
      adresse: lowerAdresse,
      phoneNumber: formattedPhoneNumber,
      ...restOfData,
    });

    // On arrêtre la session
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(newCommande);
  } catch (error) {
    console.log("Erreur de validation l'Commande :", error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Trouver toutes les commandes
exports.getAllCommandes = async (req, res) => {
  try {
    const commandesListe = await Commande.find()
      // Trie par date de création, du plus récent au plus ancien
      .sort({ commandeDate: -1 })
      .populate('items.produit');

    // Afficher les COMMANDES en fonction des PAIEMENTS effectués
    const factures = await Paiement.find()
      .populate({
        path: 'commande',
        populate: { path: 'items.produit' },
      })
      .sort({ commandeDate: -1 });
    return res.status(201).json({ commandesListe, factures });
  } catch (e) {
    return res.status(404).json(e);
  }
};

exports.getPagignationCommandes = async (req, res) => {
  try {
    // 1️ Récupération des paramètres
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    // 2️ Commandes paginées
    const commandesListe = await Commande.find()
      .sort({ commandeDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.produit');

    // 3️ Total des commandes (pour le frontend)
    const totalCommandes = await Commande.countDocuments();

    // 4️ Factures paginées
    const factures = await Paiement.find()
      .sort({ paiementDate: -1 })
      .limit(limit)
      .skip(skip)
      .populate({
        path: 'commande',
        populate: { path: 'items.produit' },
      });

    const totalFactures = await Paiement.countDocuments();

    // 5️ Réponse structurée
    return res.status(200).json({
      commandes: {
        data: commandesListe,
        page,
        limit,
        total: totalCommandes,
        totalPages: Math.ceil(totalCommandes / limit),
      },
      factures: {
        data: factures,
        page,
        limit,
        total: totalFactures,
        totalPages: Math.ceil(totalFactures / limit),
      },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * Échappe les caractères spéciaux pour une regex MongoDB sûre (recherche commandes).
 */
const escapeRegexCommande = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Interprète un query param Express ("true", true, "1", etc.) en booléen.
 */
const parseQueryBool = (value) =>
  value === true ||
  value === 'true' ||
  value === '1' ||
  value === 1;

/**
 * Construit le filtre MongoDB pour l'historique des commandes.
 * Reproduit la logique frontend : recherche texte + filtres checkboxes
 * (aujourd'hui, en cours, en attente).
 */
const buildCommandeHistoriqueFilter = (
  search,
  today,
  todayDate,
  timezone,
  filterEnCours,
  filterEnAttente
) => {
  const andConditions = [];

  // Filtres statut : si les 2 sont cochés → $or (en cours OU en attente)
  const statutOr = [];
  if (parseQueryBool(filterEnCours)) {
    statutOr.push({ statut: /^en cours$/i });
  }
  if (parseQueryBool(filterEnAttente)) {
    statutOr.push({ statut: /^en attente$/i });
  }
  if (statutOr.length === 1) {
    andConditions.push(statutOr[0]);
  } else if (statutOr.length > 1) {
    andConditions.push({ $or: statutOr });
  }

  /**
   * Aujourd'hui — reproduit l'ancien filtre client :
   * new Date(d).toLocaleDateString() === new Date().toLocaleDateString()
   * Le frontend envoie todayDate (YYYY-MM-DD) + timezone IANA du navigateur.
   */
  if (parseQueryBool(today)) {
    const dateKey =
      todayDate && /^\d{4}-\d{2}-\d{2}$/.test(String(todayDate))
        ? String(todayDate)
        : new Date().toLocaleDateString('en-CA');
    const tz = timezone && String(timezone).trim() ? String(timezone) : 'UTC';

    andConditions.push({
      $or: [
        {
          $expr: {
            $eq: [
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$commandeDate',
                  timezone: tz,
                },
              },
              dateKey,
            ],
          },
        },
        {
          $expr: {
            $eq: [
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt',
                  timezone: tz,
                },
              },
              dateKey,
            ],
          },
        },
      ],
    });
  }

  if (search && String(search).trim()) {
    const escaped = escapeRegexCommande(String(search).trim());
    const regex = new RegExp(escaped, 'i');

    andConditions.push({
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
        {
          $expr: {
            $regexMatch: {
              input: { $toString: { $size: '$items' } },
              regex: escaped,
              options: 'i',
            },
          },
        },
        {
          $expr: {
            $regexMatch: {
              input: {
                $dateToString: { format: '%d/%m/%Y', date: '$commandeDate' },
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
      ],
    });
  }

  if (andConditions.length === 0) return {};
  if (andConditions.length === 1) return andConditions[0];
  return { $and: andConditions };
};

/**
 * GET /api/commandes/paginationCommandesHistorique
 * Pagination + recherche + filtres pour la page "Historique des Commandes".
 * paginationCommandes et getAllCommandes restent inchangés.
 *
 * Query params :
 * - page, limit, search
 * - today=true          → commandes créées aujourd'hui (createdAt)
 * - filterEnCours=true  → statut "en cours"
 * - filterEnAttente=true → statut "en attente"
 *
 * Réponse :
 * {
 *   results: {
 *     data: [...commandes avec hasFacture, montantCommande, montantRestant],
 *     page, limit, total, totalPages,
 *     stats: { livre, enCours, enAttente }
 *   }
 * }
 */
exports.getPaginationCommandesHistorique = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const today = req.query.today;
    const todayDate = req.query.todayDate;
    const timezone = req.query.timezone;
    const filterEnCours = req.query.filterEnCours;
    const filterEnAttente = req.query.filterEnAttente;

    const filter = buildCommandeHistoriqueFilter(
      search,
      today,
      todayDate,
      timezone,
      filterEnCours,
      filterEnAttente
    );

    const [commandesListe, total, statsAgg] = await Promise.all([
      Commande.find(filter)
        .sort({ commandeDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.produit')
        .lean(),
      Commande.countDocuments(filter),
      Commande.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            livre: {
              $sum: {
                $cond: [{ $regexMatch: { input: '$statut', regex: /^livré$/i } }, 1, 0],
              },
            },
            enCours: {
              $sum: {
                $cond: [{ $regexMatch: { input: '$statut', regex: /^en cours$/i } }, 1, 0],
              },
            },
            enAttente: {
              $sum: {
                $cond: [{ $regexMatch: { input: '$statut', regex: /^en attente$/i } }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const pageIds = commandesListe.map((c) => c._id);
    const paiementsPage = await Paiement.find(
      { commande: { $in: pageIds } },
      'commande totalAmount totalPaye'
    ).lean();

    /** Map commandeId → paiement pour calcul fiable des montants */
    const paiementByCommandeId = new Map(
      paiementsPage.map((p) => [String(p.commande), p])
    );

    const data = commandesListe.map((commande) => {
      const paiement = paiementByCommandeId.get(String(commande._id));
      /**
       * Montant commande : total facturé (paiement.totalAmount après réduction)
       * ou totalAmount de la commande si aucune facture.
       * Montant restant : totalAmount - totalPaye (0 si entièrement payé).
       */
      const montantCommande = paiement
        ? Number(paiement.totalAmount) || 0
        : Number(commande.totalAmount) || 0;
      const montantPaye = paiement ? Number(paiement.totalPaye) || 0 : 0;
      const montantRestant = Math.max(montantCommande - montantPaye, 0);

      return {
        ...commande,
        hasFacture: Boolean(paiement),
        montantCommande,
        montantRestant,
      };
    });

    const stats = statsAgg[0] ?? { livre: 0, enCours: 0, enAttente: 0 };
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    return res.status(200).json({
      results: {
        data,
        page,
        limit,
        total,
        totalPages,
        stats: {
          livre: stats.livre ?? 0,
          enCours: stats.enCours ?? 0,
          enAttente: stats.enAttente ?? 0,
        },
      },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// Trouver une seulle COMMANDE
exports.getOneCommande = async (req, res) => {
  try {
    const commandeData = await Commande.findById(req.params.id).populate(
      'items.produit'
    );

    // ID de PAIEMENT correspondant au COMMANDE
    const paiementCommande = await Paiement.findOne({
      commande: req.params.id,
    }).populate({
      path: 'commande',
      populate: { path: 'items.produit' },
    });
    return res.status(201).json({ commandeData, paiementCommande });
  } catch (e) {
    return res.status(404).json(e);
  }
};

// -----------------------------------------------

// Decrementer la Quantité commandé sur le stock du produit
exports.decrementMultipleStocks = async (req, res) => {
  const session = await Produit.startSession();
  session.startTransaction();

  try {
    const items = req.body.items; // [{ id, quantity }, ...]

    for (const { produit, quantity } of items) {
      const produits = await Produit.findById(produit).session(session);
      if (!produits) {
        throw new Error(`Produit ${produit} non trouvé`);
      }

      if (produits.stock < quantity) {
        console.log(
          `Stock insuffisant pour ${produits.name}. Disponible : ${produits.stock}`
        );
      }

      produits.stock -= quantity;
      await produits.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: 'Stocks mis à jour avec succès' });
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({ message: err.message });
  }
};

// ----------------------------------------------------------------------------

// Annuler une COMMANDE et faire retablir le stock de PRODUIT
exports.deleteCommande = async (req, res) => {
  const session = await Produit.startSession();
  session.startTransaction();

  try {
    const commandeId = req.params.commandeId;
    const { items } = req.body;

    // Etape 1: Retablir le Stock
    for (const { produit, quantity } of items) {
      const produits = await Produit.findById(produit).session(session);
      if (!produits) {
        throw new Error(`Produit ${produit} non trouvé`);
      }
      produits.stock += quantity;
      await produits.save({ session });
    }

    // Etape 2:  supprime le PAIEMENT et son HISTORIQUE lié
    const paiement = await Paiement.find({ commande: commandeId });

    // Si il ya au mois un PAIEMENT
    if (paiement) {
      const paieHistorique = await PaiementHistorique.find({
        commande: commandeId,
      });
      // parcourir dans chaque PaiementHistorique pour supprimer
      for (const paiHis of paieHistorique) {
        await PaiementHistorique.findByIdAndDelete(paiHis);
      }
      // en suite supprimer le Paiement
      await Paiement.findByIdAndDelete(paiement);
    }

    // Etape 3: supprimer LivraisonHistorique si ça existe
    const livHistorique = await LivraisonHistorique.find({
      commande: commandeId,
    });
    if (livHistorique) {
      for (const hist of livHistorique) {
        await LivraisonHistorique.findByIdAndDelete(hist);
      }
    }

    // Etape 4: Supprimer la COMMANDE
    const deletedCommande = await Commande.findByIdAndDelete(commandeId, {
      session,
    });
    if (!deletedCommande) {
      throw new Error('Commande non trouvée');
    }

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json({ message: 'Annulation réussie, stock rétabli.' });
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({ message: err.message });
  }
};

// --------------------------------------------------------------------------
// --------- Modifier une Commande ----------------------------------

exports.updateCommande = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { commandeId } = req.params;
    const { fullName, phoneNumber, adresse, statut, items, totalAmount } =
      req.body;

    const existingCommande = await Commande.findById(commandeId).session(
      session
    );
    if (!existingCommande) {
      throw new Error('Commande non trouvée');
    }

    // Étape 1 : Restaurer les anciens stocks
    for (const item of existingCommande.items) {
      const produit = await Produit.findById(item.produit).session(session);
      if (!produit) throw new Error(`Produit ${item.produit} non trouvé`);
      produit.stock += item.quantity;
      await produit.save({ session });
    }

    // Étape 2 : Vérifier stock des nouveaux items
    for (const { produit, quantity } of items) {
      const prod = await Produit.findById(produit).session(session);
      if (!prod) throw new Error(`Produit ${produit} non trouvé`);
      if (prod.stock < quantity) {
        throw new Error(`Stock insuffisant pour le produit : ${prod.name}`);
      }
    }

    // Étape 3 : Décrémenter le nouveau stock
    for (const { produit, quantity } of items) {
      const prod = await Produit.findById(produit).session(session);
      prod.stock -= quantity;
      await prod.save({ session });
    }

    // Étape 4 : Mettre à jour la commande
    existingCommande.fullName = fullName || 'non défini';
    existingCommande.phoneNumber = phoneNumber;
    existingCommande.adresse = adresse;
    existingCommande.statut = statut;
    existingCommande.items = items;
    existingCommande.totalAmount = totalAmount;

    await existingCommande.save({ session });

    const paiement = await Paiement.findOne({ commande: commandeId }),
      paiementId = paiement ? paiement._id : null;
    if (paiementId) {
      const paiementRecord = await Paiement.findById(paiementId).session(
        session
      );
      if (paiementRecord) {
        paiementRecord.totalAmount = totalAmount;
        await paiementRecord.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json({ message: 'Commande mise à jour avec succès' });
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
};

/**
 * GET /api/commandes/countCommandesDashboard
 * Compteurs légers pour les 3 cartes Commandes du Dashboard.
 * Une seule requête HTTP remplace getAllCommandes (qui charge commandes + factures + populate).
 * Promise.all exécute les 3 countDocuments en parallèle côté MongoDB.
 * Réponse : { total, enAttente, enCours } — uniquement des nombres.
 * Note : le champ MongoDB est "statut" (pas "status" utilisé par erreur dans l'ancien frontend).
 */
exports.countCommandesDashboard = async (req, res) => {
  try {
    const [total, enAttente, enCours] = await Promise.all([
      Commande.countDocuments(),
      Commande.countDocuments({ statut: 'en attente' }),
      Commande.countDocuments({ statut: 'en cours' }),
    ]);

    return res.status(200).json({ total, enAttente, enCours });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// Produits les plus Commandés
exports.getTopProduits = async (req, res) => {
  try {
    const results = await Commande.aggregate([
      { $unwind: '$items' }, // décompose le tableau items
      {
        $group: {
          _id: '$items.produit',
          totalQuantity: { $sum: '$items.quantity' },
        },
      },
      {
        $lookup: {
          from: 'produits',
          localField: '_id',
          foreignField: '_id',
          as: 'produit',
        },
      },
      { $unwind: '$produit' },
      { $sort: { totalQuantity: -1 } }, // tri du plus acheté au moins acheté
      // { $limit: limit }, // limiter le nombre de résultats
      {
        $project: {
          _id: 0,
          produitId: '$produit._id',
          name: '$produit.name',
          imageUrl: '$produit.imageUrl',
          price: '$produit.price',
          achatPrice: '$produit.achatPrice',
          totalQuantity: 1,
        },
      },
    ]);
    return res.status(200).json(results);
  } catch (error) {
    return res.status(404).json({ message: error });
  }
};

/**
 * Échappe les caractères spéciaux pour une regex MongoDB sûre (recherche).
 */
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Pipeline d'agrégation commun : regroupe les quantités commandées par produit,
 * joint la collection produits, trie par totalQuantity décroissant.
 * Même logique que getTopProduits, réutilisé pour la version paginée.
 */
const buildTopProduitsBasePipeline = () => [
  { $unwind: '$items' },
  {
    $group: {
      _id: '$items.produit',
      totalQuantity: { $sum: '$items.quantity' },
    },
  },
  {
    $lookup: {
      from: 'produits',
      localField: '_id',
      foreignField: '_id',
      as: 'produit',
    },
  },
  { $unwind: '$produit' },
  { $sort: { totalQuantity: -1 } },
  {
    $project: {
      _id: 0,
      produitId: '$produit._id',
      name: '$produit.name',
      imageUrl: '$produit.imageUrl',
      price: '$produit.price',
      achatPrice: '$produit.achatPrice',
      totalQuantity: 1,
    },
  },
];

/**
 * GET /api/commandes/paginationTopProduitsCommande?page=&limit=&search=
 * Version paginée + recherche pour la page "Top Produit".
 * getTopProduits (topProduitsCommande) reste inchangé pour compatibilité.
 *
 * Réponse :
 * { results: { data, page, limit, total, totalPages } }
 * Chaque item a la même forme que getTopProduits (produitId, name, price, totalQuantity…).
 */
exports.getPaginationTopProduits = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const pipeline = buildTopProduitsBasePipeline();

    if (search && String(search).trim()) {
      const escaped = escapeRegex(String(search).trim());
      const regex = new RegExp(escaped, 'i');

      pipeline.push({
        $match: {
          $or: [
            { name: regex },
            {
              $expr: {
                $regexMatch: {
                  input: { $toString: '$totalQuantity' },
                  regex: escaped,
                  options: 'i',
                },
              },
            },
            {
              $expr: {
                $regexMatch: {
                  input: { $toString: '$price' },
                  regex: escaped,
                  options: 'i',
                },
              },
            },
            {
              $expr: {
                $regexMatch: {
                  input: { $toString: '$achatPrice' },
                  regex: escaped,
                  options: 'i',
                },
              },
            },
          ],
        },
      });
    }

    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    });

    const [aggregationResult] = await Commande.aggregate(pipeline);
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
