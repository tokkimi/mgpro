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
