const mongoose = require('mongoose');

const paiementSchema = new mongoose.Schema(
  {
   
    totalPaye: {
      type: Number,
      required: true,
      trim: true,
    },
   

    paiementDate: {
      type: Date,
      required: true,
    },
    
    
    contrat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contrat',
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

const Paiement = mongoose.model('Paiement', paiementSchema);
module.exports = Paiement;
