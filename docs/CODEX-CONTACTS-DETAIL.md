# MG Pro — Contacts : relevé détaillé et cahier de construction Codex

23 octobre 2026. Complément à CODEX-IMPLEMENTATION-COMPLETE.md. Préserver le MG Pro existant, son cockpit client, ses droits, ses archives restaurables et ses outils de détection des doublons. Les observations concernent Billdr ; les contrats proposés ci-dessous ne sont pas une prétention de reproduction déjà achevée.

## 1. Écrans observés

| Onglet | Volume visible au moment du relevé | Recherche et actions | Colonnes |
|---|---:|---|---|
| Clients | 1 850 | Ajouter ; import fichier ; export ; import QuickBooks ; recherche nom/courriel/entreprise ; sélection | Nom, courriel, téléphone, entreprise, projets associés, menu |
| Professionnels | 10 | Mêmes actions ; filtre métier ; sélection | Nom, courriel, téléphone, rôle/titre, entreprise, SSN/EIN/ITIN, documents, menu |
| Employés | 5 | Ajouter ; recherche nom ; sélection ; import QuickBooks | Nom, statut actuel, téléphone, emploi, notifications SMS et jours actifs, menu |
| Administrateurs | 1 | Ajouter | Nom, courriel, rôle, assignation automatique aux projets |

Volumes de la vue observée, pas un export certifié. Pagination clients 20 lignes avec début/précédent/pages/suivant/fin. Plusieurs noms/courriels apparaissent deux fois : ne pas conclure qu’il s’agit de personnes identiques ni fusionner automatiquement.

La sélection d’un professionnel fait apparaître « 1 sélectionné » et Supprimer. Aucune suppression exécutée. Les menus de ligne, tris et destinations des projets associés ne sont pas tous ouverts dans ce lot : à relever avant annonce de parité exhaustive.

## 2. Ajouter un contact — sélecteur de type

- Administrateur : tous projets et paramètres.
- Chargé de projet : projets assignés ; option verrouillée par abonnement Titanium dans le compte Billdr inspecté. MG Pro ne doit pas ajouter ce verrou commercial ; le rôle n’existe pas encore comme rôle distinct dans son modèle actuel.
- Client : tableau de bord client (soumissions, factures, changements, rapports, calendrier).
- Travailleur chantier : portail employés (tâches, heures, journaux, dépenses, fichiers).
- Sous-traitant/fournisseur/professionnel : fiche sans accès logiciel.
- Confirmer désactivé avant choix ; annuler sans création.

Dans MG Pro, conserver la distinction fiche / compte / invitation. La création d’un professionnel ne doit pas créer d’accès. La création d’un client ne doit pas envoyer implicitement une invitation.

## 3. Formulaire Client observé

| Champ | Comportement observé | Construction attendue |
|---|---|---|
| Nom complet | Obligatoire | Trim ; bornes ; erreur près du champ |
| Courriel | Obligatoire ; message requis | Validation serveur et frontend ; normalisation prudente |
| Entreprise | Facultatif | Champ distinct du nom de la personne |
| Téléphone | Champ dédié | Conserver saisie et forme normalisée pour recherche |
| Langue | Français sélectionné dans le cas ouvert | Liste réelle à relever ; valeur persistée utilisée dans documents/mails |
| Alias | Ajout d’un nom alternatif par bouton | Liste d’alias ; ajouter/retirer ; recherche incluant alias |
| Notes internes | Facultatif | Projection interne seulement ; jamais vers portail/PDF client par défaut |
| Adresse | Autocomplétion et saisie manuelle | Adresse structurée plus affichage, fallback sans géocodage |
| Facturation | Même adresse cochée initialement | Découplage explicite ; adresse séparée si décochée |

Saisie manuelle observée : adresse, complément (appartement/suite/unité), ville, province/État, code postal, pays et épinglage carte. Province désactivée avant pays dans le formulaire ouvert. Une deuxième autocomplétion et saisie manuelle apparaissent pour la facturation séparée.

Contrat proposé : tant que « même adresse » est vrai, l’édition de l’adresse principale suit la facturation ; en décochant, copier la valeur actuelle puis permettre une modification indépendante. Réafficher le choix sans perdre la dernière adresse séparée pendant la saisie. Politique de persistance à expliciter au serveur.

Aucune fiche client créée pendant cette inspection. Validation finale, alias multiples, langues disponibles et résultat d’épinglage restent à tester dans un contexte de recette.

## 4. Formulaire Professionnel observé

Nom obligatoire, courriel facultatif, téléphone, langue (English initialement dans ce cas), rôle métier, titre du poste, entreprise, SSN/EIN/ITIN, code de coût par défaut, adresse et documents.

Le choix métier contient notamment architecte, installateurs spécialisés, menuisiers, béton, démolition, designer, électricien, ingénieur, équipements, excavation, protection incendie, sols, charpente, HVAC, isolation, paysagement, géomètre, maçonnerie, ébénisterie, peinture, pavage, plâtre, plomberie, couverture, solaire, sous-traitant, fournisseur, carreleur, imperméabilisation, soudeur et autre. Le titre libre reste distinct du métier ; ne pas remplacer tout le formulaire par un seul champ « métier ».

### Documents professionnels

Ajouter une ligne fait apparaître : type/description, date d’expiration, joindre fichier et supprimer document. Plusieurs documents sont possibles selon l’action répétable ; la limite maximale n’a pas été vérifiée. Le texte annonce un email 30 jours avant expiration ; aucun rappel réel n’a été testé.

À construire : fichier privé lié à la fiche, type, expiration, état valide/expirant/expiré/sans date, téléchargement et historique ; suppression avec droits. Une description de fichier n’est pas une preuve de dépôt.

Identifiants fiscaux/personnels : ne pas recopier un SSN américain obligatoire pour une entreprise québécoise. Définir type/pays/valeur facultative, accès restreint et affichage masqué. Ces valeurs et documents ne doivent pas partir dans un export général, l’assistant ou le portail sans droit explicite.

## 5. Employés observés

- Statut « Quart terminé » dans les lignes consultées ; ce n’est pas un indicateur « en ligne ».
- Métier/emploi et téléphone ; switch SMS avec jours programmés.
- Nouveau membre : nom, rôle Travailleur chantier verrouillé, courriel, intitulé de poste, téléphone avec validation requise.
- Onglets Rappels SMS et Profils de taux.
- Profils de taux : type de projet actif (Général observé), taux de coût et taux facturé par heure. Lien vers réglages des types de projet.
- Rappels : activation globale et horaires de début/fin selon jour, heures AM/PM et minutes par incréments de cinq. Samedi/dimanche figurent aussi.
- Aucun compte créé, switch enregistré, profil tarifaire modifié ni SMS envoyé.

À construire en cohérence avec Mon équipe : une seule source de profil, pas deux comptes parce qu’une personne est visible dans Contacts et Équipe. Taux internes protégés des clients ; facturation selon taux figé au moment de la saisie/validation ; évolution d’un taux sans recalcul des écritures historiques.

Rappels : fuseau explicite Montréal, horaire traversant minuit, jours désactivés, changements d’heure, opt-out et échecs. Désactiver l’activation tant que fournisseur SMS et consentement opérationnel ne sont pas disponibles ; aucun switch factice « actif ».

## 6. Administrateurs observés

Nom, courriel, rôle propriétaire et bascule d’assignation automatique aux projets (activée pour le cas observé). Ajout ouvre « Inviter un administrateur », courriel et bouton Inviter. Aucune invitation envoyée.

À construire : invitation avec état en attente/acceptée/expirée/révoquée, destinataire normalisé, expiration, relance explicite et journal ; seule une autorité habilitée peut accorder l’administration. Ne pas déduire un rôle d’un champ de profil modifiable par l’utilisateur. Empêcher la perte du dernier propriétaire habilité. L’assignation automatique concerne les projets futurs selon un contrat à préciser, sans réaffectation rétroactive implicite.

## 7. Import/export observés et contrat de construction

### Import fichier Billdr

Fenêtre « Importez vos clients depuis un fichier » : modèle CSV à télécharger puis importer liste. Contraintes affichées : nom/email au maximum 255 caractères et aucun email en double dans le fichier. Modèle non téléchargé et contenu exact des colonnes non vérifié : ne pas inventer la compatibilité d’un fichier Billdr.

### MG Pro existant

- Quatre catégories alimentées par clients, `settings.directory` pour professionnels, profils pour employés/admins.
- CSV professionnels avec aperçu avant écriture, lignes invalides, doublons détectés et export protégé contre formules.
- Import borné à 2 000 lignes/2 Mo dans le code actuel ; limites distinctes de Billdr.
- Détection de doublons courriel/téléphone/nom+entreprise ; pas de fusion automatique.
- Archives et restauration, cockpit client et accès Équipe existants.

### Import clients à produire

1. Télécharger un modèle MG Pro versionné : nom, courriel, entreprise, téléphone, langue, alias, adresse et facturation selon schéma publié.
2. Charger fichier et déceler encodage/séparateur/colonnes ; mapping explicite pour format tiers.
3. Aperçu intégral des erreurs et doublons ; aucun envoi d’invitation dans ce parcours.
4. Résoudre colonnes inconnues/champs requis et choix d’ignorer lignes invalides explicitement.
5. Import par lot idempotent, journal de lot, compte exact créé/ignoré/échoué ; reprise sans doublons.
6. Contrôle doublons dans le fichier ET en base ; courriel partagé n’implique pas fusion automatique de dossiers.
7. Mode simulation, conservation de l’export source hors dépôt public, validation des caractères français et coordonnées internationales.

### Export à produire

Périmètre annoncé (onglet filtré / sélection / tous autorisés), colonnes définies, encodage UTF-8, protection formules. Zéro export de taux privés, identifiants sensibles, secrets d’invitation ou notes internes par défaut. Sélection paginée : clé stable par type+id, compteur des éléments retenus et confirmation du périmètre.

### QuickBooks

Bouton présent dans les vues clients/professionnels/employés inspectées ; parcours non déclenché. À construire uniquement après inspection du connecteur existant : OAuth, périmètre compte, mapping client/fournisseur/employé, identifiant externe stable, aperçu, anti-doublons, erreurs/reprise et révocation. La présence d’un bouton ne vaut pas intégration livrée.

## 8. Modèle proposé — non encore ajouté

Contact : id, type, nom, entreprise, emails/téléphones normalisés, langue, alias, rôle métier/titre, adresses structurées, facturation identique ou séparée, notes internes, archive, version.

Lien compte distinct : contactId/profileId, rôle d’accès, état invitation et appartenances projets. Professionnel sans compte par défaut. Documents : id, contactId, storageId, nom/MIME/taille/empreinte, type, expiration, droits, version. Rappels : documentId/offset/date avec unicité empêchant doubles envois.

Références externes : provider/accountId/externalId/contactId et lot de synchronisation. ImportBatch : source, empreinte, mapping, état, compteurs et erreurs par ligne. Proposer migration seulement après comparaison au modèle actuel ; aucun nouveau schéma appliqué dans ce lot.

## 9. Interface MG Pro à compléter

- Présentation quatre onglets avec compteurs fiables, barre Ajouter et actions adaptées à l’onglet.
- Table clients : entreprise ET nombre de projets, liens vers fiche et projets.
- Professionnels : rôle/titre séparés, entreprise, documents/expiration et filtre métier.
- Employés : statut quart issu du pointage, emploi et état réel des rappels ; conserver navigation Équipe.
- Admins : rôle et assignation automatique avec autorisation serveur.
- Fiche client/professionnel consultable puis édition ; conservation de la saisie après erreur/conflit.
- Sélection de page/individuelle, export de sélection ; opérations destructives explicites et récupération selon politique.
- Tri stable, recherche incluant alias/nom/entreprise/email/téléphone, pagination 20, aucun « 1 à 20 sur 0 ».
- Mobile, clavier, état chargé/vide/erreur/succès et préférences de liste.

## 10. Correction réalisée dans ce lot

`components/directory-centre.tsx` : la persistance renvoie désormais un succès/échec. Après échec, le formulaire professionnel et l’aperçu d’import restent ouverts ; les saisies ne sont plus abandonnées malgré l’erreur. Pas de changement de rôle ni de données de production.

TypeScript et cinq tests ciblés du répertoire réussis. Build de production réussi. Aucune recette navigateur du nouveau code, aucun déploiement, aucune migration. Les fonctionnalités des sections 4–9 sont spécifiées, pas toutes implémentées par ce correctif.

## 11. Recette Codex obligatoire

| Cas | Résultat attendu |
|---|---|
| Créer professionnel sans email | Autorisé si nom valide, aucun accès logiciel |
| Client sans email | Erreur selon contrat client, pas de demi-création |
| Alias + recherche | Contact retrouvé, alias persistés |
| Adresses identiques puis séparées | Bonne valeur dans fiche/PDF, aucune perte de saisie |
| Échec sauvegarde/import | Formulaire/aperçu restent ouverts, pas de succès fictif |
| Doublons intercatégories | Signalés, jamais fusionnés automatiquement |
| Import multiligne avec erreur | Compteurs et reprise exacts, pas d’invitation |
| Archive/restaure | Données et liens préservés ; portail selon droits existants |
| Document à J-30 / expiré | Un seul rappel autorisé ; dates/fuseau justes |
| Employé/admin vus dans Équipe | Même identité, aucun doublon de profil |
| Client tente API professionnelle | Refus serveur ; aucune note/taux privé |
| Invitation admin | Autorité vérifiée, état/expiration et audit |
| Export sélection hors page | Périmètre clair ; aucune formule ni données privées |
| SMS / QuickBooks non configurés | État indisponible honnête, aucun faux envoi |

## 12. Consigne à Codex

Lire ce dossier et AGENTS.md, puis comparer chaque exigence au code actuel. Implémenter les écarts par lots : formulaires et projections ; liste/sélection ; import clients/export ; documents/expiration ; identité/invitations ; intégrations externes. Conserver cockpit client, rapprochement des doublons et archives MG Pro. Réutiliser Équipe pour les comptes et droits. Tester persistance/rechargement, erreurs, concurrence, isolation multirôles et responsive. Fournir commits, captures du nouveau build et matrice réalisé/bloqué/restant. Ne pas envoyer d’invitations ou supprimer de vrais contacts lors de la recette sans instruction explicite.
