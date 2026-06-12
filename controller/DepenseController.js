const Depense = require('../models/DepenseModel');
const textValidation = require('./regexValidation');

// Create a new expense
exports.createDepense = async (req, res) => {
  try {
    const { totalAmount, motifDepense, dateOfDepense } = req.body;

    const formattedTotalAmount = Number(totalAmount);
    const formattedMotifDepense = motifDepense.toLowerCase();
    if (!formattedTotalAmount || !motifDepense) {
      return res
        .status(400)
        .json({ message: 'Le vous devez renseigner le TOTAL et le MOTIF' });
    }

    if (!textValidation.stringValidator(motifDepense)) {
      return res.status(400).json({ message: "Motif saisie n'es pas valide." });
    }

    const depense = await Depense.create({
      totalAmount: formattedTotalAmount,
      motifDepense: formattedMotifDepense,
      dateOfDepense: dateOfDepense,
    });
    return res.status(201).json(depense);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update an expense
exports.updateDepense = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalAmount, motifDepense, dateOfDepense } = req.body;
    // Format and validate the input
    const formattedTotalAmount = Number(totalAmount);
    const formattedMotifDepense = motifDepense.toLowerCase();

    // Check if the required fields are provided
    if (!formattedTotalAmount || !motifDepense) {
      return res
        .status(400)
        .json({ message: 'Le vous devez renseigner le TOTAL et le MOTIF' });
    }

    // Validate the motifDepense using regex
    if (!textValidation.stringValidator(motifDepense)) {
      return res.status(400).json({ message: "Motif saisie n'es pas valide." });
    }

    // Find the expense by ID and update it
    const depense = await Depense.findByIdAndUpdate(
      id,
      {
        totalAmount: formattedTotalAmount,
        motifDepense: formattedMotifDepense,
        dateOfDepense,
      },
      { new: true }
    );

    if (!depense) {
      return res.status(404).json({ message: 'Dépense non trouvée.' });
    }

    return res.status(200).json(depense);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all expenses
exports.getAllDepenses = async (req, res) => {
  try {
    const depenses = await Depense.find().sort({ dateOfDepense: -1 });
    return res.status(200).json(depenses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Échappe les caractères spéciaux pour une regex MongoDB sûre (recherche dépenses).
 */
const escapeRegexDepense = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Interprète un query param Express ("true", true, "1", etc.) en booléen.
 */
const parseQueryBoolDepense = (value) =>
  value === true ||
  value === 'true' ||
  value === '1' ||
  value === 1;

/**
 * Construit le filtre MongoDB pour la page Liste Dépenses (DepenseListe).
 * Recherche sur motif, montant, dates + filtre « aujourd'hui » (fuseau navigateur).
 */
const buildDepenseListeFilter = (search, today, todayDate, timezone) => {
  const andConditions = [];

  if (search && String(search).trim()) {
    const escaped = escapeRegexDepense(String(search).trim());
    const regex = new RegExp(escaped, 'i');

    andConditions.push({
      $or: [
        { motifDepense: regex },
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
                $dateToString: { format: '%d/%m/%Y', date: '$dateOfDepense' },
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

  /**
   * Dépenses du jour — reproduit l'ancien filtre client toLocaleDateString().
   */
  if (parseQueryBoolDepense(today)) {
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
              date: '$dateOfDepense',
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

/**
 * GET /api/depenses/paginationDepenses
 * Pagination + recherche + filtre « aujourd'hui » — page DepenseListe.
 * getAllDepense reste inchangé (même URL / JSON tableau simple).
 *
 * Query params : page, limit, search, today, todayDate, timezone
 *
 * Réponse :
 * {
 *   results: {
 *     data: [...depenses],
 *     page, limit, total, totalPages,
 *     stats: { sumTotalDepense }
 *   }
 * }
 */
exports.getPaginationDepenses = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const today = req.query.today;
    const todayDate = req.query.todayDate;
    const timezone = req.query.timezone;

    const filter = buildDepenseListeFilter(search, today, todayDate, timezone);

    const [depensesListe, total, statsAgg] = await Promise.all([
      Depense.find(filter)
        .sort({ dateOfDepense: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Depense.countDocuments(filter),
      Depense.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            sumTotalDepense: { $sum: { $ifNull: ['$totalAmount', 0] } },
          },
        },
      ]),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
    const sumTotalDepense = statsAgg[0]?.sumTotalDepense ?? 0;

    return res.status(200).json({
      results: {
        data: depensesListe,
        page,
        limit,
        total,
        totalPages,
        stats: { sumTotalDepense },
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get a single expense by ID
exports.getDepenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const depense = await Depense.findById(id);

    if (!depense) {
      return res.status(404).json({ message: 'Dépense non trouvée.' });
    }

    return res.status(200).json(depense);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete an expense
exports.deleteDepense = async (req, res) => {
  try {
    const { id } = req.params;
    const depense = await Depense.findByIdAndDelete(id);

    if (!depense) {
      return res.status(404).json({ message: 'Dépense non trouvée.' });
    }

    return res.status(200).json({ message: 'Dépense supprimée avec succès.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
