const mongoose = require('mongoose');

const depenseSchema = new mongoose.Schema(
  {
    secteur:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Secteur',
      required: true,
    },
   

    totalAmount: {
      type: Number,
      required: true,
      trim: true,
    },

    motifDepense: {
      type: String,
      required: true,
    },
    dateOfDepense: {
      type: Date,
      default: Date.now,
      required: true,
    },
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rental',
      
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Depense = mongoose.model('Depense', depenseSchema);
module.exports = Depense;
