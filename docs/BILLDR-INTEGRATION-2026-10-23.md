# MG Pro — intégration et recette Billdr du 23 octobre 2026

## Périmètre de la livraison

Les exports sont réunis sur `codex/billdr-integration-2026-10-23`, à partir de la version locale du site blanc `e3205c5`. Le lot Contacts/Bons de commande est récupéré par bundle, une seule fois ; Fichiers et Gabarits/Équipe sont appliqués par patches. Le site noir conserve sa branche et sa présentation publique.

Sources récupérées :

- `8b39d83` : douze commits depuis `fbd17db`, dont `2361588` Bons de commande, `0670cbf` Notifications et les spécifications Contacts.
- `f48e36d` : Fichiers, dossiers, ajout multiple, ZIP, tri, déplacements et partage public révocable.
- `e937d2a` et `0162e93` : Gabarits & coûts et Mon équipe. Les trois fichiers MGPro.patch transmis sont identiques ; appliqués une seule fois.

Les anciens rapports mentionnant l'impossibilité de publier décrivent leurs environnements cloud. La session locale dispose de Git en écriture et du projet Vercel `tokkimis-projects/mgpro`. Ces obstacles de transfert sont levés.

## Conservation et corrections d'intégration

- Outils MG Pro conservés : visites/relevés, saisie vocale, plans 2D/3D, calculs de prix, calendrier, santé des projets, décisions clients, comptabilité, portail client, réception partielle, rapprochement, pointage, brouillons et transferts IndexedDB.
- Navigation directe dans l'ordre de la référence ; outils supplémentaires toujours accessibles.
- Administration en blanc/noir, tableaux et filtres plus proches de Billdr ; styles limités à l'espace de gestion.
- Mes projets : liste de vingt lignes par défaut, colonnes, tags, tri, cinq filtres de dates observés et échéance MG Pro supplémentaire. Les dates d'envoi/signature viennent des événements réels des soumissions liées ; une date historique absente reste vide. Le budget MG Pro n'est pas présenté comme une valeur contractuelle Billdr.
- Fichiers : état de navigation conservé lors des sauvegardes du projet ; erreurs visibles dans les dialogues ; Échap respecte une opération en cours.
- Les conflits ont été résolus en conservant les ajouts des deux lots et le logo actuel de l'administration.
- Next.js mis à jour de 16.3.8 à 16.4.2 ; `npm audit` ne signale plus de vulnérabilité sur le verrou de dépendances testé. Référence : https://github.com/vercel/next.js/releases/tag/v16.4.1.

## Preuves de vérification

| Contrôle | Résultat |
| --- | --- |
| Tests métier/unitaires | 106 réussis, zéro échec |
| TypeScript | Réussi |
| Build Next.js production | Réussi sur 16.4.2 |
| Navigation navigateur | 16 rubriques ouvertes successivement sans erreur JavaScript |
| Mes projets | Liste, six filtres de dates, recherche sans résultat, réinitialisation |
| Fichiers | Création d'un dossier en démonstration, conservation du chemin après sauvegarde, ouverture du dossier vide |
| Factures | Recherche, état vide, réinitialisation et onglet Paiements |
| Mon équipe | Liste et dialogue Rôles et permissions |
| Mobile | Menu complet accessible depuis Plus, outils présents |
| API Fichiers | Lien public invalide : 404 ; publication anonyme : 403 |
| Base connectée | Lecture des tables profiles, records, memberships et audit_log réussie |
| Stockage | Bucket documents accessible au serveur et privé |

Les scénarios interactifs utilisent `/demo` et des données fictives en mémoire. Ils ne certifient pas une sauvegarde authentifiée, un envoi, un paiement ou une invitation en production. Les contrôles de base ci-dessus sont en lecture seule. Aucune donnée Billdr n'a été migrée et aucun courriel, SMS ou paiement réel n'a été envoyé.

## Matrice des modules et écarts encore ouverts

| Module | Lot intégré | Restant pour parité complète |
| --- | --- | --- |
| Mes projets | Liste/carte/cartes, statuts, filtres, dates, tri, sélection, export | Reproduction complète des actions et des affectations ; valeur contractuelle identique à la référence ; saisie des tags dans les mêmes parcours |
| Notifications | Notifications/événements, recherche, projet, type, dates de Montréal, lecture par compte | Auteur, pagination serveur au-delà des 300 actions, couverture exhaustive et canaux externes |
| Bob / Assistant | Chat existant, catalogue, filtres, favoris et historique des routines | Instructions riches, fréquences complètes, exécution précise et notifications ; rapports IA équivalents |
| Factures | Registre, dates, montants, états calculés, journaux de paiements, export | Allocations/avoirs/reçus et parcours de paiement complets ; recette authentifiée/PDF/envoi |
| Dépenses | Familles, filtres, colonnes, détail, accès aux outils existants | Ventilation multicode, taxes et pièces détaillées, rapprochement de bout en bout, réception email/OCR |
| Demandes de prix | Liste, filtres, sélection, sources des tâches | Envoi fournisseur, suivi d'ouverture réel, portail de réponse, attribution atomique |
| Bons de commande | Quatre vues, indicateurs, tri, totaux, sélection/export, formulaires et protection des liens factures | Recette complète réception/facture/crédit/paiement, PDF et connexions comptables |
| Fichiers | Dossiers projet, ajout multiple, sélection, ZIP, déplacement, liens révocables/expirants | Téléversement/ZIP/partage authentifiés sur une base de recette, dossiers racine autonomes et imbrication, exports de toutes les familles métier |
| Gabarits & coûts | Dix rubriques, filtres, pagination, sélection, fiches et aperçu | Import CSV Billdr, codes hiérarchiques complets, extraction produit URL, groupes/tags de sélections |
| Mon équipe | Profils, horaires, taux, archives, affectations et export | Rôle chargé de projet cohérent dans toute l'application, salarié sans courriel, état de quart temps réel, SMS |
| Contacts | Listes existantes, spécification détaillée, brouillon conservé après échec | Documents/expiration, alias/langues, import client détaillé et parcours de contact complets |
| Feuille de temps | Pointage, approbation, coûts, clôture et export existants | Fin de l'analyse dédiée et conformité du classeur Résumé/Tous/par employé/Détail fourni |
| Journal / Calendrier / Courriels / Réglages | Outils existants conservés ; navigation vérifiée | Recette détaillée de chaque option selon la grille BILLDR-REVIEW-CHECKLIST.md |
| Intégrations | Connexions déjà présentes conservées | QuickBooks et SMS non intégrés ; réception email/OCR à construire ; configuration effective du fournisseur IA à vérifier |

Pour chaque prochaine livraison, vérifier séparément observation Billdr, réalisation MG Pro, sauvegarde serveur, permissions et déploiement. Un build réussi ou un écran qui s'ouvre ne signifie pas que toutes les options sont équivalentes.

## Déploiement

Le SHA, les URLs et les résultats de vérification en ligne sont consignés dans le compte rendu de publication. Ce document décrit le périmètre testé ; il ne certifie pas la parité exhaustive.
