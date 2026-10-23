# Gabarits & coûts — audit Billdr et implémentation MG Pro

Source : interface connectée https://app.billdr.co/templates, inspectée le 23 octobre 2026. Périmètre : page sélectionnée Gabarits & coûts, pas les autres modules ouverts dans d'autres onglets.

## Observations et contrôles réellement effectués

| Sous-onglet | Interface observée / manipulation | État de vérification |
| --- | --- | --- |
| Gabarits Billdr | 17 cartes : image, titre, description, prix compact, nombre de catégories et tâches. Ouverture Nouvelle construction, puis Ouvrir tout. | Navigation et expansion testées ; détail des 329 tâches présent dans le DOM. Aucun contrôle d'exactitude des prix. |
| Mes soumissions | 12 cartes personnelles. Création : nom, description, Annuler, Confirmer désactivé si nom vide. | Formulaire ouvert puis annulé ; aucune création dans Billdr. |
| Mon catalogue | Recherche, catégorie, compteur 52 tâches, Supprimer tout, Importer, Exporter ; 50 lignes/page et navigation. Titre, quantité, unité, matériaux, main-d'œuvre, majoration, total, description, code de coût. | Recherche avec chaîne inexistante puis remise à vide ; champs observés. Import/export, sauvegarde et suppression non exécutés. |
| Mes catégories | Cases à cocher, nom éditable, code de coût sélectionnable, tarif horaire /heure. | Ouverture et lecture ; aucune modification du compte. |
| Codes de coût | Alerte comptes de revenus manquants ; recherche ; divisions, codes enfants ; réduction ; import CSV/QBO ; export ; sélection ; comptes dépenses et revenus QBO, remplissage auto et actualisation. | Lecture de l'écran et contrôles visibles ; pas de connexion ni synchronisation QBO. |
| Échéanciers Billdr | 9 cartes, description, jours et activités. Détail salle de bain : 25 activités, 51 jours ; Liste/Gantt/Calendrier ; lecture seule ; Partager ; Tout réduire ; dates, durée, assigné, prédécesseur, successeur, progression. | Carte ouverte et liste inspectée ; Gantt, Calendrier et Partager non exécutés. |
| Mes échéanciers | Un modèle personnel, jours et activités ; création avec nom obligatoire et description. | Formulaire ouvert et annulé. |
| Tâches | Deux niveaux Gabarits/Catalogue ; recherche ; création gabarit ; état vide explicatif. | Gabarits et formulaire de création inspectés ; Catalogue secondaire non inspecté. |
| Produits | Recherche ; importer ; exporter désactivé si vide ; filtres ; ajouter ; sélection ; colonnes ; état vide. | Filtres ouverts : marque, fournisseur, plage de prix, catégorie ; Appliquer testé sur liste vide. |
| Produits, fiche | URL, extraction, ajout manuel ; photos, fichiers ; nom obligatoire ; description ; coût privé ; vente client ; catégorie ; fournisseur ; SKU ; couleur/fini ; marque ; quantité/unité. | Ajout manuel ouvert puis annulé ; ni extraction ni upload ni sauvegarde exécutés. |
| Produits, colonnes | Nom, coût, vente, marque, catégorie, SKU, couleur/fini ; cases, Réinitialiser, Annuler, Sauvegarder. | Panneau ouvert ; aucune préférence enregistrée. |
| Sélections | Recherche groupes, filtre tag, ajouter groupe ; état vide. Formulaire : nom et description. | Formulaire ouvert et annulé ; aucun groupe créé. |

## Changements livrés dans ce commit

- Conservation des dix onglets et de la persistance existante dans les réglages MG Pro.
- Recherche élargie aux SKU, marques et fournisseurs ; filtre catégorie ; filtres produits cumulés marque, fournisseur et coûts min/max ; réinitialisation.
- Pagination de 50 éléments, compteur, début/précédent/suivant/fin.
- Sélection individuelle et de page, suppression groupée avec confirmation. Aucune suppression immédiate au clic de sélection.
- Choix des six colonnes secondaires dans les fiches produits ; nom conservé.
- Quantité de catalogue ; coût distinct matériaux/main-d'œuvre et majoration déjà présents, conservés ; quantité copiée au devis.
- Tarif horaire des catégories ; division parente et références comptes dépenses/revenus des codes de coût.
- Produits : fournisseur, URL HTTP(S), vente et inventaire, en plus de marque/SKU/finition existants.
- Édition détaillée des tâches de gabarits via l'éditeur MG Pro existant : catégories, quantité/unité, prix, code de coût, détails coûts/profit/notes, déplacement, duplication, suppression et annuler/rétablir.
- Aperçu soumission par catégories, tables coûts, totaux, ouvrir/réduire tout ; aperçu échéancier en liste sans modification.
- Tous les nouveaux champs sont conservés à l'export/import JSON existant, avec valeurs par défaut pour les anciens fichiers.

## Écarts qui empêchent de déclarer une reproduction à l'identique

1. Le catalogue de départ MG Pro comporte ses propres structures sans prix imposés. Les 17 gabarits Billdr, leurs images et milliers de tâches n'ont pas été importés. Les modèles personnels Billdr ne sont pas migrés.
2. Import/export JSON MG Pro conservé ; format CSV Billdr non analysé ni implémenté.
3. Comptes comptables enregistrés comme références ; aucune intégration QuickBooks, auto-remplissage ou actualisation distante.
4. Codes de coût : division parente enregistrée, mais pas encore de tableau hiérarchique équivalent avec création de codes enfants et réduction par division.
5. Produits : filtres intégrés, fiches/cartes existantes conservées ; pas encore de tableau identique, d'extraction URL, de photos/fichiers propres au produit, ni d'affectation à un fournisseur du répertoire.
6. Sélections : éditeur de lignes disponible ; modèle groupes/options/tags de Billdr non reproduit.
7. Tâches : séparation secondaire Gabarits/Catalogue non reproduite.
8. Aperçu échéancier : liste uniquement ; l'éditeur MG Pro conserve son Gantt et son calendrier, mais partage des échéanciers non reproduit dans ce lot.
9. Pas de validation visuelle pixel par pixel, mobile ou de parcours de sauvegarde dans le navigateur MG Pro dans cet environnement. Ne pas présenter la parité comme terminée.

## Validation locale

TypeScript, tests automatisés et build Next.js doivent être exécutés sur le commit livré. Les tests supplémentaires vérifient les filtres combinés, les bornes de coût, la compatibilité des anciennes quantités, l'export/import des nouveaux champs et le rejet des URL de script.
