# Version publique noire indépendante

Projet Vercel : `mgpro-noir`. Branche : `codex/mgpro-noir`, à partir de `e3205c5`.

Seuls le thème public et le logo changent. `app/theme-noir.css` est chargé après les styles existants ; les sélecteurs restent limités à `.atelier-site`, son écran d'accueil et la bannière de cookies quand une page publique est présente. Aucun composant de gestion, formulaire métier, règle d'accès, contenu ou animation n'a été remplacé.

Le logo cerclé est une reconstruction vectorielle du modèle de la capture, disponible dans `public/images/logo-mgpro-noir.svg`. Le PNG transparent de 2560 px et les icônes sont produits par `scripts/prepare-noir-brand.mjs`. Il ne s'agit pas du fichier original du logo photographié. Les logos des écrans de gestion restent ceux du site d'origine.

L'environnement de production utilise les mêmes services existants pour garder les fonctionnalités ; aucun import de données ni changement de schéma n'est effectué. La tâche quotidienne Vercel reste uniquement sur le projet d'origine pour éviter deux exécutions. Le domaine de cette copie est défini dans sa configuration de production.

Vérification : compilation Next.js et TypeScript, contenu public comparé au site d'origine en français et anglais, formats 1440, 390 et 320 px, navigation mobile et formulaire de demande sans envoi. Les styles des vues de gestion dashboard, clients, devis et connexion ont été comparés : identiques. Les captures dashboard ont une différence visuelle nulle aux trois formats. Aucun courriel ou document réel n'a été envoyé pendant les tests.

Les surfaces publiques ont des reflets argentés plus lumineux, un éclat mobile et un reflet qui suit la souris. `NoirGlassMotion` ne modifie que des variables CSS sur les surfaces de `.atelier-site` ; aucun rendu React n'est déclenché par le pointeur. Les animations s'arrêtent hors du champ visible, dans un onglet masqué et selon la préférence de réduction des mouvements. Le carrousel « Du concret » reçoit une surcharge explicite de son ancien fond blanc pour rester lisible. Les galeries mobiles contiennent leurs reflets pour éviter tout débordement horizontal de la page.
