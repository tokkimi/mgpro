# Hero au scroll et réalisations 3D

Le hero utilise les 50 images fournies dans `renovation_scroll_mesures_materiaux_50_images (1).zip`. Les doublons sont référencés dans `content/hero-renovation.json` : 46 images distinctes en WebP, chacune en largeur 1280 px et 800 px. Les deux variantes totalisent environ 7,4 Mo. Les originaux du ZIP restent inchangés.

Pour préparer une nouvelle séquence après extraction :

```powershell
node scripts/prepare-hero-sequence.mjs <dossier-des-images>
```

`components/renovation-hero.tsx` dessine la séquence sur canvas avec le cadrage CSS de la photo actuelle. Une zone sticky utilise 280 hauteurs de viewport sur ordinateur et 240 sur téléphone pour la progression. Aucun événement de molette ou de défilement n'est bloqué : le hero reste visuellement fixe dans cette zone et se libère à la fin. Le défilement vers le haut rejoue la séquence à l'envers.

Le texte apparaît entre 28 % et 86 %, les actions entre 60 % et 95 %. À la fin, la photo originale du hero prend le relais avec le même cadrage. Les préférences de réduction des animations et un échec du chargement de la première image affichent directement le hero final sans zone de défilement prolongée.

`components/ui/3-d-coverflow-carousel.tsx` reprend la scène en perspective 1400 px, les angles 24°/38°, les échelles 0,84/0,68 et les transitions du prompt fourni. L'adaptation remplace le fond sombre et les accents dorés par le blanc et le verre argenté de MG Pro. Aucun séparateur de section n'est ajouté. Les quatre catégories et toutes leurs photos restent disponibles via les commandes de photos et l'agrandissement.

Le défilement automatique du carrousel se suspend hors écran, lorsque l'onglet est masqué, au survol, au focus et après une action manuelle. La navigation fonctionne avec les flèches, les points, le clavier et le glissement tactile. La réduction des animations désactive le défilement automatique.

Vérification : compilation Next.js et TypeScript ; navigateur aux formats 1440 × 1000, 390 × 844 et 320 × 667 ; immobilité du hero, progression des images et du contenu, reprise du défilement ; quatre catégories, photos, agrandissement, clavier et glissement ; préférence de réduction des animations et erreur réseau simulée.
