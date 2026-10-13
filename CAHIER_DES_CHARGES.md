# Cahier des charges – IT-YRATECH : base de connaissances cyber/réseau interactive

Oct 13, 2026

IT-YRATECH est une base de connaissances interactive et evolutive couvrant l'ensemble des domaines de la cybersecurite et de l'infrastructure IT : reseau, SOC, GRC, pentest, IA et cyber, metiers (DPO/RSSI/PSSI), ingenierie sociale, administration systeme, architecture web, cryptographie. L'objectif n'est pas un simple recueil de fiches statiques mais un outil de veille perpetuelle : une application interactive qui genere et met a jour elle-meme son contenu via un serveur MCP connecte a une IA, se synchronise regulierement, et presente chaque theme sous une forme travaillee (pages web dediees, questions d'entretien, fiches outils, cas pratiques). Le code et le contenu vivent dans le depot GitHub IT-YRATECH ; l'hebergement suit la meme logique que les autres projets de l'ecosysteme (VPS OVH + nom de domaine). Design attendu : identite visuelle premium et distinctive, pas un wiki generique.

## 1. Reseaux et protocoles

**Fondamentaux a couvrir** :

- Modele OSI vs TCP/IP (les 7 couches, a quoi sert chacune, exemples de protocoles par couche).
- TCP vs UDP (handshake 3-way, fenetre glissante, numeros de sequence/ack, quand utiliser l'un ou l'autre).
- Adressage IP, subnetting, VLSM, NAT/PAT, IPv6 (differences cles avec IPv4).
- Routage (statique, OSPF, BGP a un niveau conceptuel), commutation (VLAN, STP, trunking 802.1Q).
- Protocoles applicatifs : DNS (recursif/iteratif, types d'enregistrements, DNS spoofing), DHCP (processus DORA), HTTP/HTTPS, SSH, SMTP/IMAP/POP3, FTP/SFTP.
- Securite reseau : ACL, firewall (stateful vs stateless), VPN (IPsec vs SSL/TLS), segmentation reseau, zero trust.

**Questions d'entretien types a inclure, avec reponse structuree** :

- "Que se passe-t-il quand je tape une URL dans mon navigateur ?" (DNS, TCP handshake, TLS, HTTP, rendu).
- "Explique la difference entre TCP et UDP, donne un exemple d'usage de chacun."
- "Comment fonctionne le three-way handshake TCP ?"
- "Qu'est-ce qu'une adresse IP privee vs publique, et comment fonctionne le NAT ?"
- "Differencie un switch, un routeur et un firewall."
- "Qu'est-ce qu'un VLAN et pourquoi segmenter un reseau ?"
- "Explique le fonctionnement d'une requete DNS de bout en bout."
- "Qu'est-ce que qu'une attaque de type ARP spoofing / Man-in-the-Middle, et comment s'en proteger ?"

Chaque fiche reseau doit contenir : definition claire, schema conceptuel, cas d'usage reel, piege/erreur frequente en entretien, et un lien vers les sections SOC/Pentest quand le protocole est aussi un vecteur d'attaque (ex. DNS -> DNS spoofing -> section Pentest).

## 2. SOC - detection, outils, risques

**Organisation d'un SOC** :

- Niveaux N1 (triage d'alertes), N2 (investigation approfondie), N3 (threat hunting / reponse a incident), CERT/CSIRT.
- Cycle de vie d'une alerte : collecte -> correlation -> triage -> qualification -> escalade -> remediation.
- Indicateurs cles : MTTD (mean time to detect), MTTR (mean time to respond), taux de faux positifs.

**Outils a documenter** :

- SIEM (Splunk, QRadar, Microsoft Sentinel, Wazuh en open source) : role (collecte de logs, correlation, alerting), fonctionnement d'une regle de correlation.
- EDR/XDR (CrowdStrike, SentinelOne, Microsoft Defender) : difference avec un antivirus classique, detection comportementale, isolation d'un poste compromis.
- Outils de threat intelligence (MISP, feeds CTI, MITRE ATT&CK comme referentiel de tactiques/techniques).
- SOAR : automatisation de la reponse a incident.

**Regles de detection** : structure d'une regle (condition, seuil, fenetre temporelle, action), exemples de regles classiques (connexion a horaire inhabituel, bruteforce, exfiltration de donnees via volume anormal, execution de PowerShell encode), notion de faux positif/faux negatif, tuning des regles.

**Risques et menaces a couvrir** : APT (Advanced Persistent Threat), mouvement lateral, escalade de privileges, persistence, exfiltration.

**Questions d'entretien types** : "Que ferais-tu en recevant une alerte de connexion suspecte a 3h du matin ?", "Differencie un IDS et un IPS", "Comment prioriser des alertes quand il y en a des centaines ?", "Explique le framework MITRE ATT&CK et son utilite".

## 3. GRC - cadre legal, normes, methodologies

**Reglementations et lois** :

- RGPD (principes cles : minimisation, finalite, duree de conservation, droits des personnes, base legale du traitement, notification de violation sous 72h a la CNIL).
- NIS2 (perimetre des entites essentielles/importantes, obligations de securite, obligations de notification d'incident, sanctions).
- DORA (resilience operationnelle numerique, secteur financier) a mentionner comme reglementation connexe.
- LPM (Loi de Programmation Militaire) et OIV/OSE en France.

**Normes et referentiels** :

- ISO 27001 (SMSI - systeme de management de la securite de l'information, cycle PDCA, certification) et ISO 27002 (catalogue de mesures).
- EBIOS RM (methode ANSSI de gestion des risques) : les 5 ateliers (cadrage et socle de securite, sources de risque, scenarios strategiques, scenarios operationnels, traitement du risque) - detailler le contenu et le livrable de chaque atelier.
- PASSI, PDIS (qualifications ANSSI), et le role de l'ANSSI en France.

**Gouvernance** : politique de securite (PSSI), analyse de risques, plan de traitement des risques, audits internes/externes, indicateurs de conformite, sensibilisation des utilisateurs.

**Questions d'entretien types** : "Explique les etapes d'EBIOS RM", "Quelle est la difference entre une PSSI et une politique de confidentialite ?", "Que doit faire une entreprise en cas de violation de donnees personnelles selon le RGPD ?", "Quels sont les apports de NIS2 par rapport a NIS1 ?".

## 4. Pentest, Red Team et ingenierie sociale

**Methodologie de pentest** : reconnaissance (OSINT), scan/enumeration, exploitation, post-exploitation (mouvement lateral, escalade de privileges, persistence), rapport (classification des vulnerabilites, score CVSS, recommandations de remediation). Reference aux standards PTES et OWASP Testing Guide.

**Outils a documenter par phase** :

- Recon/OSINT : theHarvester, Shodan, Maltego, recherche de fuites (Have I Been Pwned).
- Scan/enum : Nmap, Nessus/OpenVAS, Nikto.
- Exploitation : Metasploit, Burp Suite (web), SQLmap, Hydra (bruteforce).
- Post-exploitation : Mimikatz, BloodHound (Active Directory), Cobalt Strike (Red Team).
- Reverse engineering : Ghidra, IDA, x64dbg - analyser un binaire/malware, identifier son comportement sans l'executer en environnement non isole.

**Ingenierie sociale** : principes psychologiques exploites (autorite, urgence, confiance, reciprocite), types d'attaques (phishing de masse, spear phishing cible, whaling, vishing, smishing, pretexting, baiting), anatomie d'un email de phishing (domaine usurpe, lien trompeur, piece jointe piegee, urgence artificielle), comment detecter et reagir.

**Red Team vs pentest classique** : objectifs (simuler une attaque realiste de bout en bout vs auditer un perimetre defini), duree, niveau de furtivite recherche.

**Questions d'entretien types** : "Decris les etapes d'un pentest", "Quelle est la difference entre un pentest et un audit de vulnerabilites ?", "Comment reconnaitre un email de phishing ?", "Qu'est-ce que le mouvement lateral dans un reseau Active Directory ?", "Explique la difference entre pentest, bug bounty et Red Team".

## 5. Cybersecurite et IA

**Risques poses par l'IA generative** :

- Fuite de donnees via prompt (coller des donnees sensibles/clients dans un chatbot public, les donnees pouvant servir a l'entrainement ou etre exposees).
- Prompt injection (instructions malveillantes cachees dans un contenu que l'IA traite) et jailbreak.
- Hallucinations utilisees pour du code ou des configs de securite (une IA peut generer une regle firewall ou un script faux avec assurance).
- Deepfakes et contenus synthetiques utilises en ingenierie sociale (vishing avec voix clonee, faux visio).
- Empoisonnement de donnees d'entrainement (data poisoning) et vol de modele pour les IA utilisees en entreprise.
- Shadow AI : usage non controle d'outils IA par les employes, hors politique de securite.

**IA locale (self-hosted)** : interet (confidentialite des donnees, pas d'exposition a un tiers, conformite RGPD/NIS2 plus simple a demontrer), comment la mettre en place (ex. Ollama ou LM Studio pour faire tourner un modele open-weight sur un serveur/poste local ou le homelab), compromis (puissance de calcul necessaire, modeles plus petits que les IA cloud, maintenance).

**Tirer profit de l'IA pour monter en competence sans perdre l'intelligence humaine** : utiliser l'IA pour accelerer la comprehension (expliquer un concept, generer des scenarios d'entrainement, resumer une veille), mais toujours verifier/valider par la pratique reelle (labs, CTF, homelab) et la comprehension des fondamentaux - l'IA est un accelerateur de montee en competence, jamais un substitut au raisonnement et a la verification humaine, en particulier sur des sujets de securite ou une erreur a un cout reel.

**Questions d'entretien types** : "Quels sont les risques de l'IA generative pour une entreprise ?", "Qu'est-ce qu'une prompt injection ?", "Pourquoi certaines entreprises deploient de l'IA locale plutot que des APIs cloud ?".

## 6. Metiers et roles cyber

| Role | Mission principale | Attendu / competences cles |
| --- | --- | --- |
| DPO (Delegue a la Protection des Donnees) | Garantir la conformite RGPD de l'organisation | Droit du numerique, cartographie des traitements, gestion des violations de donnees, interface avec la CNIL - profil souvent plus juridique que technique |
| RSSI (Responsable de la Securite des Systemes d'Information) | Piloter la strategie de securite globale | Vision transverse (technique + organisationnel + budget), gestion de risques, pilotage d'audits, reporting a la direction |
| Redacteur/pilote PSSI | Definir et faire vivre la politique de securite | Ecriture normative, connaissance ISO 27001/EBIOS RM, capacite a faire appliquer la politique aupres des equipes |
| SOC Analyst N1/N2 | Detecter et qualifier les incidents | SIEM, triage d'alertes, bases reseau/systeme, capacite a rediger un rapport d'incident clair |
| Pentester / Auditeur technique | Trouver et demontrer des vulnerabilites exploitables | Methodologie, outils offensifs, redaction de rapport (comme deja documente par Yacine), veille CVE |
| Administrateur systeme/reseau securite | Maintenir et durcir l'infrastructure | Hardening, haute disponibilite, sauvegardes, PCA/PRA, bonnes pratiques reseau |

**Ce qu'un debutant doit maitriser avant de se presenter sur ces postes** :

- Les bases reseau (section 1) et systeme (Linux/Windows, ligne de commande, permissions, logs).
- Comprendre un minimum de droit/conformite (RGPD) meme pour un poste technique.
- Savoir lire et rediger un rapport clair (vulnerabilite, incident, risque) - competence transverse a tous ces postes.
- Avoir pratique sur des labs (CTF, environnement de test) plutot que seulement de la theorie.
- Comprendre qu'aucun poste cyber n'est purement technique : tous impliquent de la communication (vers la direction, les utilisateurs, ou les clients).

## 7. Administration systeme et continuite d'activite

**Maitrise des systemes** : administration Linux (permissions, services systemd, logs, durcissement/hardening) et Windows (Active Directory, GPO, strategies de mots de passe), gestion des correctifs (patch management), gestion des acces (principe du moindre privilege).

**PCA/PRA (Plan de Continuite / Reprise d'Activite)** :

- PCA : maintenir l'activite pendant un incident (bascule vers un site de secours, procedures degradees).
- PRA : reconstruire le systeme apres un sinistre (restauration depuis sauvegarde, delai de reprise).
- Indicateurs cles : RTO (Recovery Time Objective - delai max acceptable d'interruption) et RPO (Recovery Point Objective - perte de donnees maximale acceptable).
- Tests reguliers du PRA (exercice de restauration) - un PRA jamais teste n'est pas fiable.

**Haute disponibilite et redondance** :

- Cluster actif/actif vs actif/passif, load balancing, basculement automatique (failover).
- Redondance au niveau reseau (liens multiples, protocoles comme VRRP/HSRP), stockage (RAID, replication), alimentation electrique (onduleurs).
- SLA et notion de disponibilite (99.9%, 99.99% - traduire en temps d'indisponibilite tolere par an).

**Reponse a incident** : plan de reponse a incident (detection, confinement, eradication, remediation, retour d'experience), CERT/CSIRT, notification reglementaire (NIS2/RGPD selon le cas).

**Questions d'entretien types** : "Quelle est la difference entre un PCA et un PRA ?", "Explique RTO et RPO avec un exemple", "Comment assurer la haute disponibilite d'un service critique ?".

## 8. Architecture web, API, PKI et cloud

**Proxy et reverse proxy** : un proxy sortant protege/filtre les requetes des utilisateurs vers l'exterieur ; un reverse proxy (Nginx, Traefik, HAProxy) se place devant des serveurs pour repartir la charge, terminer le TLS, masquer l'infrastructure reelle, et appliquer des regles de securite (WAF). Different d'un load balancer bien qu'ils se recoupent souvent.

**API et leurs risques** : REST vs GraphQL vs gRPC (a un niveau conceptuel), authentification API (cles API, OAuth2, JWT), risques specifiques (OWASP API Security Top 10 : broken object level authorization, exposition excessive de donnees, absence de rate limiting, mauvaise gestion des cles). Une fuite de cle API expose directement les donnees ou systemes qu'elle protege - gestion du cycle de vie des secrets (rotation, stockage dans un coffre-fort type Vault, jamais en clair dans le code).

**PKI et certificats** : Root CA (autorite racine, cle la plus sensible, generalement hors ligne), CA intermediaire (signe les certificats au quotidien, permet de revoquer sans toucher a la racine), chaine de confiance, certificats X.509, TLS/SSL (handshake, role du certificat serveur), revocation (CRL, OCSP).

**Cloud et identite** : Azure AD / Microsoft Entra ID (gestion des identites, SSO, MFA, Conditional Access), modele de responsabilite partagee dans le cloud (IaaS/PaaS/SaaS - qui securise quoi), risques specifiques au cloud (mauvaise configuration de stockage public, sur-privileges IAM).

**Questions d'entretien types** : "Quelle est la difference entre un proxy et un reverse proxy ?", "Explique le role d'une autorite de certification intermediaire", "Quels sont les risques lies a une fuite de cle API ?", "Qu'est-ce que le modele de responsabilite partagee dans le cloud ?".

## 9. Securite by design, cryptographie, reverse engineering, ransomware

**Security by design** : integrer la securite des la conception (pas en couche ajoutee apres coup), principes cles (moindre privilege, defense en profondeur, fail securely, surface d'attaque minimale), et son pendant reglementaire (privacy by design, exige par le RGPD).

**Cryptographie** : chiffrement symetrique (AES) vs asymetrique (RSA, ECC), fonctions de hachage (SHA-256, usage pour l'integrite et le stockage de mots de passe avec sel), signature numerique, difference chiffrement/hachage/encodage (erreur frequente en entretien), notions de longueur de cle et d'obsolescence (MD5/SHA-1 casses, a ne plus utiliser).

**Reverse engineering** : objectif (comprendre le fonctionnement d'un binaire sans son code source), usages legitimes (analyse de malware, audit de securite, interoperabilite), outils (Ghidra, IDA, x64dbg, strings/file pour une analyse statique basique), distinction analyse statique (sans executer) vs dynamique (en sandbox isolee).

**Ransomware** : cycle d'attaque typique (acces initial souvent via phishing ou RDP expose, propagation laterale, exfiltration de donnees avant chiffrement - double extorsion, chiffrement des systemes, demande de rancon), mesures de prevention (sauvegardes hors ligne/immuables, segmentation, EDR, filtrage des emails), que faire en cas d'attaque (isoler, ne pas payer par defaut, notifier les autorites/ANSSI, restaurer depuis sauvegarde saine).

**Questions d'entretien types** : "Quelle est la difference entre chiffrement et hachage ?", "Comment une entreprise doit-elle reagir face a une attaque ransomware ?", "Qu'est-ce que la double extorsion ?", "Donne un exemple concret de security by design".

## 10. Veille perpetuelle

**Rester conscient des sujets cyber sans etre a chaque fois tres technique** :

- Suivre regulierement un petit nombre de sources fiables plutot que de tout suivre superficiellement (ex. CERT-FR/ANSSI pour les alertes officielles en France, quelques flux CTI generalistes, actualite des grandes failles/incidents).
- Comprendre l'impact business d'un sujet avant d'en comprendre tous les details techniques (ex. "pourquoi NIS2 me concerne" avant "comment NIS2 est applique techniquement").
- Capacite a reformuler un sujet complexe en langage clair - competence utile pour tous les postes de la section 6, pas seulement les plus techniques.

**Methode de montee en competence assistee par IA, sans perdre l'intelligence humaine** :

- Utiliser l'IA pour degrossir un sujet (resume, vulgarisation, generation de questions d'entrainement) puis toujours confronter a une pratique reelle (lab, CTF, documentation officielle) avant de considerer le sujet acquis.
- Ne jamais memoriser une reponse generee par IA sans en comprendre le raisonnement - en entretien ou en situation reelle, l'explication est toujours demandee, pas seulement la conclusion.
- Utiliser l'IA comme partenaire de veille (resumer les nouveautes d'une semaine, expliquer une CVE recente) mais garder un esprit critique sur les sorties generees, en particulier sur des sujets sensibles ou une erreur technique peut avoir des consequences reelles (configuration de securite, conseil juridique).

**Rythme propose** : un format court et regulier (quelques minutes par jour ou une session hebdomadaire) vaut mieux qu'une veille intensive mais irreguliere - coherent avec le fonctionnement "veille" deja en place chez Yacine (workflow Notion existant).

## 11. Architecture technique de l'application

**Principe** : chaque theme des sections 1 a 9 est une entite de contenu structuree (domaine, sous-theme, type de fiche), pas une page HTML ecrite a la main - le meme modele de donnees generique que pour le simulateur CCNA (voir le depot ccna-exam), applique ici a la veille cyber plutot qu'a l'examen.

**Types de contenu a modeliser** :

- Fiche de connaissance (definition, schema, cas d'usage, piege frequent).
- Question d'entretien (enonce, reponse structuree attendue, niveau de difficulte, domaine).
- Fiche outil (nom, categorie, role, exemple d'usage, alternatives).
- Alerte de veille (source, date, resume, niveau de criticite, lien vers la fiche de connaissance concernee).

**Serveur MCP de generation et synchronisation** (meme logique que exam-forge-mcp) :

- `generate_fiche(domaine, sous_theme, type_contenu)` - genere une fiche complete, validee techniquement avant publication.
- `generate_question_entretien(domaine, niveau)` - genere une question d'entretien avec sa reponse de reference.
- `sync_veille(sources)` - recupere les dernieres alertes/CVE/actualites pertinentes et les relie aux fiches existantes.
- `validate_content(content_id)` - double controle qualite automatise avant publication, comme pour le simulateur CCNA.
- Fonctionnement 100% automatise : aucune etape de relecture manuelle necessaire dans le flux normal.

**Interface interactive** :

- Navigation par domaine (reseau, SOC, GRC, pentest, IA, metiers, etc.) avec recherche transverse.
- Mode "entrainement entretien" : questions tirees aleatoirement, feedback immediat, suivi de progression (meme moteur de suivi que le simulateur CCNA - reutilisation possible du meme composant de dashboard).
- Mode "veille du jour" : page d'accueil qui met en avant les dernieres alertes/actualites synchronisees.
- Liens croises entre domaines (ex. une fiche DNS en section reseau renvoie vers la fiche DNS spoofing en section pentest).

**Stack** : meme logique que le projet simulateur CCNA (frontend React/Vue + TypeScript, backend Node/FastAPI, PostgreSQL, serveur MCP dedie) - cohesion technique entre les deux projets, possibilite de reutiliser des composants (moteur de quiz, dashboard de suivi).

## 12. Design et identite visuelle

- **Direction** : esthetique "centre d'operations de securite" (SOC war room / cockpit de veille) - sombre, dense, orientee donnee en temps reel, a l'oppose d'un wiki generique ou d'un blog classique.
- **Palette** : base sombre (bleu nuit / gris anthracite), accents par domaine pour une orientation visuelle immediate (ex. cyan pour reseau, vert pour GRC/conformite, rouge/orange pour pentest et alertes de veille, violet pour IA) - coherence avec l'identite deja definie pour le simulateur CCNA pour que les deux projets se ressemblent visuellement.
- **Hierarchie** : la page "veille du jour" doit frapper en premier (alertes recentes, criticite visible d'un coup d'oeil), puis la navigation par domaine, puis le mode entrainement.
- **Composants reutilisables** : cartes de fiches de connaissance, badges de criticite/difficulte, timeline de veille, barre de progression par domaine (meme logique que le dashboard du simulateur CCNA).
- **Coherence multi-projets** : poser un systeme de design partage (tokens de couleur, typographie) entre IT-YRATECH et le simulateur CCNA, pour une identite visuelle unifiee sur l'ensemble de l'ecosysteme Yacine.

## 13. Hebergement et deploiement

- **Code source** : depot GitHub `IT-YRATECH` (owner YacineRH) - meme logique de versioning/CI que le depot `ccna-exam`.
- **Execution et persistance** : comme pour le simulateur CCNA, GitHub seul ne peut pas heberger de backend ni sauvegarder la progression/les donnees de veille synchronisees - prevoir backend + base de donnees reelle sur le VPS OVH existant (vps-hydre), avec le nom de domaine OVH pointe dessus (sous-domaine dedie type `veille.tondomaine.fr` pour distinguer du simulateur CCNA si les deux cohabitent sur le meme VPS).
- **CI/CD** : GitHub Actions - tests + build a chaque push, deploiement automatique sur le VPS apres validation.
- **Synchronisation de veille** : la tache de synchronisation (recuperation des nouvelles alertes/CVE) doit tourner en tache planifiee cote serveur (cron ou scheduler applicatif), independamment des visites utilisateur, pour que la page "veille du jour" soit toujours a jour.

## 14. Roadmap par phases

1. **Phase 0 - Socle** : schema de donnees generique (domaine, sous-theme, type de contenu, fiche, question, outil, alerte de veille), API minimale, deploiement initial GitHub -> VPS OVH fonctionnel.
2. **Phase 1 - Contenu de base** : remplir a la main un premier jeu de fiches sur 2-3 domaines (ex. reseau + SOC) pour valider le modele avant toute generation automatisee.
3. **Phase 2 - Interface de navigation et d'entrainement** : navigation par domaine, recherche, mode questions d'entretien avec feedback.
4. **Phase 3 - Serveur MCP de generation** : implementation des outils decrits en section 11, generation automatisee du reste du contenu (tous les domaines de la section 1 a 9), pipeline de validation qualite.
5. **Phase 4 - Veille automatisee** : synchronisation reguliere des alertes/CVE, page "veille du jour", liaison automatique aux fiches existantes.
6. **Phase 5 - Design final et coherence multi-projets** : identite visuelle definitive, systeme de design partage avec le simulateur CCNA, responsive mobile.
7. **Phase 6 - Extension** : ajout de nouveaux domaines ou de nouveaux formats de contenu (ex. cas pratiques guides, mini-CTF) sans refonte du moteur.

## 15. Prompt de contexte pour Claude Code

A copier-coller tel quel comme premier message dans Claude Code, dans le depot `IT-YRATECH` :

```markdown
Contexte du projet : je construis IT-YRATECH, une base de connaissances interactive et evolutive en cybersecurite/IT - reseau, SOC, GRC, pentest, IA et cyber, metiers (DPO/RSSI/PSSI), ingenierie sociale, administration systeme, architecture web, cryptographie. Objectif : une veille perpetuelle, pas un wiki statique. Le cahier des charges complet est dans ce depot (sections 1 a 14) : [coller le lien de ce doc, ou son contenu].

Points non negociables :
- Le contenu est modelise de maniere generique (domaine, sous-theme, type de contenu), pas code en dur par sujet - memes principes que mon autre projet simulateur CCNA (depot ccna-exam), que tu peux consulter pour la coherence d'architecture et de design si besoin.
- Backend + base de donnees reelle (pas seulement du statique) pour persister contenu et progression.
- Un serveur MCP expose les outils de generation et de synchronisation de veille decrits en section 11, utilisable par une IA de maniere autonome avec validation automatique avant publication.
- Design sur-mesure (esthetique SOC/cockpit de veille, pas un wiki generique), identite visuelle decrite en section 12, coherente avec le simulateur CCNA.
- Code sur GitHub (ce depot), deploiement vise sur le meme VPS OVH que les autres projets + nom de domaine personnel (voir section 13).

Ce que j'attends de toi pour demarrer :
1. Proposer un schema de base de donnees generique couvrant tous les types de contenu de la section 11.
2. Proposer la structure du depot et la stack technique (en coherence avec le projet ccna-exam si pertinent).
3. Mettre en place le squelette du projet avec CI/CD GitHub Actions.
4. Avancer phase par phase selon la roadmap en section 14, avec des points de validation avant de continuer.

Pose-moi les questions necessaires avant de generer du code si des choix structurants manquent.
```
