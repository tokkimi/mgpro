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
