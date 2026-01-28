# Projet Logement Guinée

Une plateforme web complète dédiée à l'immobilier en Guinée. Cette application permet aux particuliers et aux agents de publier des annonces de vente, de location et de colocation, tout en offrant aux visiteurs des outils de recherche avancés.

## 🚀 Fonctionnalités

- **Authentification & Utilisateurs** : Inscription, connexion sécurisée (JWT), gestion de profil, et gestion des favoris.
- **Gestion des Annonces** :
  - Publication d'annonces avec upload de photos (Multer).
  - Modification et suppression de ses propres annonces.
  - Recherche filtrée par type, ville, prix et surface.
- **Rôles & Permissions** :
  - **Utilisateur standard** : Peut consulter et publier des annonces.
  - **Agent** : Statut spécial avec profil professionnel (agence, expérience).
  - **Administrateur** : Validation des annonces et approbation des demandes pour devenir agent.
- **Communication** : Formulaire de contact avec notifications par email (Nodemailer).

## 🛠 Prérequis

Avant de commencer, assurez-vous d'avoir installé :
- [Node.js](https://nodejs.org/) (v14 ou supérieur recommandé)
- [MongoDB](https://www.mongodb.com/) (Local ou Atlas)

## 📦 Installation

1. **Cloner le projet** (ou extraire les fichiers) :
   ```bash
   cd projet-logement-guinee
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Créer le dossier pour les images** (s'il n'existe pas) :
   ```bash
   mkdir uploads
   ```

## ⚙️ Configuration

Créez un fichier `.env` à la racine du projet et configurez les variables d'environnement suivantes :

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/projet-logement-guinee
JWT_SECRET=votre_cle_secrete_tres_longue_et_complexe

# Configuration Email (pour les notifications et le contact)
EMAIL_HOST=smtp.votre-fournisseur.com
EMAIL_PORT=587
EMAIL_USER=votre-email@exemple.com
EMAIL_PASS=votre-mot-de-passe-email
EMAIL_FROM=noreply@projet-logement.com
ADMIN_EMAIL=admin@projet-logement.com
```

## ▶️ Démarrage

Pour lancer le serveur en mode développement (avec rechargement automatique via nodemon si installé, ou logs détaillés) :

```bash
node server.js
```

L'application sera accessible à l'adresse : `http://localhost:3000`