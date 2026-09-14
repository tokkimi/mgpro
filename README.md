# Rénovations MG Pro

Site Next.js, espace dirigeant / équipe / client, Supabase Auth et stockage privé, génération PDF et connecteur courriel Resend.

## Exécution

`npm install`, puis `vercel env pull .env.local --yes` et `node scripts/migrate.mjs`. Démarrer avec `npm run dev`. Validation : `npm test` et `npm run build`.

Le site utilise les informations publiques et trois photos de renovationsmgpro.com, ainsi que le logo fourni par le propriétaire du projet. `/demo` contient exclusivement des exemples fictifs en mémoire. `/admin` exige une identité Supabase et un profil actif.

## Configuration

Variables : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY. Envoi : RESEND_API_KEY et MAIL_FROM, domaine expéditeur vérifié. NEXT_PUBLIC_SITE_URL doit correspondre au domaine déployé.

Les migrations créent des tables protégées sans accès direct depuis le navigateur. Les routes serveur vérifient l’identité, les rôles, les affectations et la visibilité des documents. Ne jamais exposer la clé de service.

Créer le dirigeant dans Supabase Auth puis un profil `admin` avec le même UUID. Les invitations suivantes sont disponibles dans Équipe & accès. Configurer les URLs de redirection Supabase pour `/auth/confirm` et le modèle d’invitation avec token_hash. Les clients voient uniquement leur dossier ; l’équipe uniquement les projets affectés. Les factures sont émises et payées par transactions SQL avec journal équilibré.

## Limites à connaître

Les envois externes nécessitent un fournisseur actif. Aucun envoi fictif n’est présenté comme réussi. La comptabilité couvre factures, paiements, dépenses, journal, balance et rapports ; paie, déclarations fiscales, rapprochement bancaire automatique et états financiers certifiés ne sont pas implémentés. Les dépenses doivent être comptabilisées dans le journal. Les photos sont ajoutées après le premier enregistrement de la visite. Les PDF intègrent JPEG/PNG, jusqu’à vingt photos. Aucun engagement de parité intégrale avec Buildr.
