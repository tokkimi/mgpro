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
