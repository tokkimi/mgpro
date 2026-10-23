# Notifications — lot local

## Produit

- Deux vues Notifications et Événements sur l’historique actuellement autorisé.
- Recherche sur le libellé, le document, le nom et la référence du projet associé.
- Filtres combinables par projet, document, événement et période.
- Dates et regroupement par journée dans America/Montreal, y compris les changements d’heure.
- Affichage progressif par 40 événements ; aperçu de la cloche limité à six événements.
- Lecture individuelle ou groupée existante conservée ; consulter un événement ne marque pas de notification comme lue.
- Réinitialisation et nombre de résultats, sans modification des dossiers lors des recherches.

## Limites ouvertes

- L’API existante renvoie au maximum 300 actions récentes et applique les préférences de notification. Les deux vues ne constituent donc pas deux flux serveur indépendants ni un historique exhaustif.
- Filtre auteur/utilisateur absent : aucune identité n’est inventée côté interface.
- Notifications courriel, SMS et push non certifiées par ce lot.
- Le compteur représente les événements actuellement chargés, pas un total global exhaustif.
- Recette visuelle du nouveau build et recette multicomptes à faire sur une prévisualisation déployée.

## Validation

- Tests : dates UTC/Montréal en été et hiver, entrées invalides, filtres combinés, rattachement au projet, recherche par référence, ordre et regroupement, absence de mutation.
- TypeScript réussi. Suite globale actuelle : 92 tests réussis.
- Aucun transfert de données Billdr ni envoi de message réel.

Ce lot complète une partie du périmètre ; il ne certifie pas une parité totale prête à déployer.
