# Écrire du contenu

Le contenu manuel vit ici et est chargé dans la base à chaque démarrage de l'API (ou via `npm run db:seed`). Il est validé par les schémas de `packages/shared/src/schemas.ts` : une erreur de format ou un lien cassé bloque le chargement avec un message précis.

| Fichier | Contenu |
| --- | --- |
| `domaines.json` | Les 9 domaines, leur couleur, leurs sous-thèmes |
| `contenus/*.json` | Tableaux de fiches, questions et outils (un fichier par domaine ou groupe) |
| `alertes-demo.json` | Alertes d'exemple, datées en minutes avant le chargement |

## Types

- **fiche** : `definition`, `schema` (texte affiché en police mono, optionnel), `casUsage`, `piege`, `pointsCles`.
- **question** : `reference` (étapes `{titre, detail}`), `pointsCles` (voir ci-dessous), `piege`, `relances`.
- **outil** : `categorie`, `role`, `exemple`, `alternatives`.

Champs communs : `id` (slug unique), `domaine`, `sousTheme`, `titre`, `resume`, `difficulte` (`fondamental`, `intermediaire`, `avance`), `liens` (`{cible, nature}` avec `nature` parmi `vecteur-attaque`, `prerequis`, `voir-aussi`, `outil`).

## Points clés d'une question

Chaque point attendu liste des `motsCles` ; il est validé si l'un d'eux apparaît dans la réponse.

- comparaison sans accents ni casse ; « certificat » valide « certificats » (début de mot) ;
- un mot-clé de 3 lettres ou moins doit être un mot entier (« mac » ne valide pas « machine ») ;
- `"secondaire": true` : point bonus, compte pour moitié.

Le test `apps/api/test/contenu.test.ts` vérifie que **la réponse de référence de chaque question valide tous ses points clés** : si vous ajoutez un point, assurez-vous que la référence en parle avec un des mots-clés.
