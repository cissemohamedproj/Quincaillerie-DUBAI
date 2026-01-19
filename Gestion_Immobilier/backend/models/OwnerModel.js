const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    pieceNumber: {
      type: String,
      required: true,
    },
    adresse: {
      type: String,
      required: true,
    },

    phoneNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    secondePhoneNumber: {
      type: Number,
      default: 0,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Owner = mongoose.model('Owner', ownerSchema);

module.exports = Owner;
