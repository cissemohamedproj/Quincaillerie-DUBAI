const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    pieceNumber: {
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
      required: true,
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

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
