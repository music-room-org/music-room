# Image de base : Node.js 24 # Node 24 : version LTS (Long Term Support = stable et maintenue jusqu'en 2028 et exécute le TypeScript directement (type stripping intégré))
FROM node:24-alpine

# Dossier de travail à l'intérieur du conteneur
WORKDIR /app

# On copie d'abord SEULEMENT les fichiers de dépendances
COPY package*.json ./

# On installe les dépendances
RUN npm install

# On copie le reste du code du backend
COPY . .

# On génère le client Prisma (le "pont" vers la base)
RUN npx prisma generate

# On indique le port sur lequel le serveur écoutera
EXPOSE 3000

# Au démarrage du conteneur : lance le serveur NestJS en mode dev (rechargement auto)
CMD ["npm", "run", "start:dev"]