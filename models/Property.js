const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const propertySchema = new Schema({
    titre: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, required: true, enum: ['Location', 'Vente', 'Colocation'] },
    prix: { type: Number, required: true },
    surface: { type: Number, required: true },
    adresse: { type: String, required: true, trim: true },
    ville: { type: String, required: true, trim: true },
    auteur: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tel: { type: String, required: true },
    photos: [{ type: String }], // Tableau d'URLs pour les images (pour une future amélioration)
}, {
    timestamps: true
});

module.exports = mongoose.model('Property', propertySchema);