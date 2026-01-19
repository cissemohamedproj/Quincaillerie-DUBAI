const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      require: true,
    },
    rentPrice: {
      type: Number,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
      trim: true,
    },

    endDate: {
      type: Date,
      required: true,
      trim: true,
    },

    statut: {
      type: String,
      enum: ['loading', 'closed'],
      default: 'loading',
      required: true,
      trim: true,
    },
    appartement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appartement',
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

const Rental = mongoose.model('Rental', rentalSchema);
module.exports = Rental;
