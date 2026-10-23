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
