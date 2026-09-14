# Rénovations MG Pro

Site Next.js, espace dirigeant / équipe / client, Supabase Auth et stockage privé, génération PDF et connecteur courriel Resend.

## Exécution

`npm install`, puis `vercel env pull .env.local --yes` et `node scripts/migrate.mjs`. Démarrer avec `npm run dev`. Validation : `npm test` et `npm run build`.

Le site utilise les informations publiques et les photographies et les textes des pages de services et des galeries de renovationsmgpro.com, ainsi que le logo fourni par le propriétaire du projet. `/demo` contient exclusivement des exemples fictifs en mémoire. `/admin` exige une identité Supabase et un profil actif.

## Configuration

Variables : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY. Envoi : RESEND_API_KEY et MAIL_FROM, domaine expéditeur vérifié. NEXT_PUBLIC_SITE_URL doit correspondre au domaine déployé.

Les migrations créent des tables protégées sans accès direct depuis le navigateur. Les routes serveur vérifient l’identité, les rôles, les affectations et la visibilité des documents. Ne jamais exposer la clé de service.

Créer le dirigeant dans Supabase Auth puis un profil `admin` avec le même UUID. Les invitations suivantes sont disponibles dans Équipe & accès. Configurer les URLs de redirection Supabase pour `/auth/confirm` et le modèle d’invitation avec token_hash. Les clients voient uniquement leur dossier ; l’équipe uniquement les projets affectés. Les factures sont émises et payées par transactions SQL avec journal équilibré.

## Limites à connaître

Les envois externes nécessitent un fournisseur actif. Aucun envoi fictif n’est présenté comme réussi. La comptabilité couvre factures, paiements, dépenses, journal, balance et rapports ; paie, déclarations fiscales, rapprochement bancaire automatique et états financiers certifiés ne sont pas implémentés. Les dépenses et règlements fournisseurs se comptabilisent depuis leur dossier. Les visites peuvent recevoir des photos sans quitter le formulaire ; le brouillon est enregistré avant le téléversement. Les PDF intègrent JPEG/PNG, jusqu’à vingt photos. Aucun engagement de parité intégrale avec Buildr.

## Refonte éditoriale

Les contenus sources sont conservés dans `content/original.json`. Le site comprend huit expertises, les six étapes de l’approche sur l’accueil, trente et une photographies de réalisations réparties dans les quatre catégories d’origine, le lien Financeit original et les redirections des anciennes pages PHP. Le contrôle `node scripts/smoke.mjs` vérifie la connexion, une demande, un devis et son PDF, puis supprime uniquement ses données temporaires.

Envoi de courriels et création Resend mis en attente à la demande du propriétaire pendant la phase de maquette. Aucun abonnement supplémentaire créé.
