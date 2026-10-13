# Avancement

Point de reprise du projet, mis à jour à chaque étape. Roadmap : section 14 du cahier des charges.

## Phases

| Phase | État | Contenu |
| --- | --- | --- |
| 0 — Socle | ✅ fait | Monorepo, schéma générique PostgreSQL, API minimale, CI GitHub Actions, Docker Compose pour le VPS |
| 1 — Contenu de base | ✅ fait (à enrichir) | 9 domaines et sous-thèmes ; Réseau (14 fiches et outils, 8 questions), SOC (9 fiches et outils, 4 questions), GRC (6 fiches, 4 questions), Pentest (6 fiches et outils, 2 questions), premières fiches Crypto et PKI ; 7 alertes d'exemple |
| 2 — Interface navigation et entraînement | ✅ fait | Veille du jour, navigation par domaine, fiche détaillée, recherche transverse, entraînement entretien avec feedback, progression ; responsive mobile |
| 3 — Serveur MCP de génération | ⏳ à faire | `generate_fiche`, `generate_question_entretien`, `validate_content` |
| 4 — Veille automatisée | ⏳ à faire | `sync_veille` planifié (CERT-FR, ANSSI, CISA KEV…), liaison automatique aux fiches |
| 5 — Design final et cohérence multi-projets | 🟡 amorcé | Tokens dans `apps/web/src/styles/tokens.css`, à aligner avec le simulateur CCNA |
| 6 — Extension | ⏳ à faire | Nouveaux formats (cas pratiques, mini-CTF) via de nouveaux schémas de `corps` |

## Vérifié

- `npm run typecheck`, `npm test` (53 tests : moteur d'évaluation, API sur PostgreSQL réel, contrôle qualité du contenu, composants et formats du frontend), `npm run build`.
- Les 3 écrans et les pages annexes rendus dans Chromium en 1440 px et 390 px, sans erreur console ni débordement horizontal.
- CI GitHub Actions au vert : typage, tests sur PostgreSQL, build et construction des images Docker `api` et `web`.
- Serveur compilé lancé avec la même disposition de fichiers que l'image Docker : migrations, chargement du contenu et API OK.

## Non vérifié

- **Déploiement sur le VPS** : rien n'est déployé. Le job `deployer` reste inactif tant que les secrets ne sont pas configurés (voir `DEPLOIEMENT.md`).

## Décisions à prendre

1. **Sous-domaine** et confirmation du reverse proxy en place sur le VPS (nginx, Traefik, Caddy ?).
2. **Accès au dépôt `ccna-exam`** : il n'a pas pu être consulté. Le connecter permettra d'aligner tokens de design, moteur de quiz et dashboard.
3. **Phase 3** : quel modèle IA pour la génération (API Claude, ou IA locale type Ollama sur le homelab) ? Cela conditionne `generate_fiche` et la validation.
4. **Phase 4** : liste définitive des sources de veille (proposition : avis et alertes CERT-FR, actualités ANSSI, catalogue CISA KEV, CNIL).

## Prochaines étapes proposées

1. Phase 3 : `apps/mcp`, serveur MCP exposant les 4 outils de la section 11, qui écrit en base des contenus `origine = 'mcp'` validés par les schémas de `packages/shared` et par `validate_content` avant passage en `publie`.
2. Phase 4 : connecteurs de sources (flux RSS/JSON du CERT-FR, CISA KEV), tâche planifiée, journal `synchronisation`, puis `ALERTES_DEMO=false`.
3. Compléter le contenu manuel des domaines vides (IA, Métiers, Admin sys, Web & cloud) ou le générer en phase 3.
