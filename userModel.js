const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    fullname: {
        type: String,
        required: [true, 'Le nom complet est requis.'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'L\'adresse email est requise.'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Le mot de passe est requis.']
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'agent', 'admin'],
        default: 'user'
    },
    agentProfile: {
        agencyName: { type: String, trim: true },
        experience: { type: Number, min: 0 },
        specialization: { type: String, trim: true },
        bio: { type: String, trim: true, maxlength: 500 }
    },
    // Nouveau champ pour gérer le processus de candidature
    agentApplicationStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none'
    },
    favorites: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
        default: []
    }
}, {
    timestamps: true // Ajoute les champs createdAt et updatedAt
});

// Hook (middleware) Mongoose pour hacher le mot de passe avant de l'enregistrer
userSchema.pre('save', async function(next) {
    // Ne hacher le mot de passe que s'il a été modifié (ou est nouveau)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Méthode pour comparer le mot de passe entré avec le mot de passe haché dans la DB
userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);