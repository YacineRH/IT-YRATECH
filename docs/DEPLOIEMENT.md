# Déploiement sur le VPS OVH

Cible (section 13) : le VPS existant, avec un sous-domaine dédié (ex. `veille.mondomaine.fr`), à côté du simulateur CCNA.

## Principe

`docker compose` lance trois conteneurs : PostgreSQL (volume persistant), l'API et nginx (frontend + relais `/api`). Le conteneur web n'écoute que sur `127.0.0.1:8080` : le reverse proxy déjà présent sur le VPS termine le TLS et relaie le sous-domaine vers ce port.

## Première installation

```bash
# sur le VPS
git clone https://github.com/YacineRH/IT-YRATECH.git ~/it-yratech
cd ~/it-yratech
cp .env.example .env
# éditer .env : POSTGRES_PASSWORD (long et aléatoire), WEB_PORT si 8080 est pris
docker compose up -d --build
curl http://127.0.0.1:8080/api/sante     # {"statut":"ok"}
```

Puis déclarer le sous-domaine dans la zone DNS OVH (enregistrement A vers l'IP du VPS) et ajouter un site au reverse proxy. Exemple nginx :

```nginx
server {
    server_name veille.mondomaine.fr;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    # certificat : certbot --nginx -d veille.mondomaine.fr
}
```

## Déploiement continu (GitHub Actions)

Le job `deployer` de `.github/workflows/ci.yml` se connecte en SSH au VPS après des tests et des builds d'images réussis sur `main`, puis exécute `git reset --hard origin/main && docker compose up -d --build`. Il est désactivé tant que ces réglages ne sont pas faits dans GitHub (Settings → Secrets and variables → Actions) :

| Type | Nom | Valeur |
| --- | --- | --- |
| Variable | `DEPLOY_ENABLED` | `true` |
| Variable | `URL_SANTE` | `https://veille.mondomaine.fr/api/sante` (optionnel) |
| Secret | `VPS_HOST` | IP ou nom du VPS |
| Secret | `VPS_USER` | utilisateur de déploiement (membre du groupe `docker`) |
| Secret | `VPS_SSH_KEY` | clé privée dédiée au déploiement |
| Secret | `VPS_KNOWN_HOSTS` | sortie de `ssh-keyscan <VPS_HOST>` |
| Secret | `VPS_PATH` | chemin du clone, ex. `/home/deploy/it-yratech` |

Créez aussi un environnement GitHub `production` (il peut exiger une validation manuelle).

## Sauvegarde de la base

```bash
docker compose exec -T db pg_dump -U yratech yratech | gzip > yratech-$(date +%F).sql.gz
```

À planifier en cron et à copier hors du VPS. Restauration testée = sauvegarde fiable (cf. fiche PRA).
