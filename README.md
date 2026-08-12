# Music Room

## Convention de nommage des branches

| Nom | Pourquoi | Exemple |
| -------- | ------- | ------- |
| `feat/` | Nouvelle feature ou fonctionnalité | `feat/user-authentication` |
| `fix/` | Correction de bug | `fix/login-button-disabled` |
| `refactor/` | Amélioration du code sans changer les fonctionnalités ni corriger les bugs | `refactor/simplify-auth-logic` |
| `chore/` | Maintenance, configuration, dépendances, configuration des outils, tests | `chore/update-dependencies` |

###

## Règles de commit / checks
- Le force push est bloqué
- Les branches doivent suivre la convention de nommage
- Le code doit compiler

## Ressources
### [Notion](https://app.notion.com/p/TODO-3b22167339ce804faff4d1cebadbad4d?source=copy_link)
### [Repo](https://github.com/music-room-org/music-room)
### Figma (a créer)

*****************************************************************************************************

🚀 Lancer le backend (NestJS + Prisma)

⚠️ État actuel : le serveur démarre et la route /health répond. 

Prérequis
Node.js 20 
npm (installé avec Node)
Étapes
1. Cloner le projet :
git clone git@github.com:music-room-org/music-room.git
cd music-room

2. Aller dans le dossier backend
cd backend

3. Installer les dépendances
npm install

4. Générer le client Prisma
npx prisma generate

5. Lancer le serveur en mode développement
npm run start:dev

Le serveur démarre avec rechargement automatique (il se relance à chaque modif du code).

Pour vérifier que ça marche

Le serveur écoute sur http://localhost:3000.

Dans un autre terminal (ou dans le navigateur) :

curl http://localhost:3000/health

Réponse attendue :
{"status":"ok"}


Structure du backend
backend/
├── src/                  → code NestJS
│   ├── main.ts           → point de démarrage
│   ├── app.module.ts     → module racine
│   └── health.controller.ts → route /health
├── prisma/
│   └── schema.prisma     → plan de la base (modèle User…)
├── prisma.config.ts      → config Prisma
└── package.json