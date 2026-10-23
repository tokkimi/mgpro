# Mon équipe — audit Billdr et lot MG Pro

Audit du 23 octobre 2026, page connectée https://app.billdr.co/my-team. Aucune donnée réelle modifiée ; aucun SMS, courriel ou invitation envoyé. Les noms, coordonnées et heures réels des membres Billdr ne sont pas copiés dans le code.

## Parcours observés et manipulations

| Surface | Observation / contrôle effectué |
| --- | --- |
| Tableau | Compteurs gestion / travailleurs ; recherche ; nom, courriel, statut de quart, téléphone, rôle, emploi, notifications SMS, assignation automatique et menu par ligne. Défilement horizontal et pagination. |
| Recherche | Chaîne sans résultat saisie, état vide vérifié, recherche réinitialisée. |
| Rôles | Fenêtre ouverte puis fermée : propriétaire, administrateur, chargé de projet limité aux projets assignés, travailleur chantier. Le chargé de projet dépend du plan Titanium dans ce compte Billdr. |
| Ajouter | Sélection du rôle Travailleur chantier, puis Confirmer. Cela ouvre seulement la fiche ; aucun membre créé. |
| Fiche | Nom, rôle, courriel, poste, téléphone requis pour le travailleur ; onglets Rappels SMS et Profils de taux ; Annuler/Sauvegarder. |
| Taux | Profil Général avec taux de coût et taux facturé en $/h. Aucun taux modifié. |
| SMS | Onglet ouvert ; activation, sept jours sélectionnables ; heures de début et fin ; incréments de cinq minutes. Aucun SMS activé ni envoyé. |
| Menu membre | Menu ouvert : lien du portail par SMS, modifier, synchronisation QuickBooks, vue utilisateur, supprimer. Fiche Modifier ouverte puis annulée. |
| Archives | Section Restaurer ou exporter ouverte : nom, téléphone, emploi, date de suppression, action par ligne. Aucune restauration ni export Billdr exécuté. |
| QuickBooks / actions réelles | Boutons observés, sans import ni synchronisation, changement d'accès ou suppression. |

L'accès au navigateur est devenu indisponible après ces observations. Pas de validation ultérieure du rendu MG Pro dans le navigateur ni de tests visuels sur mobile.

## Implémentation du lot

- Nouveau composant `TeamCentre`, intégré à la rubrique existante Équipe & accès ; outils existants conservés.
- Tableau reprenant les colonnes utiles, compteurs, recherche nom/courriel/téléphone/poste, filtre de rôle et pagination par 50.
- Menu par membre : modifier, affectations/heures, export CSV, archivage avec confirmation.
- Nom modifiable dans `profiles` via API administrateur. Téléphone, poste, horaires, préférences SMS, profils de taux et assignation automatique dans `settings.team` ; aucune migration nécessaire.
- Sept jours et heures de début/fin, validation de format et d'ordre ; valeurs financières bornées et finies.
- Profils de taux par type de projet : le coût est choisi côté serveur lors de nouvelles soumissions de feuilles de temps, avec repli Général. Les anciennes heures gardent leur taux historique. Le taux facturé est conservé mais n'engendre pas de facture automatiquement.
- Affectations manuelles préservées. Assignation automatique pour les nouveaux projets uniquement, limitée aux travailleurs actifs ayant explicitement cette préférence. Une erreur d'affectation produit un avertissement ; elle ne transforme pas l'enregistrement du projet en échec caché.
- Archivage par désactivation du profil actif ; `identity()` refuse déjà ces profils. Restauration explicite ; historique et memberships préservés. Impossibilité de désactiver son propre compte.
- Export des heures du membre, avec projet/date/début/fin/heures/statut. Protection contre l'interprétation des cellules en formules dans Excel.
- API PATCH structurée et stricte : refus des chaînes de caractères à la place de booléens, des UUID invalides et des champs supplémentaires tentant de modifier les rôles.
- Les affectations de membres inactifs sont refusées par l'API ; les outils client existants demeurent dans la gestion de l'équipe.

## Limites explicites

- Pas de rôle chargé de projet ajouté : ses droits nécessitent un travail cohérent dans les API, la base et les interfaces. Aucun rôle existant n'est élargi pour imiter ce rôle.
- Pas de propriétaire immuable distinct : MG Pro conserve son modèle admin/worker/client et protège l'autodésactivation.
- SMS : horaires et préférences sauvegardables, service marqué non connecté ; pas de planification ou livraison SMS ni lien de portail par SMS.
- QuickBooks non connecté ; pas de bouton simulant un import ou une synchronisation.
- Invitation MG Pro existante conservée (nom, courriel, rôle, dossier client). Téléphone/poste/taux se renseignent après création dans Modifier le membre ; création d'un travailleur sans courriel non implémentée.
- Pas de simulation de session d'un autre membre.
- Pas de statut de quart « en cours » inventé : le pointage existant reste local jusqu'à soumission. Le tableau montre le dernier quart soumis, ou l'absence de quart.
- Les comptes clients restent visibles et filtrables, car leur gestion existait dans MG Pro.
- Archives : pas de date historique d'archivage dans les profils existants ; événement d'archivage/restauration ajouté à l'audit serveur.
- La modification du nom et des préférences utilise deux sauvegardes distinctes : si la seconde échoue, le nom peut déjà être enregistré ; erreur affichée, pas de succès global.
- Les horaires ne gèrent pas les quarts traversant minuit. Les taux ne recalculent pas les heures historiques ni la facturation.
- Aucun test sur la base réelle, aucun parcours d'envoi ni de permission réelle exécuté. Validation locale seulement ; la parité Billdr n'est pas complète.

## Vérification

TypeScript, suite complète de tests et build de production exécutés localement. Les tests du lot couvrent recherche/filtres/archives, assignation limitée aux travailleurs actifs, horaires invalides, coûts négatifs, schémas de mutations stricts, choix des taux et conservation des taux historiques, export limité à la personne et protection CSV. Les sorties finales sont fournies dans le dossier d'export avec le manifeste.
