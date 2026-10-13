# IT-YRATECH

Base de connaissances interactive et outil de veille en cybersécurité et réseau : veille du jour, navigation par domaine, mode entraînement entretien. Le cahier des charges complet est dans [`CAHIER_DES_CHARGES.md`](CAHIER_DES_CHARGES.md).

- État d'avancement et prochaines étapes : [`docs/AVANCEMENT.md`](docs/AVANCEMENT.md)
- Architecture et modèle de données : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Déploiement sur le VPS : [`docs/DEPLOIEMENT.md`](docs/DEPLOIEMENT.md)
- Écrire du contenu : [`content/README.md`](content/README.md)

## Structure

```
packages/shared   modèle de contenu (schémas zod), types de l'API, moteur d'évaluation
apps/api          API REST Fastify + PostgreSQL (migrations, chargement du contenu)
apps/web          interface React + Vite (« cockpit de veille »)
content/          contenu versionné : domaines, fiches, questions, outils, alertes d'exemple
infra/            configuration nginx du conteneur web
```

## Démarrer en local

Prérequis : Node.js 22+ et PostgreSQL 16.

```bash
npm install
cp .env.example .env          # adapter DATABASE_URL si besoin
createdb yratech              # ou via psql, avec l'utilisateur de DATABASE_URL

npm run build -w @yratech/shared
npm run db:seed               # applique les migrations et charge content/
npm run dev:api               # http://localhost:3000/api/sante
npm run dev:web               # http://localhost:5173 (relaie /api vers l'API)
```

Les scripts lisent les variables d'environnement du shell (`export $(cat .env | xargs)` pour charger `.env`).

## Vérifications

```bash
npm run typecheck
npm test          # tests unitaires + intégration (base TEST_DATABASE_URL, réinitialisée)
npm run build
```

Les tests d'intégration **vident** la base pointée par `TEST_DATABASE_URL` : utilisez une base dédiée (`yratech_test`).
