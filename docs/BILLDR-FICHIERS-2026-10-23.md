# Fichiers — inspection Billdr et réalisation MG Pro

Source : interface connectée Billdr, `/files`, inspectée le 23 octobre 2026. Cible : dépôt `tokkimi/mgpro`, branche de base `codex/refonte-mgpro`. Aucun contenu de fichier client ni lien public Billdr n’est inclus dans ce relevé.

## Parcours effectivement observés

| Zone | Interface et comportement constatés |
| --- | --- |
| Racine | Titre Fichiers ; boutons Créer un dossier, Ajouter un fichier ; compteur de fichiers et dossiers ; fil d’Ariane Tous les fichiers ; dossier système Mes projets. |
| Liste | Case Tout sélectionner, case individuelle, Nom, Dernière mise à jour, Téléversé par, Type, menu de ligne. Trois boutons Trier après date, auteur, type. |
| Mes projets | Un dossier par projet, nommé avec référence et titre ; nombre de fichiers par projet ; métadonnées de dossier affichées par des tirets ; Type Dossier. |
| Projet | Neuf dossiers observés : Change orders, Construction report, Daily logs, Demandes de soumission, Expenses, Invoices, Purchase order, Quotes, Shared with client. Les libellés réels mélangent français et anglais. |
| Dossier | Compteur et fil d’Ariane actualisés ; lignes de fichiers ; vignette image ; contexte projet/dossier sous le nom ; date ; auteur ou Téléverseur inconnu ; extension JPG/PDF. |
| Nouveau dossier | Dialogue Créer un nouveau dossier ; champ Nom du dossier ; exemple Plans, Contrats… ; bouton Créer désactivé à vide ; Annuler et Fermer. Aucune création réelle faite pendant l’audit. |
| Ajout | Dialogue Ajouter des fichiers ; onglets Téléverser des fichiers et Parcourir les fichiers Billdr ; zone Déposez des fichiers ou cliquez pour téléverser ; compteur Aucun fichier sélectionné ; Annuler ; Ajouter désactivé sans sélection. Aucun téléversement réel effectué. |
| Parcourir l’existant | Recherche globale, fil d’Ariane Tous les fichiers et entrée Ouvrir Mes projets. La validation d’une copie/référence n’a pas été effectuée : sa sémantique exacte n’est pas affirmée. |
| Menu système | Partager, Télécharger ; Déplacer dans le dossier et Supprimer désactivés sur Mes projets. |
| Menu fichier | Partager, Télécharger, Déplacer dans le dossier, séparateur, Supprimer. |
| Déplacement | Dialogue Déplacer dans le dossier ; instruction Accédez au dossier de destination, puis cliquez sur Déplacer ici ; Annuler ; Déplacer ici désactivé pendant le chargement ; Fermer. Aucune modification de classement faite sur Billdr. |
| Aperçu image | Dialogue portant le nom du fichier ; taille, date de téléversement, auteur, référence FIL ; image ; boutons Télécharger, Partager, Déplacer, Supprimer, Fermer. |
| Partage public | L’ouverture du menu Partager sur Mes projets a immédiatement lancé Génération du lien public, puis affiché Générer un lien de public, Créer un lien visible par tous, Avec le lien, Copier le lien, Fermer. L’interface ne présentait pas de confirmation préalable. Aucun lien n’a été copié ni transmis ; l’aboutissement de cette génération n’a pas été vérifié. |

## Code livré

- `components/file-browser.tsx` : explorateur existant enrichi, boutons de création et ajout, dialogue de choix de projet, contrôle des noms et doublons, dossiers persistants dans les données projet, navigation, recherche, tri par les quatre colonnes, sélection simple/multiple, ZIP, déplacement individuel/groupé dans le projet, menus de dossiers, vignettes et ouverture des aperçus existants.
- `lib/files.ts` : classement des fichiers téléversés dans les dossiers personnalisés, conservation des IDs même si les noms sont identiques, dossiers système et virtuel Partagé avec le client ; exports PDF disponibles pour soumissions, factures, contrats ; tri immuable ; validation des noms.
- `components/media-outbox.tsx`, `app/api/documents/route.ts`, `components/workspace.tsx` : raccordement à la file IndexedDB existante et à l’API de téléversement ; le dossier choisi survit à l’attente hors connexion ; transfert interne par défaut, formats existants et limite 10 Mo conservés ; nom du téléverseur enregistré pour les nouveaux fichiers.
- `lib/file-share.ts`, `app/api/file-shares/route.ts`, `app/shared-files/[token]/page.tsx`, `components/shared-files.tsx` : liens publics explicites, page de téléchargement, création et révocation administrateur, journal d’audit.

### Partage MG Pro

Le dirigeant choisit un fichier, un dossier ou une sélection → dialogue affichant le nombre de fichiers publiés et la portée publique → Confirmer et générer le lien public → Copier le lien. Le lien contient un secret aléatoire de 256 bits ; seul son SHA-256 est conservé côté données. Expiration à sept jours. Le lien publie exactement les IDs choisis, sans inclure automatiquement les futurs ajouts. Les documents doivent appartenir au même projet. Les accès anonymes ne reçoivent ni chemin de stockage, ni données commerciales, ni données client. La page publique ne publie que nom, taille, format et date ; le téléchargement utilise une URL signée de 60 secondes. Les liens sont révocables dans Liens publics du projet. Un changement de version concurrent est refusé plutôt qu’écrasé. Les projets archivés et clients supprimés rendent le lien inutilisable.

Le partage dans l’espace client existant reste distinct et disponible. Un déplacement ne modifie pas la visibilité client. Les fichiers sont internes tant qu’un partage n’est pas demandé.

### Ajout MG Pro

Ajouter un fichier → sélectionner le projet si nécessaire → Téléverser des fichiers → choisir plusieurs fichiers → enregistrement dans la file locale existante → transfert vers l’API avec le dossier cible → ajout aux listes et aperçus existants. Les erreurs de transfert conservent les fichiers dans la file locale. Parcourir les fichiers MG Pro permet de reclasser des documents existants **du même projet**, sans dupliquer les octets ni les transférer entre clients.

## Écarts explicites et limites de cette livraison

- Cette livraison enrichit MG Pro et conserve ses cartes, aperçus, filtres, autorisations et fonctions métier. Elle ne prétend pas constituer une reproduction pixel pour pixel : les dossiers restent présentés avec les composants MG Pro.
- Création et téléversement restent rattachés à un projet. Pas de dossiers autonomes à la racine globale et pas de sous-dossiers personnalisés imbriqués dans cette livraison.
- Le sélecteur d’existant classe des documents du même projet. Il ne reproduit pas un éventuel mécanisme Billdr de copie entre projets, dont la validation n’a pas été testée.
- Les dossiers système ne se déplacent/suppriment pas. Les documents métier générés ne se déplacent/suppriment pas depuis cet explorateur. Contrats et Autres fichiers MG Pro sont conservés en plus des neuf dossiers observés.
- Bons de commande, demandes de prix, journaux, rapports et dépenses restent accessibles via leurs fiches métier ; tous ne disposent pas d’un export binaire dans cet explorateur. Un ZIP contenant un élément sans export est refusé explicitement, sans omission silencieuse.
- Les fichiers générés ne sont pas inclus dans les liens publics de ce module ; seuls les fichiers téléversés sont publiés. L’interface annonce leur nombre avant confirmation.
- Les anciens fichiers peuvent encore afficher l’identifiant du téléverseur, faute de nom enregistré dans leurs métadonnées historiques.
- Le parcours Billdr de suppression, les téléchargements complets et le résultat final d’un téléversement n’ont pas été exécutés sur les données réelles. Les formats/limites Billdr ne sont donc pas extrapolés.
- Aucune mutation de la base ou des secrets Vercel n’est requise par le code : données additionnelles stockées dans les champs JSON existants. Les variables Supabase existantes doivent être configurées dans l’environnement de déploiement.

## Vérification

Le module suit le parcours : explorateur → sauvegarde projet/API documents → stockage privé existant → retour des records → affichage. Le partage suit : confirmation dirigeant → API administrateur → snapshot des IDs et empreinte dans le projet → page publique → vérification du secret et de l’expiration → téléchargement signé.

- Vérification TypeScript et compilation de production réalisées.
- Suite de 86 tests passée, dont trois tests ajoutés pour dossiers personnalisés/homonymes/visibilité, tri stable et liens publics falsifiés/expirés/révoqués.
- La commande standard `tsx --test` ne pouvait pas créer son canal IPC dans cet environnement. La même suite est exécutée avec `node --import tsx --test tests/*.test.ts`.
- Absence de connexion locale à la base MG Pro : les transferts réels, la sauvegarde des liens et leurs téléchargements doivent encore être validés avec la base connectée avant une déclaration de fonctionnement en production.
