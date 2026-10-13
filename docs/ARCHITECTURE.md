# Architecture

## Vue d'ensemble

```
navigateur ── nginx (conteneur web) ──/api──> API Fastify ──> PostgreSQL
                 └── fichiers statiques React        ^
                                                     └── content/ (chargé au démarrage)
```

- **`packages/shared`** : source de vérité du modèle. Les schémas zod valident le contenu versionné, les charges utiles de l'API, et serviront à valider le contenu généré par le serveur MCP (phase 3). Les types de réponse de l'API y sont partagés avec le frontend.
- **`apps/api`** : Fastify 5, `pg`, SQL écrit à la main (pas d'ORM). Au démarrage : migrations, puis chargement idempotent de `content/`.
- **`apps/web`** : React 19, React Router 7, Vite. CSS maison à partir de tokens (`src/styles/tokens.css`) pensés pour être partagés avec le simulateur CCNA.

## Modèle de données (section 11 du cahier des charges)

| Table | Rôle |
| --- | --- |
| `domaine`, `sous_theme` | Les 9 domaines et leurs sous-thèmes |
| `contenu` | Entité générique : `type` (`fiche`, `question`, `outil`), domaine, sous-thème, titre, résumé, difficulté, `corps` JSONB propre au type, `statut`, `origine` (`manuel` ou `mcp`), `version` |
| `lien_contenu` | Liens croisés typés (`vecteur-attaque`, `prerequis`, `voir-aussi`, `outil`), affichés dans les deux sens |
| `alerte`, `alerte_domaine`, `alerte_contenu` | Alertes de veille, criticité, rattachement aux domaines et fiches |
| `synchronisation` | Journal des exécutions de `sync_veille` (phase 4) |
| `validation` | Rapports de `validate_content` avant publication (phase 3) |
| `tentative` | Réponses du mode entraînement, score et verdict |

Le `corps` en JSONB évite une table par type de contenu : ajouter un format (cas pratique, mini-CTF…) revient à ajouter un schéma zod, sans migration (phase 6).

## Décisions

- **Contenu manuel versionné dans Git** (`content/*.json`) : relu en revue de code, chargé au démarrage. Un contenu manuel retiré des fichiers est supprimé de la base ; le contenu `origine = 'mcp'` n'est jamais touché par ce chargement.
- **Évaluation des réponses déterministe** (`evaluerReponse`) : chaque question déclare ses points clés et des mots-clés acceptés (sans accents ni casse, sigles courts en mot entier). C'est explicable et testable ; une évaluation par IA pourra s'ajouter en phase 3. Un test vérifie que la réponse de référence de chaque question valide ses propres points clés.
- **Réponse de référence cachée** : `GET /api/contenus/:id` ne renvoie pas le corps d'une question ; il est révélé par le feedback après réponse.
- **Utilisateur unique** pour l'instant (pas de comptes) : la progression est globale. À revoir si l'application devient multi-utilisateur.

## API

| Méthode | Route | Rôle |
| --- | --- | --- |
| GET | `/api/sante` | Santé (base joignable) |
| GET | `/api/veille?heures=24` | Alertes de la fenêtre, triées par criticité, compteurs, dernière synchro |
| GET | `/api/domaines` | Domaines avec nombre de contenus, questions, maîtrise, alertes sur 7 jours |
| GET | `/api/domaines/:slug` | Domaine et sous-thèmes |
| GET | `/api/contenus?domaine=&sousTheme=&type=a,b&difficulte=a,b` | Cartes de contenu filtrées |
| GET | `/api/contenus/:id` | Fiche complète, liens et alertes liées |
| GET | `/api/recherche?q=` | Recherche transverse (contenus et alertes, insensible aux accents) |
| GET | `/api/entrainement/question?domaines=&exclure=&id=` | Tirage d'une question (priorité aux questions jamais réussies) |
| POST | `/api/entrainement/reponses` | `{questionId, reponse}` → feedback et enregistrement de la tentative |
| GET | `/api/progression` | Maîtrise par domaine et dernières tentatives |
