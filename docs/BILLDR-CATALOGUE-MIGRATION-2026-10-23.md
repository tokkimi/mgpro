# Catalogue Billdr — lot du 23 octobre 2026

Le lot de données personnelles comprend 52 prestations du catalogue, 114 catégories et 114 codes de coût, importés dans les réglages existants. Les exports privés et les sauvegardes restent hors du dépôt et du déploiement.

Les coûts matériaux et main-d'œuvre, quantités (y compris zéro), majorations, unités, taux horaires, descriptions et champs source sont conservés. Le prix du matériel n'est pas additionné une seconde fois au coût du matériel. L'import est additif, rejouable sans doublon sur le même export et ne remplace pas les modifications locales. Chaque entrée conserve sa provenance et sa ligne source. La relecture des 280 entrées a confirmé leur égalité avec le plan ; les autres enregistrements sont inchangés.

Validation : 116 tests, vérification TypeScript. Les 12 gabarits personnels ont été collectés mais restent en contrôle des totaux par catégorie avant import. Les modèles partagés, échéanciers et autres données de projet restent à transférer. Les anciens brouillons ne sont pas supprimés avant rapprochement complet des données réelles.

## Espacements de l'administration

Ajout de marges internes sur la page projets, grille de filtres adaptable (4, 2 puis 1 colonne), bouton de filtres à sa largeur naturelle et sélection de page sur une ligne. Les panneaux de contenu ont une marge intérieure et les tableaux gardent leur défilement horizontal local. Les éléments accessibles masqués sont ancrés dans leur région de tableau pour éviter un débordement de page.

Validation dans le navigateur : navigation des 13 principaux modules, filtre de dates ouvert/fermé, marges calculées de 22 px, sélection en ligne et absence de débordement horizontal du document. Les parcours de visite, devis et dossiers sont conservés ; cette correction ne change que les styles de l'admin.
