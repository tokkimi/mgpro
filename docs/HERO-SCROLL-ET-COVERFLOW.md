# Hero au scroll et réalisations 3D

Le hero utilise les 50 images fournies dans `renovation_vetuste_50_images.zip`. Les doublons sont référencés dans `content/hero-renovation.json` : les images distinctes en WebP, chacune en largeur 1280 px et 800 px. Les deux variantes sont optimisées pour le Web. Le dossier v2 évite le cache de la précédente séquence. Les originaux du ZIP restent inchangés.

Pour préparer une nouvelle séquence après extraction :

```powershell
node scripts/prepare-hero-sequence.mjs <dossier-des-images>
```

`components/renovation-hero.tsx` dessine la séquence sur canvas avec le cadrage CSS de la photo actuelle. Une zone sticky utilise 280 hauteurs de viewport sur ordinateur et 240 sur téléphone pour la progression. Aucun événement de molette ou de défilement n'est bloqué : le hero reste visuellement fixe dans cette zone et se libère à la fin. Le défilement vers le haut rejoue la séquence à l'envers.

Le texte apparaît entre 28 % et 86 %, les actions entre 60 % et 95 %. À la fin, la photo originale du hero prend le relais avec le même cadrage. Les préférences de réduction des animations et un échec du chargement de la première image affichent directement le hero final sans zone de défilement prolongée.

`components/ui/3-d-coverflow-carousel.tsx` reprend la scène en perspective 1400 px, l'angle 24°, l'échelle 0,84 et les transitions du prompt fourni. Selon la correction demandée, seules la carte centrale et ses deux voisines restent visibles, sur ordinateur et mobile. La quatrième catégorie reste accessible par la navigation. L'adaptation remplace le fond sombre et les accents dorés par le blanc et le verre argenté de MG Pro. Aucun séparateur de section n'est ajouté. Les quatre catégories et toutes leurs photos restent disponibles via les commandes de photos et l'agrandissement.

Le carrousel avance toutes les secondes. Le défilement automatique se suspend hors écran, lorsque l'onglet est masqué, au survol, au focus et après une action manuelle. Un clic explicite sur Lecture reprend immédiatement le défilement, même si le focus ou le pointeur reste sur le bouton. L'agrandissement se fait en cliquant sur la photo ou son icône ; le bouton supplémentaire « Voir la photo » a été retiré. La navigation fonctionne avec les flèches, les points, le clavier et le glissement tactile. La réduction des animations désactive le défilement automatique.

Vérification : compilation Next.js et TypeScript ; navigateur aux formats 1440 × 1000, 390 × 844 et 320 × 667 ; immobilité du hero, progression des images et du contenu, reprise du défilement ; quatre catégories, photos, agrandissement, clavier et glissement ; préférence de réduction des animations et erreur réseau simulée.
