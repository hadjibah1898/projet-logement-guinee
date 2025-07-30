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