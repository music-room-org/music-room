# Backend

## Lancer le projet

```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```

Le serveur démarre sur http://localhost:3000

## Tester

```bash
curl http://localhost:3000/health
```

Réponse attendue : `{"status":"ok"}`