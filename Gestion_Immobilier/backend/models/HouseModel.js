const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema(
  {
    owner: {
      typpe: mongoose.Schema.Types.ObjectId,
      ref: 'Owner',
      required: true,
    },
    adresse: {
      type: String,
      required: true,
      max: 30,
    },
    categorie: {
      type: String,
      enum: ['Appartement', 'Villa', 'Studio', 'Duplex', 'Etage'],
      required: true,
    },
    toilet: {
      type: Number,
      required: true,
    },
    appartementNumber: {
      type: Number,
      required: true,
    },
    storeNumber: {
      type: Number,
      required: true,
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

const House = mongoose.model('House', houseSchema);

module.exports = House;
