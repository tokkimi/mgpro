# MG Pro — dossier d’implémentation pour Codex

Date : 23 octobre 2026. Périmètre immédiat : Mes projets, Notifications, Bob/Assistant et routines, Factures, Dépenses, Demandes de prix. Bons de commande : lot suivant, à relever précisément sur l’écran déjà ouvert avant de certifier sa fidélité.

## 1. Instruction de mission

Enrichir le MG Pro existant pour retrouver l’organisation et les parcours observés dans Billdr. Conserver tous les outils MG Pro, particulièrement ceux qui sont plus performants ou absents de Billdr. Produire interfaces, logique, persistance, droits et tests ; une inspection seule n’est pas une livraison.

Le commanditaire accepte soit une fonction construite et vérifiée, soit une spécification suffisamment précise pour être implémentée par Codex. Ne jamais qualifier « construit » un bouton qui ne fait qu’annoncer une intégration manquante. Ne jamais qualifier l’ensemble « prêt à déployer » à partir du seul build.

### Sens des statuts

| Statut | Preuve exigée |
|---|---|
| Observé | Écran ou comportement lu dans Billdr ; détails dans les annexes |
| Construit localement | Code présent et commit identifié ; cela ne certifie pas la recette UI |
| Spécifié | Contrat ci-dessous suffisamment défini ; aucune prétention d’implémentation |
| À relever | Information visuelle/fonctionnelle manquante ; ne pas inventer une parité |
| Bloqué par connexion | Code ou activation dépendant d’un fournisseur/compte non accessible |
| Vérifié de bout en bout | Parcours exécuté, persistance rechargée, droits et effets externes contrôlés |

## 2. Point de départ technique et conservation

- Dépôt : `tokkimi/mgpro`, branche locale de ce travail `codex/billdr-handoff-2026-10-23`.
- Ne pas changer la branche distante par défaut ni écraser un autre travail. Relire AGENTS.md et git status avant intervention ; des modifications peuvent provenir d’un autre fil.
- Next.js 16.3.8, React 19, TypeScript ; conventions à vérifier dans `node_modules/next/dist/docs/`.
- Interface principale : `components/workspace.tsx`. Réutiliser ses contrôles de rôle, listes autorisées et fonctions de sauvegarde.
- Registres : `invoice-register.tsx`, `customer-payments.tsx`, `supplier-ledger.tsx`, `operations-centre.tsx`.
- Circuits projet : `vendor-finance.tsx`, `project-operations.tsx`, `project-plan.tsx` ; moteurs `lib/project-operations.ts`, `lib/vendor-finance.ts`.
- Calculs documents : `lib/model.ts`, `lib/pricing.ts`, `lib/client-pricing.ts`. Ne pas recopier une autre formule de marge/taxe/arrondi dans les composants.
- Assistant : `components/assistant-centre.tsx`, `lib/routines.ts`, `/api/assistant`, `/api/cron/daily`.
- Documents/clients : conserver liens sécurisés, notes internes, modèles de courriel, signatures, pièces, outbox de médias et corbeille.
- Préserver : tableau de bord et comptabilité, santé des projets, décisions clients, visites et relevés, voix et carnet, plans 2D/3D, catalogue et chiffrage, comparaison des réponses fournisseur, réceptions partielles, rapprochement, temps et clôture, portail client et paramètres de marque.
- Ne migrer aucune donnée Billdr avant installation et validation du logiciel. Ne supprimer aucun document source.

## 3. État réellement construit dans ce fil

| Domaine | Code local livré | Limite encore ouverte |
|---|---|---|
| Navigation | Rubriques exposées dans l’ordre Billdr puis outils propres | Recette responsive et fidélité visuelle complète |
| Notifications | Vues/filtrage ; commit de filtre/historique à relire avant nouvelle modification | Exhaustivité historique, auteur réel et canaux externes |
| Assistant/routines | Recherche, tags simples, activation/favoris, catalogue MG Pro, historique filtrable, minuit, échec de sauvegarde conservant la saisie | Instructions riches, fréquences et précision horaire, notifications, rapports Billdr complets |
| Factures | Registre, filtres, périodes, agrégats, HT/taxes/TTC/solde, export, pagination | Éditeur/aperçu identiques, crédits/reçus et recette complète |
| Paiements clients | Lecture des journaux `operation=payment` liés à une facture ; filtres, export et ouverture des sources | Méthodes/frais non stockés, allocations multiples, reçus, modifications/annulations |
| Dépenses | Grand livre, détails, filtres pièces, colonnes ; Nouveau et formulaires fournisseur depuis projet ; périodes et filtres provisoires | Ventilation multicode, taxes détaillées, réception email, fidélité formulaire/visuelle |
| Demandes de prix | Tableau, fournisseur/échéance, colonnes en session, sélection/export, pagination, tâches de soumission | Envoi réel, suivi d’ouverture, portail fournisseur, catégories hiérarchiques, suite de l’assistant |

Commits utiles : `49bf192`, `0e2d8ef`, `4acc437`, `d07a6d8`, `4452484`, `b3a5d26`, `4f3e6e8`, `af7ac25`. Ne pas supposer qu’ils sont poussés sur GitHub : ils sont locaux. Dernier build observé réussi, 93 tests exécutés avec succès. Ce nombre concerne la suite à cet instant, pas 93 parcours UI et pas une certification de tous les modules.

## 4. Contrats communs à toutes les rubriques

### 4.1 Interface

- Prévoir chargement, vide initial, aucun résultat filtré, erreur de lecture, erreur de validation, sauvegarde en cours, conflit de version et réussite.
- Recherche et filtres combinables ; réinitialisation complète ; distinction claire entre filtrage provisoire d’une fenêtre et filtres appliqués.
- Pagination stable après suppression, réduction des résultats ou changement de famille ; aucun affichage « 1 à 20 sur 0 ».
- Exports sur l’ensemble filtré ou la sélection explicitement annoncée, jamais uniquement la page par accident.
- Colonnes : choix provisoire, annuler sans effet, réinitialiser, confirmer, préférence validée ; conserver au moins une colonne. Préférences par registre et versionnées si le schéma change.
- Boutons accessibles clavier, libellés de sélection, en-têtes de tableau, focus dans les fenêtres, retour du focus et fermeture Échap.
- Mobile : filtres repliables, défilement horizontal limité à la table, actions utilisables et pas de débordement de page.
- Une date absente reste absente. Une date de création ne remplace pas une date d’envoi ou d’ouverture.

### 4.2 Persistance et opérations

- Sauvegarde explicite. Si elle échoue, garder les valeurs du formulaire et afficher l’erreur ; ne pas fermer ni afficher un succès.
- Désactiver une action en cours et utiliser une clé d’idempotence pour les effets financiers et envois.
- Écritures concurrentes : vérifier la version réelle côté serveur ; conflit explicite, aucune fusion aveugle de tableaux `operations`.
- Mutation atomique par opération métier. Une mise à jour de projet ne doit pas réécrire silencieusement un paiement ajouté ailleurs.
- Toute action financière/réseau doit être autorisée côté serveur, pas uniquement par masquage du bouton.
- Historique : acteur, horodatage, entité, action, référence de lot/requête ; exclure secrets et contenu de notes privées des journaux publics.

### 4.3 Montants et dates

- Réutiliser les moteurs d’arrondi existants, conserver centimes, HT/TPS/TVQ/TTC et montant d’origine.
- Différencier marge sur prix de vente et majoration sur coût.
- Distinguer contrat/engagement, facture reconnue, crédit appliqué, paiement et rapprochement. Ne pas additionner un bon et sa facture comme deux charges.
- Fuseau métier Montréal pour les dates de l’entreprise ; stocker les instants en UTC et les dates civiles comme dates.
- Aucun statut « envoyé », « ouvert », « signé » ou « payé » inféré d’une simple consultation interne ou préparation mailto.

## 5. Mes projets — à finaliser

### Écrans et contrôles attendus

- Liste et cartes ; recherche ; statut ; tags ; assignés ; filtres additionnels et colonnes ; pagination ; archives.
- Colonnes observées : référence, adresse/client, tags, assignés, montant, statut et cinq dates métier. Les libellés exacts des cinq dates restent à relever avant implémentation de colonnes prétendument identiques.
- Fiche : Sommaire, Communications, Fichiers, Soumissions, Contrat, Sélections, Factures, Dépenses, POs, Budget, Échéancier, Tâches, Feuille de temps, Journal, Rapports.
- Conserver phases, visites, plans, santé et décisions MG Pro dans la fiche ou ses outils supplémentaires.

### Travaux Codex

1. Relire le composant de liste existant et relier chaque colonne à un champ réel.
2. Stabiliser les filtres liste/cartes ; afficher un seul compte de résultats pour le même périmètre.
3. Contrôler chaque sous-onglet avec un projet de test disposant de documents et un autre vide.
4. Vérifier que navigation depuis facture/dépense conserve le projet et la famille attendus.
5. Tester archive/restauration et absence de fuite des coûts internes dans le portail client.

### Acceptation

Changer de vue conserve les résultats ; archives n’entraînent aucune suppression ; accès refusé en appel direct pour un utilisateur non affecté ; données MG Pro préexistantes intactes.

## 6. Notifications — à finaliser

- Deux vues Notifications/Événements, recherche, projet, auteur, type, dates, non lues et lecture groupée.
- Événements : ouvrir ne marque pas un événement comme lu par défaut.
- Historique actuel limité : implémenter pagination serveur avec curseur stable et indicateur de chargement ; ne pas présenter les 300 dernières actions comme historique complet.
- Auteur : utiliser l’identité réelle de l’événement ; afficher « Auteur indisponible » pour les événements historiques sans acteur. Ne pas inventer l’auteur depuis le client du projet.
- Lecture individuelle/groupée enregistrée par utilisateur. Une action d’un administrateur ne doit pas effacer les non-lus d’un autre.
- Canaux : distinguer notification interne et email réellement délivré/échoué ; SMS absent reste non activable tant que non intégré.
- Recette : deux comptes, événement sur projet autorisé/non autorisé, pagination sans doublon, filtre de période Montréal, lecture persistante après reconnexion.

## 7. Bob / Assistant et routines — à finaliser

### Écran observé

Chat/Routines, gestion, recherche, tags multiples, filtre ON/OFF, favoris, catalogue et historique de rapports. Carte : titre, catégorie, programmation, dernière/prochaine exécution ; menu modifier/dupliquer/favori.

### Éditeur cible

| Champ | Règle |
|---|---|
| Titre | Obligatoire, borné, espace seul refusé |
| Instructions | Obligatoires pour routine IA ; texte riche limité et nettoyé |
| Tags | Plusieurs, dédupliqués, bornés |
| Automatiser | Désactivé initialement |
| Fréquence | Quotidienne/hebdomadaire/mensuelle/trimestrielle/annuelle |
| Jour/heure/fuseau | Champs conditionnels ; fuseau explicite |
| Notification | Courriel/SMS seulement si service réellement prêt |
| Destinataires | Comptes et droits vérifiés avant accès au contenu |

### Architecture proposée, non encore implémentée

Routine : id, propriétaire, type de rapport ou instructions, tags, favoris par utilisateur, enabled, schedule avec timezone, nextRunAt, version. Exécution : id, routineId, scheduledFor, startedAt, completedAt, status, snapshot des filtres, résultat, erreur et notifications.

- Index unique logique routineId/scheduledFor pour éviter le double déclenchement ; reprise d’un job interrompu.
- Un cron quotidien ne peut garantir 8 h à la minute : programmer les échéances avec un worker adapté ; journaliser retards et prochain passage réel.
- Respect du fuseau et des changements d’heure ; politique explicite pour dates mensuelles inexistantes (dernier jour du mois proposé, à afficher dans l’éditeur).
- Dupliquer crée une nouvelle routine inactive, sans ancien historique ni prochaine exécution héritée.
- Les rapports calculés MG Pro restent disponibles indépendamment des routines IA.
- Résultats IA fondés sur données autorisées et filtres figés ; aucune instruction d’un document ne peut élargir les droits.

### Rapports du catalogue à construire

- AR/AP/net : détails client/projet/fournisseur, HT/TTC, échéances, retard, périodes et priorités ; différencier engagements non facturés et dettes reconnues.
- Journal semaine passée : avancement, retards/météo, sécurité, récurrences, matériaux, équipe/heures et suites par projet.
- Tâches : retards et tâches du jour, responsable, ancienneté, priorité au-delà de sept jours.
- Pipeline projets : indicateurs par statut, variations hebdomadaires avec snapshots comparables, changements approuvés et risques.
- Pipeline ventes : six tendances mensuelles sur six mois, responsables, valeurs et stagnation à 30/21 jours.

Acceptation : lecture sans exécution, échec non présenté terminé, deux déclenchements concurrents produisent un seul rapport, destinataire sans droit exclu, export et consultation du snapshot ne changent pas après modification des dossiers.

## 8. Factures — à finaliser

### Liste

Deux onglets Factures/Paiements ; recherche ; période ; statuts ; projet ; export. Colonnes référence immuable, client/description, envoyée, ouverte, HT, taxes, TTC, solde, statut. L’ajout des dates de facturation et du projet MG Pro est conservé.

Le périmètre des agrégats doit être écrit près des cartes. Dans MG Pro le lot actuel calcule sur les lignes filtrées hors brouillons/annulations ; le comportement exact des cartes Billdr selon tous les filtres reste à confirmer.

### Création et édition

1. Choisir projet ; vérifier client et adresse.
2. Choisir source ou saisie manuelle ; sélectionner les lignes à facturer sans recopier les notes internes.
3. Référence interne immuable distincte de la référence personnelle ; date, échéance, description, groupes/lignes, quantité/unité/prix, taxes, notes, fichiers.
4. Aperçu client et vue interne distincts, mêmes montants et conditions.
5. Brouillon modifiable ; document émis protégé. Correction par avoir/version selon règles, jamais altération silencieuse d’un document déjà payé.
6. Émission et envoi sont deux résultats distincts ; l’échec email ne signifie pas facture envoyée.

### Fiche

- Document client, bloc entreprise/fiscalité et adresses ; résumé facturé/payé/solde.
- Paiements datés/méthodes/statuts ; appliquer crédit, recevoir paiement, résumé PDF, rappel, accès au projet.
- Le détail de taxes doit correspondre au PDF et au total enregistré.
- Ne pas remettre au brouillon une facture payée en contournant les écritures existantes.

### Paiements — contrat de construction

Le lot de lecture est construit ; la mutation avancée reste à produire.

| Donnée proposée | Règle |
|---|---|
| id / clé idempotence | Unique et immuable |
| client / devise | Factures du même client et devise uniquement |
| montant reçu | Strictement positif et décimal exact |
| allocations | invoiceId + amount ; somme égale au montant alloué, plafonnée au solde |
| référence | Libre, distincte de l’identifiant interne |
| date | Date civile du paiement |
| méthode | Carte, comptant, chèque, Interac, virement, transfert, crédit, autre |
| frais | Valeur explicite ou inconnue ; ne pas transformer inconnu en zéro |
| note | Interne sauf partage explicite |
| reçu email | Case explicite, résultat d’envoi séparé |

- Transaction atomique pour paiement + allocations + écritures + soldes + historique.
- Crédit appliqué réduit le solde mais n’est pas un encaissement bancaire.
- Annulation d’un paiement : contrepassation et audit ; ne pas effacer la preuve.
- Remboursement : événement distinct du crédit commercial, avec validation et suivi.
- Concurrence : deux paiements sur le même dernier solde ne peuvent surpayer.
- PDF du résumé : facture, total, versements, crédits, solde, dates, références ; même moteur que l’écran.

### Critères de recette

Facture partielle, plusieurs versements, deux factures allouées, crédit sans encaissement, annulation impossible si règle non satisfaite, doublon de requête, erreur de mail, PDF multi-page, client non autorisé, facture consultée par client mais pas par prévisualisation interne.

## 9. Dépenses — à finaliser

### Barre et liste construites

Tout/Dépenses/Factures fournisseur/Crédits fournisseur + nos familles Paiements/Bons ; recherche ; périodes ; statut ; Plus de filtres provisoire ; Nouveau ; colonnes et export. L’interface du transfert email est informative, la réception n’est pas livrée.

### Dépense cible

Pièce jointe, HT obligatoire, code fiscal si connecté, taxes séparées et corrigibles, total ; fournisseur/projet obligatoires ; date ; référence ; méthode/compte paiement ; description ; ventilation code/montant ; annuler/sauver/supprimer selon statut et droits.

### Facture fournisseur cible

PDF joint, bon associé facultatif, montant/taxes, fournisseur, état brouillon/en attente/reconnue, projet, référence, émission/échéance, note, ventilation et historique des paiements. La validation serveur doit correspondre aux règles du moteur, pas au seul select.

### Crédit et remboursement fournisseur

- Crédit : montant/taxes, projet/fournisseur, date/référence, description/code et pièce ; lien facture facultatif avant application.
- Application : crédit autorisé sur même fournisseur/devise, montant disponible et facture reconnue ; pas de double application ; budget corrigé sur le code approprié.
- Remboursement : mode/compte obligatoires, mouvement financier et rapprochement distincts. Ne pas simplement renommer le crédit appliqué.

### Ventilation multicode — proposition d’implémentation

Allocation id, costCode, subtotal ; somme HT égale au HT document au centime pour reconnaissance ; autoriser ventilation incomplète en brouillon avec alerte ; empêcher reconnaissance si la règle exige 100 %. Répartir taxes proportionnellement avec correction de centimes sur une ligne déterministe. Ne pas recopier le coût complet dans chaque catégorie.

### Pièces

- Associer un identifiant de fichier privé, nom, MIME, taille, empreinte et droit de lecture ; un nom saisi ne prouve pas un fichier déposé.
- Contrôler format/taille serveur ; suppression séparée de l’écriture ; aucun lien public durable non autorisé.
- Aperçu image/PDF, téléchargement réel, pièce absente/inaccessible explicite.
- Les 50 fichiers/500 Mo vus dans Billdr ne sont pas une limite MG Pro acquise ; choisir et afficher une limite réellement supportée puis tester.

### Réception email — intégration à construire

1. Choisir un fournisseur de réception disponible et un domaine contrôlé ; ne pas réutiliser les adresses Billdr.
2. Deux routes/adresses pour reçus et factures ; afficher seulement celles provisionnées et validées.
3. Webhook signé, horodatage anti-rejeu, clé eventId, déduplication par empreinte fichier et source.
4. Récupération des pièces avec hôte autorisé, taille/format bornés et stockage privé.
5. File de traitement : reçu → extrait → à vérifier → brouillon ; erreur/réessayer/quarantaine.
6. OCR/extraction assistée : conserver original et confiance ; dates/fournisseur/taxes ambigus marqués à vérifier.
7. Créer un brouillon par pièce valide selon le contrat produit, sans approbation, paiement ni rapprochement automatiques.
8. Traiter renvoi, pièce doublon, message sans pièce, type interdit, panne et redémarrage sans double création.
9. Audit et écran de suivi ; aucune donnée d’un autre compte dans le traitement.

Dépendances externes encore manquantes : domaine de réception et service configuré. Codex peut produire le code/test avec événements de test, mais ne peut annoncer la réception réelle avant provisionnement et essai contrôlé.

## 10. Demandes de prix — à finaliser

### Observations confirmées

Projet/statut/fournisseur/échéance, sélection, colonnes ; création projet + soumission → catégories/tâches. Une tâche sélectionnée sans nom bloque Suivant. La liste est vide, donc le détail d’une demande existante et les étapes suivantes ne sont pas certifiés.

### Liste construite et compléments

Le tableau MG Pro existe avec filtres, sélection, export, pagination et source. À compléter : catégories hiérarchiques, dates réelles d’envoi/ouverture, actions groupées réelles et colonnes persistantes. Garder les cartes/duplication et la comparaison MG Pro.

### Parcours proposé pour les étapes non observées

Ce contrat est une proposition MG Pro à implémenter, pas une observation de Billdr :

1. Projet obligatoire ; choisir soumission du même projet ou mode manuel MG Pro explicite.
2. Sélection de groupes/tâches avec sous-sélections ; noms obligatoires, quantités/unités affichées.
3. Choix de fournisseurs, emails, échéance, instructions visibles et pièces sélectionnées.
4. Aperçu par fournisseur : périmètre, lignes et pièces sans marges internes, notes privées ni prix d’un concurrent.
5. Enregistrer brouillon ou envoyer explicitement ; résultat par destinataire et reprise des échecs.
6. Accès fournisseur par lien limité, révocable et expirant ; réponse chiffrée et pièces.
7. Comparaison des réponses : HT/taxes/TTC, délai, validité, exclusions, pièces et notes internes.
8. Attribution à une réponse : un seul bon brouillon, source et réponse liées ; aucun envoi/engagement automatique.

### Données proposées

Demande : identifiant stable, référence interne, référence libre, projectId, quoteId, version source, lignes figées, catégories, échéance, état, notes internes séparées, destinataires. Livraison : requestId, supplierId, recipient, tokenHash, expiry/revoked, queuedAt/sentAt/firstOpenedAt, messageId, erreur. Réponse : fournisseur, montants détaillés, devise, reçu/valide jusqu’au, délai, exclusions, pièces, état. Attribution : requestId, responseId, orderId et acteur/date.

### Points impératifs

- Le lien vers une soumission n’autorise pas à changer sa portée après envoi : figer un snapshot ; créer une révision explicite si nécessaire.
- Dupliquer pour un autre fournisseur réinitialise livraison/ouverture/réponse/attribution, sans perdre le périmètre choisi.
- Ne pas confondre prix reçu, sélection interne, accord fournisseur et bon réellement envoyé.
- Ne pas transformer le statut « Réponse reçue » d’une demande en preuve d’un fournisseur ayant répondu si aucune réponse n’est enregistrée.
- Token stocké haché ; client/fournisseur ne lit que sa propre projection.
- Email : journal de livraison, idempotence et erreur ; mailto reste préparation locale.

Recette : sélection partielle, tâche sans nom, source modifiée après envoi, deux fournisseurs isolés, expiration/révocation, réponse révisée, comparaison sans double coût, double clic attribution, échec réseau et conflit de version.

## 11. Bons de commande — lot suivant

Écran ouvert par l’utilisateur : `/purchase-orders?po_tab=pos`. Le détail actuel n’a pas été inspecté dans ce lot. Réutiliser nos bons, réceptions, factures/crédits/paiements et rapprochement. Relever les colonnes/agrégats/filtres de chaque famille et l’éditeur avant d’annoncer une reproduction identique.

Contrat fonctionnel proposé : brouillon → envoyé → partiellement reçu → reçu ; annulation contrôlée ; quantités commandées/reçues/restantes ; facture liée et écarts ; crédits et paiements ; rapprochement. Réceptions partielles ne créent pas seules un encaissement ni une facture. Une attribution issue de demande doit garder ses liens de provenance.

## 12. Architecture et lots techniques proposés

Ne pas décider de tout stocker dans de nouveaux champs JSON sans vérifier la concurrence et les transactions. Les nouveaux événements de paiements/livraisons/runs nécessitent des identifiants, contraintes d’unicité et autorisations testables ; réutiliser les structures actuelles quand elles suffisent.

| Lot | Livrable | Dépendances | Validation de sortie |
|---|---|---|---|
| A | Stabilisation des composants et parcours déjà ajoutés | Code local | Recette desktop/mobile et erreurs de sauvegarde |
| B | Formulaires dépenses/taxes/ventilation/pièces | Moteurs et stockage existants | Montants exacts, pièces privées, conflits |
| C | Paiements/allocations/crédits/reçus | Transactions et mails | Idempotence, contrepassations, PDF |
| D | Demandes/envois/portail/réponses/attribution | Mails, tokens et stockage | Isolation fournisseur, audit, un seul bon |
| E | Réception email/OCR | Fournisseur + DNS | Renvoi/rejeu/panne sans double création |
| F | Routines avancées | Scheduler et messagerie | Fuseaux, jobs et historique |
| G | Parité visuelle et régression globale | A à F | Preuves écrans + matrice de recette |

Noms d’API proposés (non existants à ce jour) : endpoints de paiements/allocations, crédits clients, demandes fournisseur et leurs livraisons/réponses, réception de dépenses, routines/runs. Avant création, vérifier les routes actuelles et choisir extension ou nouvelle route ; documenter payload, erreurs et permissions dans le commit. Ne pas annoncer ces noms comme routes déjà livrées.

## 13. Recette et définition de « prêt à déployer »

### Matrice minimale par module

| Scénario | Résultat attendu |
|---|---|
| Liste vide / recherche sans résultat | Compteur exact et action utile |
| Filtres combinés / annuler fenêtre | Aucun filtre appliqué avant confirmation |
| Pagination / export | Même périmètre et mêmes totaux |
| Créer / recharger / rouvrir | Valeurs persistées à l’identique |
| Sauvegarde échouée | Saisie conservée et erreur explicite |
| Deux administrateurs | Conflit géré sans perte |
| Client / employé / fournisseur | Projection limitée et refus serveur |
| Envoi échoué / renvoi | Statut honnête et absence de doublon |
| Taxes / arrondis / avoir | Écran, API et PDF concordants |
| Pièce privée / lien révoqué | Accès autorisé seulement |
| Mobile / clavier | Actions, focus et lecture utilisables |
| Régression MG Pro | Outils propres toujours présents et opérationnels |

### Commandes locales

- `npm run typecheck`
- `node --import tsx --test tests/*.test.ts` (alternative au lanceur npm/tsx contraint dans cet environnement)
- `npm run build`
- Si cache Turbopack illisible : isoler le cache avec un nom unique sans effacer les sources, puis reconstruire. Ne pas dissimuler une vraie erreur de compilation sous un nettoyage automatique.

### Conditions avant annonce finale

- Tous les critères du périmètre convenu cochés avec preuves ; fonctions externes activées et testées ou explicitement sorties de ce périmètre par le commanditaire.
- Recette visuelle sur le nouveau build, pas capture de l’ancienne production.
- Liste des migrations nécessaires, sauvegarde/retour arrière et contrôles d’intégrité ; aucune migration de données Billdr dans ce lot.
- Code commité, disponibilité distante vérifiée. Un commit local n’est pas une publication GitHub.
- Accès Vercel au bon projet vérifié ; secrets uniquement côté serveur ; configuration des services contrôlée sans exposition.
- Prévisualisation déployée puis testée avant promotion ; dernière validation sur URL exacte et identifiant de commit.

## 14. Blocages connus et communication de livraison

Dernière vérification des accès dans ce fil : GitHub push=false pour `tokkimi/mgpro` ; connexion Vercel `new2026` ne retournant aucun projet MG Pro. Ne pas répéter ces affirmations comme état actuel sans revérification lors de la publication.

La réception email, les canaux externes et la recette complète ne sont pas rendus fonctionnels par la présence d’un bouton. Les points à relever ne doivent pas être masqués dans le statut « prêt à construire à l’identique ».

Livraison attendue de Codex : commit, liste des fonctions réalisées, preuves des tests pertinents, captures du nouveau build, liste précise des dépendances non activées et statut de déploiement. Ne pas envoyer les factures, demandes, rappels ou invitations des vrais dossiers pendant la recette sans instruction explicite.

## 15. Consigne prête à transmettre à Codex

> Travaille dans le dépôt MG Pro existant. Lis AGENTS.md, ce dossier et les annexes ci-dessous. Vérifie git status et conserve le travail présent. Implémente les éléments manquants du périmètre Mes projets, Notifications, Assistant/Routines, Factures/Paiements, Dépenses et Demandes de prix, par lots cohérents. Conserve tous nos outils avancés. Réutilise les moteurs de calcul et de droits. Pour chaque lot, produis code, persistance, états d’erreur, tests et recette visuelle. N’invente pas une observation Billdr manquante ni un envoi externe. Documente les contrats proposés avant leur réalisation. Une intégration externe est terminée uniquement après activation et essai réel contrôlé. Ne migre aucune donnée Billdr. Ne publie pas un statut global prêt à déployer tant que les critères de la section 13 restent ouverts. Termine par les commits et la matrice réalisée/bloquée/restante.

---

# Annexes : relevés existants intégrés

Les annexes sont des relevés historiques ; la section 3 et les lots ci-dessus précisent leur état. Des phrases « restant » peuvent avoir été partiellement résolues depuis l’annexe ; le code et les commits font foi pour la présence d’une implémentation, les preuves de recette pour son fonctionnement.


---

## Annexe : BILLDR-HANDOFF-2026-10-23.md

# Passation Billdr vers MG Pro — état du 23 octobre 2026

Ce lot est un début de reprise, pas une certification de parité ni une migration de données.

## Référence observée dans le compte Billdr

- Navigation : Mes projets, Notifications, Bob, Factures, Dépenses, Demandes de prix, Bons de commande, Fichiers, Gabarits & coûts, Mon équipe, Contacts, Feuille de temps, Journal, Calendrier, Courriels, Réglages.
- Mes projets : 184 résultats, pagination, liste/carte, sept états, filtres tags/assignés et filtres supplémentaires. Colonnes référence, adresse/client, tags, assignés, montant, statut et cinq dates métier.
- Notifications : deux onglets Notifications/Événements, recherche, projet, utilisateur, type, date, non lues, lecture groupée. MG Pro reste limité aux 300 actions récentes déjà retournées par son API ; pas de filtre auteur ajouté sans données auteur.
- Projet : Sommaire, Communications, Fichiers, Soumissions, Contrat, Sélections, Factures, Dépenses, POs, Budget, Échéancier, Tâches, Feuille de temps, Journal, Rapports.
- Soumissions : liste avec titre, modification, ouverture, statut, montant et demandes de prix associées. Demander un prix démarre depuis la portée des travaux.
- Contrat : contrat initial et changements signés, puis demandes de changement avec description, demande, ouverture, statut, montant.
- Créer un ordre de changement produit immédiatement un brouillon côté Billdr, avant la saisie. Un brouillon vide a été créé pendant cette inspection ; aucune notification client, signature ou transaction n’a été déclenchée par l’agent. Ne pas le confondre avec un document historique lors de la reprise.
- Éditeur de changement : titre, description, client, groupes/catégories, tâches, quantité/unité, matériaux, main-d’œuvre, marge, codes de coût, notes internes, importer, demander un prix, personnaliser et versions. Un choix Extra/Crédit existe par ligne.
- Demandes de prix : filtres projet/statut/fournisseur/échéance, colonnes configurables, références, source soumission/catégories, dates envoyé/ouvert/échéance et montant/statut. Aucun résultat dans la vue observée.
- Factures : onglets factures/paiements, recherche, période (trois derniers mois par défaut), statut/projet, trois agrégats, export. Les 30 factures de cette vue ne constituent pas le total historique.
- Réglages : entreprise, marque, informations personnelles, paramètres projet, IA, courriels par défaut, employés, abonnement, notifications, intégrations. Coordonnées, licence, taxes, assurance, transfert des reçus/factures, semaine et congés.

## Changements de ce lot

- Exposer les rubriques opérationnelles dans le même ordre de navigation que Billdr, puis les outils supplémentaires MG Pro ; les contrôles de rôle existants s’appliquent toujours.
- Conserver tableau de bord, comptabilité, visites, relevés, plans, analyses et tous les outils existants.
- Ajouter au centre de notifications les vues Notifications/Événements et les filtres texte, projet, type, dates, avec réinitialisation. La vue Événements consulte le même historique autorisé sans marquer une action comme lue lors de son ouverture ; elle ne constitue pas un nouvel historique exhaustif.
- Corriger l’aperçu de soumission : utiliser la projection de vente partagée pour les prix de ligne (marge et majoration globale incluses), et le répartiteur commun pour les échéances de paiement et les centimes.

## Validation

- TypeScript : réussi.
- Suite existante : 83 tests réussis via `node --import tsx --test tests/*.test.ts`. Le lanceur npm/tsx standard rencontre une restriction de pipe IPC de cet environnement ; le même ensemble de tests a été exécuté via le chargeur Node.
- Tests ciblés après correction de l’aperçu : 17 réussis.
- Build Next.js de production : réussi.
- Recette visuelle de ce nouveau lot : à effectuer sur un déploiement de prévisualisation. Les inspections dans le navigateur concernent la production antérieure et Billdr, pas ce nouveau code.

## Reprise des données — non exécutée

Aucune donnée Billdr n’a été importée dans MG Pro dans ce lot. Ne pas annoncer une migration terminée à partir de la présence d’écrans ou de données de démonstration.

1. Obtenir une extraction exhaustive avec identifiants stables : clients, projets actifs et archivés, soumissions et versions, contrats et preuves de signature, changements, factures/paiements/crédits, fournisseurs/achats, suivi, temps, journaux, fichiers et réglages.
2. Conserver les exports originaux hors du dépôt Git et toutes les sources dans Billdr. Un export de factures ne couvre pas les fichiers, signatures, suivis ou dossiers.
3. Construire le mapping sur les colonnes et formats réellement extraits, jamais sur un format Billdr supposé. Préserver références, statuts originaux, dates, liens et identifiants source.
4. Simulation sans envoi de courriels, sans nouveaux encaissements, sans nouvelle signature. Rapporter doublons, orphelins et documents manquants ; ne pas fusionner sur le nom du client seul.
5. Import idempotent par identifiant source, préservation des données MG Pro, journal de lot et possibilité de reprise.
6. Comparer les nombres par famille/statut, les montants HT/taxes/TTC, facturé/payé/solde, les signatures et les empreintes des fichiers ; mêmes filtres et même période de chaque côté.
7. Vérifier chaque parcours et chaque rôle avant la passation : créations, modification, duplication, personnalisation, aperçu/PDF, envoi, consultation, signature, changement, demande de prix, attribution, facture, paiement, notification, historique.

## Écarts encore ouverts

La reprise visuelle de tous les éditeurs, les groupes imbriqués de devis, la sélection multiple, les crédits de changement, le filtre auteur, les intégrations externes, la migration exhaustive et la recette finale ne sont pas livrés par ce lot. Réutiliser les audits précédents comme inventaire de pistes et revérifier leurs affirmations contre le code et la production actuels.


---

## Annexe : BILLDR-REVIEW-CHECKLIST.md

# Reprise de l’organisation et des parcours

Statuts : observé = écran consulté dans la référence ; vérifié = scénario exécuté dans MG Pro ; à vérifier = preuve encore manquante. Une observation ne certifie jamais le fonctionnement de MG Pro.

| Domaine | Observation actuelle | Vérifications restantes dans MG Pro |
|---|---|---|
| Navigation | Ordre des rubriques, menu latéral, outils supplémentaires | Recette visuelle desktop/mobile sur le nouveau build |
| Notifications | Deux vues, recherche, projet/utilisateur/type/date, lecture ; matrice détaillée par rôle/canal | Filtre auteur, événements complets et pagination ; canaux externes réels |
| Dépenses | Quatre familles, colonnes, filtres, détail dépense et facture fournisseur | Pièces jointes, ventilation, règles fiscales, rapprochement complet |
| Achats | Bons, factures fournisseur, paiements, crédits ; colonnes et agrégats propres | Chaque transition, réceptions, facture liée, crédit, paiement, exports |
| Fichiers | Racine/projets/dossiers, fil d’Ariane, protection des dossiers système, partage client | Opérations groupées, téléchargement réel, visibilité multirôle et gros fichiers |
| Gabarits | Soumissions et bibliothèque, catégories/taux, codes de coût/divisions, échéanciers, tâches/gabarits, produits, sélections | Hiérarchie, import/export et chaque formulaire détaillé |
| Équipe | Rôles, statut courant, notifications, assignation automatique, archives | Invitations et permissions multicomptes |
| Contacts | Quatre listes, cinq types de contact, recherche/import/export | Documents professionnels, doublons, archivage/restauration multirôle |
| Temps | Employé/catégorie/résumé, période, coût/facturable, approbation/export | Pointage, clôture, corrections, export et conversion sans double compte |
| Journal | Questions, photos, météo, commentaires, partage | Champs personnalisés de bout en bout, média, publication et droits |
| Calendrier | Projet/membre/type, mois et navigation ; calendrier des échéanciers | Fuseaux horaires, dates limites et toutes les sources |
| Courriels | Conversations par projet, statut, note interne, pièces et actions rapides | Envoi/réception réels, délivrabilité et isolation des notes |
| Réglages entreprise | Documents, fiscalité, assurance, transferts, semaine/congés | Persistance et effet de chaque réglage dans les documents/opérations |
| Marque | Documents et courriels, en-tête, couleur, affichages et signature | Aperçus/PDF réellement identiques aux réglages enregistrés |
| IA | Personnalité, contexte, style, clarification, accès aux données | Configuration effective et respect de chaque préférence |
| Courriels par défaut | Treize familles ouvertes, sujet/message/bouton/variables | Rendu, variables, envoi de test autorisé et envoi métier |
| Portail employés | Statuts visibles, codes autorisés et questions requises | Validation serveur et accès réel avec compte employé |
| Intégrations | Comptes et catégories de synchronisation visibles dans la référence | OAuth MG Pro, mapping, reprise des erreurs et anti-doublons |
| Projet — budget | Coûts/révisé/achats/main-d’œuvre, analyse revenus et profit | Contrôle complet des agrégats, avoirs, retenues, facturation progressive |
| Projet — échéancier | Liste/Gantt/calendrier, dépendances, jours ouvrés, groupes/jalons | Recette déplacements/dépendances/publication, historique et sauvegarde |
| Projet — tâches | Assignés, dates, statuts, fichiers/commentaires/sources, gabarit/PDF | Sous-tâches et chaque source d’import, permissions |
| Projet — sélections | Sections/groupes/produits/partage/décisions | Comparaison et décisions client, historique, conversion achats |
| Projet — rapports | Blocs budget, contrat, changements, factures/paiements, avancement, tâches client, photos | Snapshot, aperçu/PDF, envoi, consultation et immutabilité |
| Projet — soumissions/contrat/changements | Listes et un éditeur de changement observés | Parcours exhaustif édition/personnalisation/PDF/envoi/signature/refus/version |

## Changements locaux du lot

- Navigation directe et filtres des notifications (lot précédent).
- Aperçu devis basé sur la projection des prix de vente et le répartiteur de paiements communs (lot précédent).
- Dépenses reliées au grand livre fournisseur complet ; comptabilité conservée séparément.
- Filtre code de coût dans le grand livre.
- Navigation d’une écriture fournisseur vers sa famille dans le projet, avec mémorisation de l’onglet.
- Suivi global des achats accessible depuis Bons de commande, en conservant la saisie préexistante.

## Limites de livraison

La parité exhaustive et la recette de bout en bout ne sont pas terminées. Les actions d’envoi, signature, suppression, approbation et paiement ne sont pas exécutées dans le compte de référence pendant l’observation. Les 83 tests de référence passent ; cela ne constitue pas une recette de toutes les interfaces.

Publication bloquée par l’accès en lecture seule au dépôt et l’absence du projet cible dans la connexion de déploiement disponible. Aucun déploiement de ce lot ni aucune migration des données n’a été effectué. La migration est explicitement différée après installation et validation.

## Lot Routines — inspection et corrections du 23 octobre 2026

Exigence utilisateur : préserver tous les outils propres à MG Pro et leurs fonctions avancées ; reproduire en détail les parcours communs Billdr. Aucun outil existant retiré dans ce lot.

### Référence observée

- Page Bob / Routines : onglets Chat/Routines, gestion, recherche titre, tags multisélection, automatisation ON/OFF, nouvelle routine, favoris et catalogue. Colonne droite : filtre routine, rapports datés et statut Terminé / Automatisé.
- Carte : catégorie, titre, calendrier, dernière/prochaine exécution, bascule et menu Modifier / Dupliquer / Retirer des favoris.
- Formulaire : titre obligatoire, instructions riches obligatoires (gras, italique, souligné, liste), tags, automatisation désactivée initialement. Activation : fréquence quotidienne, hebdomadaire, mensuelle, trimestrielle ou annuelle ; jour ; heure ; notifications courriel/SMS ; personnes multisélection. Aucun enregistrement effectué dans Billdr.
- Catalogue : recherche titre, tags, créateurs, ajout aux favoris et cinq modèles observés : comptes clients/fournisseurs, résumé du journal de la semaine dernière, tâches en retard/du jour, pipeline de projets hebdomadaire et analyse du pipeline commercial.
- Rapport financier de référence : AR/AP/net, ventilation client/projet/fournisseur, HT/TTC, échéances/retards, périodes et priorités. Les commandes ne doivent pas devenir des charges en doublon dans MG Pro.
- Rapport chantier : avancement, retards/météo, sécurité, problèmes récurrents, matériaux non résolus, variations d’équipe/heures et actions par projet.
- Rapport tâches : inachevées échues et du jour, regroupement par projet, assigné, ancienneté, priorité au-delà de sept jours.
- Pipeline projets : indicateurs par statut, variations hebdomadaires, valeur incluant changements approuvés, dates et risques.
- Pipeline ventes : six tendances mensuelles sur six mois, gestionnaires, devis envoyés/signés, occasions et stagnation à 30/21 jours.
- Styles calculés observés : titre Routines Open Sans 24px/600 #111827 ; titre carte Open Sans 14px/600 ; contrôles 14px ; texte #191f2f, secondaire #868e9b ; action primaire #4959e4 sur blanc, rayon 8px. Relevé de cette page, pas validation globale ni mobile.

### Changements MG Pro

- Filtres combinés titre/tag/activation/favoris et réinitialisation.
- Catalogue des cinq rapports MG Pro existants, création sans activation automatique par défaut.
- Historique d’une ou de toutes les routines, tri décroissant, conservation des résultats existants.
- Heure 0 conservée à la normalisation ; valeurs invalides bornées.
- Échec de persistance : formulaire conservé avec erreur visible.
- Libellés corrigés : une tâche serveur quotidienne existe déjà, mais elle ne garantit pas l’heure hebdomadaire demandée. Aucune promesse de notification ou d’exécution précise ajoutée.

### Preuves et limites

85 tests réussis, TypeScript réussi, build production réussi après isolation d’un ancien cache Turbopack illisible. Aucun déploiement ni migration.

Toujours ouverts : éditeur riche/instructions personnalisées, fréquences complètes, fuseau explicite et exécution précise, notifications multi-destinataires, duplication, rapports détaillés ci-dessus, apparence identique et recette navigateur du nouveau code. Les cinq rapports calculés MG Pro ne sont pas équivalents aux cinq modèles IA Billdr. Les filtres de tags MG Pro sont simples, ceux observés dans Billdr sont multiples.

Accès revérifiés : GitHub tokkimi/mgpro expose push=false ; connexion Vercel new2026, aucun projet mgpro retourné. Les blocages de publication subsistent.


---

## Annexe : BILLDR-INVOICES-2026-10-23.md

# Factures — relevé détaillé du 23 octobre 2026

État : inspection des interfaces ci-dessous et premier lot du registre MG Pro. La parité complète, les opérations réelles et la recette visuelle MG Pro ne sont pas certifiées.

## Liste Factures

- Titre avec nombre de factures, bouton Nouvelle facture, onglets Factures/Paiements.
- Recherche, période, statuts multisélection et projet. Période initiale : trois derniers mois ; les 30 factures observées correspondent à cette vue et non à tout l’historique.
- Périodes proposées : 7 derniers jours, 4 dernières semaines, 3 derniers mois, 12 derniers mois, mois à ce jour, trimestre à ce jour, année en cours, dates personnalisées.
- Statuts proposés : Brouillon, Envoyé, Payée partiellement, Rejeté, Payé. Les libellés des lignes sont parfois féminins (Envoyée/Payée).
- Agrégats : total facturé à ce jour, total payé à ce jour, compte débiteur. Leur périmètre exact n’est pas démontré par un changement de tous les filtres ; ne pas supposer qu’ils suivent chaque filtre.
- Colonnes : iRef immuable, client/description, envoyée le, ouverte le, sous-total, taxes, total, solde dû, statut et menu.
- Pagination : résultats début/fin/total et Début/Précédent/page/Suivant/Fin.
- Menu d’une facture payée : PDF, résumé des paiements PDF, synchronisation QuickBooks, rappel désactivé, crédit désactivé, paiement désactivé, voir projet, marquer annulée. Aucune de ces actions conséquentes exécutée.
- Export factures déclenché : création d’un lien blob observée. Contenu/format du téléchargement non vérifié ; ne pas annoncer un export exhaustif contrôlé.

## Fiche d’une facture partiellement payée

- Bandeau Retour / Sauvegarder et quitter ; onglets Vue client et Votre vue.
- Actions : annulation, PDF, rappel et recevoir un paiement.
- Vue client dans iframe : marque/coordonnées entreprise, licence et identifiants fiscaux, référence, date de facturation, client, projet, adresse de facturation, lignes description/quantité/coût unitaire/montant ; sous-total et deux taxes séparées avec numéro fiscal et taux ; total.
- Colonne droite : résumé facturé/payé/solde, versements datés avec méthode et statut Reçu, crédit, paiement, résumé PDF, connexion bancaire, majoration/marge, sous-total/taxes/total, carte et PAD cochés, option de sauvegarde pour le projet.
- Cas observé : total 14 743,86 ; trois versements 4 500 + 5 000 + 5 000 ; payé 14 500 ; solde 243,86. Vérification arithmétique, sans modification.
- Votre vue : avertissement lecture seule, coordonnées, adresses, facturation/échéance ; groupe, sélection de lignes, description/source/quantité/prix/marge/total ; ajout vide/depuis ; notes par défaut et fichiers joints.
- Pièces : interface annonce jusqu’à 50 fichiers de 500 Mo chacun. Pas de test de chargement ni validation serveur de cette limite.
- Message indique retour au brouillon pour modifier ; ce parcours n’a pas été exécuté.

## Recevoir / modifier un paiement

- Montant reçu obligatoire, facture et montant alloué, ajout d’une autre association, référence personnelle, date obligatoire, méthode, note, case d’envoi du reçu, Annuler et Sauvegarder.
- Méthodes : carte de crédit, comptant, chèque, E-transfer (Interac), virement bancaire, transfert bancaire, note de crédit, autre.
- Ouverture d’un paiement existant : référence PAY, champs préremplis, supprimer, sauvegarde désactivée sans changement. Aucun paiement modifié, reçu envoyé ou transfert déclenché.
- Crédit : sélection d’une note de crédit soumise, qui crée un paiement selon le texte de l’interface. Aucun crédit disponible dans la facture inspectée, action désactivée. Le cas avec crédit disponible reste à observer.

## Liste Paiements

- Recherche propre, période, facture, méthode et projet ; export propre.
- Agrégats reçu/frais/net ; 39 paiements dans la période observée. Ne pas comparer ce reçu de période au payé cumulé des factures comme si les dates étaient identiques.
- Colonnes : iRef PAY, client, facture associée, référence personnelle, méthode, reçu le, montant reçu, frais, montant net, statut, actions.
- Une note de crédit figure dans les paiements ; elle ne constitue pas un nouvel encaissement bancaire.

## Création

Nouvelle facture ouvre une étape Choisir un projet puis Créer la facture. Arrêt avant création pour éviter un brouillon dans la référence. L’éditeur d’un brouillon, import de lignes depuis sources, personnalisation, émission et envoi restent à observer dans un contexte de test approprié.

## Lot MG Pro réalisé

Registre distinct de la comptabilité, réservé à l’administration, utilisant les dossiers déjà autorisés :

- Recherche référence/titre/client/projet/descriptions.
- Projet, statut calculé, dates de facturation et réinitialisation.
- Trois agrégats explicitement limités aux factures filtrées hors brouillons/annulations.
- Colonnes référence, client/description, projet, facturation, envoi, ouverture, HT, taxes, TTC, solde, statut.
- Pagination 30 lignes et export CSV de toutes les lignes filtrées (protection contre formules).
- Ouverture d’une facture et création via les outils MG Pro existants ; comptabilité/rapports conservés.
- Statuts MG Pro (Émise/Vue/En retard notamment) conservés, sans changer les données pour imiter les seuls libellés Billdr.

## Restant

Onglet paiements autonome et écritures détaillées, frais/net et allocations multiples, méthode et note, reçus, crédits clients, résumé PDF, préréglages de période et filtres multiples, éditeur/aperçu de facture identique, envoi/versionnement, rapprochement QuickBooks et tests multirôles. Aucun faux bouton pour ces fonctions ajouté. Aucune donnée Billdr copiée dans MG Pro.

Validation : 87 tests, TypeScript et build de production réussis. Vérification visuelle du nouveau code sur prévisualisation toujours à effectuer. Aucun déploiement ni migration.


---

## Annexe : BILLDR-EXPENSES-2026-10-23.md

# Dépenses — inspection détaillée du 23 octobre 2026

## Périmètre observé

Liste Tout, colonnes, filtres supplémentaires, menu Nouveau, fiche dépense approuvée, facture fournisseur brouillon, liste crédits vide, création crédit et variante remboursement, transfert par courriel. Les formulaires ouverts ont été annulés sans sauvegarde ; aucun paiement, transfert de courriel, suppression ou approbation déclenché.

## Liste Tout

- Actions : transférer les dépenses par courriel ; Nouveau → Dépense / Facture fournisseur / Crédit fournisseur.
- Quatre vues : Tout, Dépenses, Factures fournisseur, Crédits fournisseur.
- Recherche fournisseur/référence/projet ; date ; statut ; Plus de filtres → type et codes de coût, nombre de résultats, réinitialiser/annuler/confirmer.
- Statuts proposés dans Tout : En attente, Approuvée, Brouillon, En suspens, À payer, Partiellement payée, Payée.
- Indicateurs HT/taxes/TTC ; 126 résultats dans cette vue. Ce nombre est celui de la vue courante, pas une certification de l’extraction historique.
- Colonnes visibles et configurables : iRef immuable, projet/client, date, type, référence personnelle, fournisseur, TTC, statut ; défilement horizontal et pagination (20 lignes visibles).
- Ne pas fusionner les références internes EXP/BIL avec la référence libre du justificatif.
- Montants et statut des brouillons visibles : le montant affiché dans une liste n’implique pas sa reconnaissance comptable.

## Fiche Dépense

- Identifiant EXP, pièce jointe avec suppression dédiée.
- HT obligatoire, code de taxe QuickBooks, TPS et TVQ distinctes avec montants modifiables, total.
- Fournisseur et projet obligatoires ; date ; référence ; méthode et compte de paiement ; description.
- Répartition : ajout de code de coût et montant par ligne ; pourcentage alloué affiché. L’ajout d’une ligne proposée au montant complet a été observé puis annulé sans sauvegarde.
- Supprimer, Annuler, Sauvegarder. Tests d’approbation, écritures comptables et suppression non exécutés.

## Facture fournisseur brouillon

- Identifiant BIL, PDF joint, bon de commande associé.
- Montant HT, code fiscal QuickBooks, deux taxes séparées, total.
- Fournisseur, statut (Brouillon/En attente/À payer proposés), projet, référence, date d’émission, échéance, note.
- Répartition des coûts ; section paiement (aucun paiement pour le cas ouvert).
- Supprimer, annuler, sauvegarder. Aucun changement enregistré.

## Crédits fournisseur

- Liste vide dans le compte inspecté ; recherche, statut, fournisseur et export.
- Colonnes : iRef, projet/client, description, fournisseur, émission, référence, montant, TTC, statut, facture liée, code de coût.
- Création : justificatif ; modes Crédit et Remboursement ; montant ; taxes multiples avec montants ; total ; projet/fournisseur ; date ; référence ; description ; code de coût.
- Le texte demande d’appliquer le crédit à une facture ouverte et de sélectionner le code de coût pour le budget.
- Mode Remboursement : méthode de paiement obligatoire et compte de paiement en plus. Formulaire annulé avant création.
- Absence de crédit existant : application, historique et états après utilisation restent non vérifiés.

## Transfert par courriel

Deux adresses distinctes (reçus et factures fournisseur), préfixe configurable et copie d’adresse. Une pièce jointe valide doit créer une dépense/facture selon l’explication du produit. Aucun message envoyé, règle mail créée ni préfixe modifié. Fonctionnement de réception, OCR, doublons et pièces invalides non testé.

## Comparaison et lot MG Pro

Le grand livre MG Pro contenait déjà les familles dépenses/factures/crédits ainsi que paiements et bons de commande, recherche, filtres projet/fournisseur/statut/code/date, colonnes, export, coûts et soldes. Tous ces outils ont été conservés.

Ajouts :
- Consultation détaillée d’une écriture depuis la liste : projet/client, fournisseur, statut, dates, référence, code, HT/taxes/TTC, solde, description et pièce référencée ; ouverture du dossier et de ses actions séparée.
- Filtre avec/sans pièce référencée, partagé avec les lignes et totaux/export existants. Il ne certifie pas l’absence de fichiers attachés séparément au dossier.
- Validation des préférences de colonnes enregistrées : suppression des noms obsolètes/doublons et retour aux colonnes par défaut si la préférence est inutilisable.
- Dialogue natif avec gestion d’Échap, titre accessible et disposition mobile.

## Restant et validation

À terminer : fidélité visuelle exacte, iRef/référence distinctes, taxes séparées dans tous les formulaires fournisseur, ventilation multicode, compte de paiement, intégration fiscale QuickBooks réelle, transfert email/OCR, remboursement fournisseur distinct d’un crédit appliqué, prévisualisation justificatif dans la fiche, menus et transitions exhaustifs, tests multirôles et recette navigateur du nouveau code.

88 tests, TypeScript et build de production réussis. Aucun déploiement ni migration ; la recette visuelle de ce nouveau lot n’a pas été effectuée. La fiche de consultation ajoutée ne remplace pas l’éditeur Billdr à l’identique.

## Lot de production de la barre supérieure

- Menu Nouveau : Dépense ouvre l’éditeur existant ; Facture fournisseur et Crédit fournisseur proposent le projet puis réutilisent directement les formulaires validés du circuit achats, sans quitter la liste. Les nouveaux formulaires fournisseur commencent en brouillon.
- Périodes de date : toutes dates, 7 jours, 4 semaines, 3/12 mois, mois/trimestre/année à ce jour, dates personnalisées. Calcul sur date civile Montréal, borne de mois corrigée.
- Plus de filtres : fenêtre native, saisie provisoire, confirmation/annulation et réinitialisation ; type, projet, fournisseur, coût et justificatif. Les outils MG Pro et familles paiements/bons restent accessibles.
- Échec de sauvegarde facture/crédit : le formulaire reste ouvert ; attente de persistance et bouton désactivé pendant la requête.
- Bouton transfert email : fenêtre indiquant honnêtement que la réception n’est pas connectée ; aucune adresse fictive ou adresse Billdr réutilisée. Ce bouton ne constitue pas une intégration de réception livrée.
- 89 tests, TypeScript et build production réussis. Recette interactive et visuelle du nouveau lot non effectuée ; pas de déploiement.

Le module et l’ensemble de la parité ne peuvent pas encore être annoncés intégralement prêts : réception des pièces par courriel, écarts de formulaires mentionnés ci-dessus et recette complète restent ouverts.


---

## Annexe : BILLDR-BID-REQUESTS-2026-10-23.md

# Demandes de prix — observation et production du 23 octobre 2026

## Interface observée

Liste vide : recherche de projet, statut, fournisseur, date d’échéance ; sélection multiple ; action dépendant de la sélection ; colonnes configurables et pagination de 20 lignes.

Colonnes : iRef, projet, soumission, catégories, fournisseur, envoi, ouverture, échéance, montant, statut. Statuts proposés : Accepté, Attribué, Annulé, Refusé, Prix reçu, Rejeté, Sélectionné, Envoyé.

Création : choisir projet et soumission, puis sélectionner catégories/tâches. Un projet et sa soumission ont été choisis sans création. La sélection d’une catégorie contenant une tâche sans nom affiche « Toutes les tâches sélectionnées doivent avoir un nom pour continuer » et bloque la suite. Le formulaire a été annulé sans changer la soumission. Les étapes suivantes et la fiche d’une demande existante restent non observées, car la liste est vide et ce cas bloque.

## Production MG Pro de ce lot

- Liste tabulaire avec référence, projet, soumission source, fournisseur, échéance, montant et statut ; vue cartes conservée.
- Fournisseur filtrable en plus du projet/statut/recherche/dates.
- Filtre date portant effectivement sur l’échéance de la demande, et non une éventuelle date de création.
- Sélection individuelle et de la page, export limité aux demandes sélectionnées lorsque la sélection est active, effacement.
- Choix provisoire des colonnes avec annulation, réinitialisation et sauvegarde pour la session.
- Pagination de 20 demandes.
- Action Nouvelle demande de prix vers l’éditeur existant.
- Sélection des lignes d’une soumission source pour limiter la portée ; vérification des noms avant sauvegarde.
- Comparaison, réponses multiples, attribution et bons de commande MG Pro conservés dans les parcours existants ; aucune conversion des données pour imiter des statuts différents.

## Limites explicites

Les dates réelles d’envoi/ouverture, l’envoi serveur au fournisseur, les retours fournisseur par portail et les catégories hiérarchiques ne sont pas livrés par ce lot. Le lien mailto existant prépare un message et ne prouve pas un envoi. La référence existante n’est pas un identifiant Billdr iRef. La création reste un éditeur MG Pro, pas une reproduction complète du parcours Billdr.

93 tests existants réussis, TypeScript et build production réussis. Pas de recette interactive/visuelle du nouveau tableau, pas de déploiement ni migration. L’ensemble ne doit pas être annoncé intégralement prêt à déployer.
