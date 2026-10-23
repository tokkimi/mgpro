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
