# Reprise de l’organisation et des parcours

Statuts : observé = écran consulté dans la référence ; vérifié = scénario exécuté dans MG Pro ; à vérifier = preuve encore manquante. Une observation ne certifie jamais le fonctionnement de MG Pro.

| Domaine | Observation actuelle | Vérifications restantes dans MG Pro |
|---|---|---|
| Navigation | Ordre des rubriques, menu latéral, outils supplémentaires | Recette visuelle desktop/mobile sur le nouveau build |
| Notifications | Deux vues, recherche, projet/utilisateur/type/date, lecture ; matrice détaillée par rôle/canal | Filtre auteur, événements complets et pagination ; canaux externes réels |
| Dépenses | Quatre familles, colonnes, filtres, détail dépense et facture fournisseur | Pièces jointes, ventilation, règles fiscales, rapprochement complet |
| Achats | Bons, factures fournisseur, paiements, crédits ; colonnes et agrégats propres | Chaque transition, réceptions, facture liée, crédit, paiement, exports |
| Fichiers | Racine/projets/dossiers, fil d’Ariane, protection des dossiers système, partage client | Opérations groupées, téléchargement réel, visibilité multirôle et gros fichiers |
| Gabarits | Soumissions et bibliothèque, catégories/taux, codes de coût/divisions, échéanciers, tâches/gabarits, produits, sélections | Hiérarchie, import/export et chaque formulaire détaillé |
| Équipe | Rôles, statut courant, notifications, assignation automatique, archives | Invitations et permissions multicomptes |
| Contacts | Quatre listes, cinq types de contact, recherche/import/export | Documents professionnels, doublons, archivage/restauration multirôle |
| Temps | Employé/catégorie/résumé, période, coût/facturable, approbation/export | Pointage, clôture, corrections, export et conversion sans double compte |
| Journal | Questions, photos, météo, commentaires, partage | Champs personnalisés de bout en bout, média, publication et droits |
| Calendrier | Projet/membre/type, mois et navigation ; calendrier des échéanciers | Fuseaux horaires, dates limites et toutes les sources |
| Courriels | Conversations par projet, statut, note interne, pièces et actions rapides | Envoi/réception réels, délivrabilité et isolation des notes |
| Réglages entreprise | Documents, fiscalité, assurance, transferts, semaine/congés | Persistance et effet de chaque réglage dans les documents/opérations |
| Marque | Documents et courriels, en-tête, couleur, affichages et signature | Aperçus/PDF réellement identiques aux réglages enregistrés |
| IA | Personnalité, contexte, style, clarification, accès aux données | Configuration effective et respect de chaque préférence |
| Courriels par défaut | Treize familles ouvertes, sujet/message/bouton/variables | Rendu, variables, envoi de test autorisé et envoi métier |
| Portail employés | Statuts visibles, codes autorisés et questions requises | Validation serveur et accès réel avec compte employé |
| Intégrations | Comptes et catégories de synchronisation visibles dans la référence | OAuth MG Pro, mapping, reprise des erreurs et anti-doublons |
| Projet — budget | Coûts/révisé/achats/main-d’œuvre, analyse revenus et profit | Contrôle complet des agrégats, avoirs, retenues, facturation progressive |
| Projet — échéancier | Liste/Gantt/calendrier, dépendances, jours ouvrés, groupes/jalons | Recette déplacements/dépendances/publication, historique et sauvegarde |
| Projet — tâches | Assignés, dates, statuts, fichiers/commentaires/sources, gabarit/PDF | Sous-tâches et chaque source d’import, permissions |
| Projet — sélections | Sections/groupes/produits/partage/décisions | Comparaison et décisions client, historique, conversion achats |
| Projet — rapports | Blocs budget, contrat, changements, factures/paiements, avancement, tâches client, photos | Snapshot, aperçu/PDF, envoi, consultation et immutabilité |
| Projet — soumissions/contrat/changements | Listes et un éditeur de changement observés | Parcours exhaustif édition/personnalisation/PDF/envoi/signature/refus/version |

## Changements locaux du lot

- Navigation directe et filtres des notifications (lot précédent).
- Aperçu devis basé sur la projection des prix de vente et le répartiteur de paiements communs (lot précédent).
- Dépenses reliées au grand livre fournisseur complet ; comptabilité conservée séparément.
- Filtre code de coût dans le grand livre.
- Navigation d’une écriture fournisseur vers sa famille dans le projet, avec mémorisation de l’onglet.
- Suivi global des achats accessible depuis Bons de commande, en conservant la saisie préexistante.

## Limites de livraison

La parité exhaustive et la recette de bout en bout ne sont pas terminées. Les actions d’envoi, signature, suppression, approbation et paiement ne sont pas exécutées dans le compte de référence pendant l’observation. Les 83 tests de référence passent ; cela ne constitue pas une recette de toutes les interfaces.

Publication bloquée par l’accès en lecture seule au dépôt et l’absence du projet cible dans la connexion de déploiement disponible. Aucun déploiement de ce lot ni aucune migration des données n’a été effectué. La migration est explicitement différée après installation et validation.

## Lot Routines — inspection et corrections du 23 octobre 2026

Exigence utilisateur : préserver tous les outils propres à MG Pro et leurs fonctions avancées ; reproduire en détail les parcours communs Billdr. Aucun outil existant retiré dans ce lot.

### Référence observée

- Page Bob / Routines : onglets Chat/Routines, gestion, recherche titre, tags multisélection, automatisation ON/OFF, nouvelle routine, favoris et catalogue. Colonne droite : filtre routine, rapports datés et statut Terminé / Automatisé.
- Carte : catégorie, titre, calendrier, dernière/prochaine exécution, bascule et menu Modifier / Dupliquer / Retirer des favoris.
- Formulaire : titre obligatoire, instructions riches obligatoires (gras, italique, souligné, liste), tags, automatisation désactivée initialement. Activation : fréquence quotidienne, hebdomadaire, mensuelle, trimestrielle ou annuelle ; jour ; heure ; notifications courriel/SMS ; personnes multisélection. Aucun enregistrement effectué dans Billdr.
- Catalogue : recherche titre, tags, créateurs, ajout aux favoris et cinq modèles observés : comptes clients/fournisseurs, résumé du journal de la semaine dernière, tâches en retard/du jour, pipeline de projets hebdomadaire et analyse du pipeline commercial.
- Rapport financier de référence : AR/AP/net, ventilation client/projet/fournisseur, HT/TTC, échéances/retards, périodes et priorités. Les commandes ne doivent pas devenir des charges en doublon dans MG Pro.
- Rapport chantier : avancement, retards/météo, sécurité, problèmes récurrents, matériaux non résolus, variations d’équipe/heures et actions par projet.
- Rapport tâches : inachevées échues et du jour, regroupement par projet, assigné, ancienneté, priorité au-delà de sept jours.
- Pipeline projets : indicateurs par statut, variations hebdomadaires, valeur incluant changements approuvés, dates et risques.
- Pipeline ventes : six tendances mensuelles sur six mois, gestionnaires, devis envoyés/signés, occasions et stagnation à 30/21 jours.
- Styles calculés observés : titre Routines Open Sans 24px/600 #111827 ; titre carte Open Sans 14px/600 ; contrôles 14px ; texte #191f2f, secondaire #868e9b ; action primaire #4959e4 sur blanc, rayon 8px. Relevé de cette page, pas validation globale ni mobile.

### Changements MG Pro

- Filtres combinés titre/tag/activation/favoris et réinitialisation.
- Catalogue des cinq rapports MG Pro existants, création sans activation automatique par défaut.
- Historique d’une ou de toutes les routines, tri décroissant, conservation des résultats existants.
- Heure 0 conservée à la normalisation ; valeurs invalides bornées.
- Échec de persistance : formulaire conservé avec erreur visible.
- Libellés corrigés : une tâche serveur quotidienne existe déjà, mais elle ne garantit pas l’heure hebdomadaire demandée. Aucune promesse de notification ou d’exécution précise ajoutée.

### Preuves et limites

85 tests réussis, TypeScript réussi, build production réussi après isolation d’un ancien cache Turbopack illisible. Aucun déploiement ni migration.

Toujours ouverts : éditeur riche/instructions personnalisées, fréquences complètes, fuseau explicite et exécution précise, notifications multi-destinataires, duplication, rapports détaillés ci-dessus, apparence identique et recette navigateur du nouveau code. Les cinq rapports calculés MG Pro ne sont pas équivalents aux cinq modèles IA Billdr. Les filtres de tags MG Pro sont simples, ceux observés dans Billdr sont multiples.

Accès revérifiés : GitHub tokkimi/mgpro expose push=false ; connexion Vercel new2026, aucun projet mgpro retourné. Les blocages de publication subsistent.
