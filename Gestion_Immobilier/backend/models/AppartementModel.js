const mongoose = require('mongoose');

const appartementSchema = new mongoose.Schema(
  {
    chambre: {
      type: Number,
      required: true,
      trim: true,
    },

    bathroom: {
      type: Number,
      required: true,
      trim: true,
    },
    livingRoom: {
      type: Number,
      default: 0,
      trim: true,
    },
    kitchen: {
      type: Number,
      required: true,
      trim: true,
    },
    store: {
      type: Number,
      required: true,
      trim: true,
    },
    electricity: {
      type: Boolean,
      required: true,
      trim: true,
    },

    water: {
      type: Boolean,
      default: true,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      default: '',
    },
    statut: {
      type: Boolean,
      default: true,
      trim: true,
      required: true,
    },

    rentPrice: {
      type: Number,
      required: true,
      trim: true,
    },

    house: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'House',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Appartement = mongoose.model('Appartement', appartementSchema);

module.exports = Appartement;
