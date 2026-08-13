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