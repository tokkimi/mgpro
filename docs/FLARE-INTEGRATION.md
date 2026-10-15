# Flare sur l'accueil MG Pro noir

Source de la demande : [21st.dev, Next.js Flare](https://21st.dev/community/bookmarks/components?preview=%2F%40vgpu%2Fcomponents%2Fnextjs-flare). Le moteur complet est celui de [VGPU Next.js Flare](https://vgpu.sh/examples/nextjs-flare), téléchargé depuis [sa source publiée](https://vgpu.sh/examples/nextjs-flare/source.md). Licence MIT Vercel conservée dans `components/ui/nextjs-flare-utils/LICENSE.txt`.

## Structure et intégration

- Composant : `components/ui/nextjs-flare.tsx`, export `Example` et export par défaut.
- Démonstration isolée de 640 px : `components/ui/nextjs-flare-demo.tsx`.
- Moteur et shaders : `components/ui/nextjs-flare-utils/`.
- Styles isolés : `components/ui/nextjs-flare.module.css`, présentation publique dans `app/theme-noir.css`.
- Emplacement actif : `components/brand-intro.tsx`, uniquement à l'arrivée sur une page publique du site noir.

Le projet dispose déjà de TypeScript, de l'alias `@/*` et de `components/ui`. Aucun provider ou gestionnaire d'état externe n'est nécessaire. Le seul état React supplémentaire indique que le premier rendu du canvas est visible. Le moteur est supprimé à la fin de l'accueil, toujours fixé à trois secondes ; les ressources, observateurs et animations sont libérés. La navigation interne ne relance pas l'accueil.

Le shader conserve les passes originales de contour, flou gaussien, bruit bleu et diffusion volumétrique à 48 étapes. Le glyphe Next.js est remplacé par le contour vectoriel du logo MG Pro ; la lumière est dorée. `public/images/logo-mgpro-flare.svg` est l'unique asset du moteur : aucune image de stock n'est requise. Les nouvelles images d'immersion restent séparées de cet effet.

`vgpu@0.6.0` est installé, avec `@vgpu/wgsl@0.6.0` en dépendance de développement pour préparer les shaders. `scripts/prepare-flare-shaders.mjs` produit les artefacts TypeScript depuis les quatre fichiers WGSL avec l'outil officiel `prepareShader`, sans configuration spéciale de Turbopack.

Le canvas occupe son parent et redimensionne son rendu avec lui. Un rendu Canvas 2D doré démarre immédiatement pendant l'initialisation WebGPU et reste actif si aucun adaptateur n'est disponible. Avec réduction des mouvements, les animations Flare ne démarrent pas et le logo statique reste visible. Le contenu du site reste masqué jusqu'à la fin des trois secondes.

Vérification : le moteur WebGPU original rend réellement avec Chrome/D3D11 (81 images observées sans erreur JavaScript), et le repli Canvas 2D a été contrôlé séparément aux formats 1440 et 390 px. Les animations s'arrêtent après la suppression de l'accueil. La durée réelle de l'accueil reste proche de trois secondes, sans répétition lors de la navigation interne. Les surfaces dashboard et connexion restent identiques à celles du site d'origine.

## Tailwind et shadcn

Le site existant utilise des styles CSS dédiés et ne dispose pas de Tailwind ou d'une configuration shadcn CLI. Le composant garde les classes utilitaires du code fourni et ajoute un CSS Module équivalent, ce qui permet une intégration fonctionnelle sans introduire de reset global sur l'admin. `components/ui` existe déjà : c'est le chemin attendu pour les composants réutilisables et les imports `@/components/ui/...`.

Pour activer Tailwind/shadcn ultérieurement dans ce dépôt :

1. Installer Tailwind avec `npm install -D tailwindcss @tailwindcss/postcss`.
2. Créer `postcss.config.mjs` avec `export default {plugins:{'@tailwindcss/postcss':{}}}`.
3. Ajouter `@import 'tailwindcss';` dans la feuille globale choisie, puis vérifier les changements dus au reset sur les vues existantes.
4. Exécuter `npx shadcn@latest init` et conserver les alias `@/components`, `@/components/ui`, `@/lib` ainsi que le fichier CSS du projet.

TypeScript est déjà installé et configuré ; aucune étape supplémentaire n'est requise pour ce composant. Ces commandes de migration CSS ne sont pas exécutées dans cette intégration.
