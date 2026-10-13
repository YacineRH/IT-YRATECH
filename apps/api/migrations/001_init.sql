-- Schema generique d'IT-YRATECH (cahier des charges, section 11).
-- Domaine -> sous-theme -> contenu type (fiche, question, outil),
-- alertes de veille reliees aux contenus, suivi des tentatives.

-- Recherche transverse insensible aux accents.
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE domaine (
  id          serial PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  nom         text NOT NULL,
  nom_court   text NOT NULL,
  description text NOT NULL,
  couleur     text NOT NULL CHECK (couleur ~ '^#[0-9A-Fa-f]{6}$'),
  ordre       integer NOT NULL DEFAULT 0
);

CREATE TABLE sous_theme (
  id         serial PRIMARY KEY,
  domaine_id integer NOT NULL REFERENCES domaine (id) ON DELETE CASCADE,
  slug       text NOT NULL,
  nom        text NOT NULL,
  ordre      integer NOT NULL DEFAULT 0,
  UNIQUE (domaine_id, slug)
);

CREATE TABLE contenu (
  id            text PRIMARY KEY,
  type          text NOT NULL CHECK (type IN ('fiche', 'question', 'outil')),
  domaine_id    integer NOT NULL REFERENCES domaine (id),
  sous_theme_id integer NOT NULL REFERENCES sous_theme (id),
  titre         text NOT NULL,
  resume        text NOT NULL,
  difficulte    text NOT NULL CHECK (difficulte IN ('fondamental', 'intermediaire', 'avance')),
  -- Champs propres au type, valides par les schemas zod de @yratech/shared.
  corps         jsonb NOT NULL,
  statut        text NOT NULL DEFAULT 'publie' CHECK (statut IN ('brouillon', 'valide', 'publie')),
  origine       text NOT NULL DEFAULT 'manuel' CHECK (origine IN ('manuel', 'mcp')),
  version       integer NOT NULL DEFAULT 1,
  cree_le       timestamptz NOT NULL DEFAULT now(),
  maj_le        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contenu_domaine_idx ON contenu (domaine_id, type);

-- Liens croises entre contenus (ex. DNS -> DNS spoofing).
CREATE TABLE lien_contenu (
  source_id text NOT NULL REFERENCES contenu (id) ON DELETE CASCADE,
  cible_id  text NOT NULL REFERENCES contenu (id) ON DELETE CASCADE,
  nature    text NOT NULL CHECK (nature IN ('voir-aussi', 'vecteur-attaque', 'prerequis', 'outil')),
  PRIMARY KEY (source_id, cible_id)
);

CREATE TABLE alerte (
  id                  text PRIMARY KEY,
  source              text NOT NULL,
  url                 text,
  publie_le           timestamptz NOT NULL,
  titre               text NOT NULL,
  resume              text NOT NULL,
  criticite           text NOT NULL CHECK (criticite IN ('critique', 'elevee', 'moyenne', 'faible')),
  reference           text,
  pourquoi            text,
  reflexe             text,
  exploitation_active boolean NOT NULL DEFAULT false,
  demo                boolean NOT NULL DEFAULT false,
  cree_le             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX alerte_publie_idx ON alerte (publie_le DESC);

CREATE TABLE alerte_domaine (
  alerte_id  text NOT NULL REFERENCES alerte (id) ON DELETE CASCADE,
  domaine_id integer NOT NULL REFERENCES domaine (id) ON DELETE CASCADE,
  PRIMARY KEY (alerte_id, domaine_id)
);

CREATE TABLE alerte_contenu (
  alerte_id  text NOT NULL REFERENCES alerte (id) ON DELETE CASCADE,
  contenu_id text NOT NULL REFERENCES contenu (id) ON DELETE CASCADE,
  PRIMARY KEY (alerte_id, contenu_id)
);

-- Journal des synchronisations de veille (sync_veille, phase 4).
CREATE TABLE synchronisation (
  id        serial PRIMARY KEY,
  debut     timestamptz NOT NULL DEFAULT now(),
  fin       timestamptz,
  sources   text[] NOT NULL DEFAULT '{}',
  nb_alertes integer NOT NULL DEFAULT 0,
  statut    text NOT NULL DEFAULT 'en-cours' CHECK (statut IN ('en-cours', 'ok', 'erreur')),
  message   text
);

-- Controles qualite avant publication (validate_content, phase 3).
CREATE TABLE validation (
  id         serial PRIMARY KEY,
  contenu_id text NOT NULL REFERENCES contenu (id) ON DELETE CASCADE,
  ok         boolean NOT NULL,
  rapport    jsonb NOT NULL,
  cree_le    timestamptz NOT NULL DEFAULT now()
);

-- Mode entrainement : une ligne par reponse soumise.
CREATE TABLE tentative (
  id               serial PRIMARY KEY,
  question_id      text NOT NULL REFERENCES contenu (id) ON DELETE CASCADE,
  reponse          text NOT NULL,
  score            numeric(4, 1) NOT NULL,
  max              integer NOT NULL,
  ratio            numeric(5, 4) NOT NULL,
  verdict          text NOT NULL CHECK (verdict IN ('reussie', 'partielle', 'ratee')),
  points_couverts  jsonb NOT NULL,
  cree_le          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tentative_question_idx ON tentative (question_id, cree_le DESC);
