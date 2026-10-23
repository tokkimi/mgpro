# Bons de commande : inspection et réalisation

## Règle de validation

Une commande observée dans Billdr, une fonctionnalité codée, un test automatique et une validation interactive MG Pro sont quatre états distincts. Ce relevé ne certifie pas la parité complète. Aucune donnée commerciale Billdr n'est incluse ici. La migration reste différée.

## Structure observée

En-tête et actions ; recherche, projet, fournisseur, période ; quatre indicateurs (valeur totale, facturé à ce jour, payé à ce jour, compte fournisseur) ; quatre onglets ; statut et export ; sélection, colonnes, tableau horizontal, totaux, pagination. L’onglet actif apparaît blanc sur une barre grise. La période initiale est trois mois.

| Outil | Inspection Billdr | Réalisation MG Pro de cette passe | Validation restante |
| --- | --- | --- | --- |
| Bons | Liste, colonnes et dialogue de choix du projet ; aucun bon affiché sur les périodes consultées | Vue dédiée, accès direct à l’éditeur, référence, description, projet/client, fournisseur, montants et avancement | Formulaire Billdr après confirmation du projet, édition d’un bon existant, comparaison visuelle interactive |
| Colonnes | Dialogue avec cases, réinitialiser, annuler et sauvegarder | Préférences distinctes du registre dépenses, choix de colonnes, colonnes financières supplémentaires | Piégeage du focus et préférences par sous-onglet |
| Recherche et filtres | Projet, fournisseur, huit périodes, statut | Recherche, filtres, période initiale trois mois, dates personnalisées, filtres supplémentaires conservés | Vérification interactive combinée et filtre spécifique d’échéance |
| Sélection/export | Commande d’export activée depuis liste vide ; fichier obtenu non vérifié | Sélection de page et lignes, export CSV filtré ou sélectionné, valeurs numériques et protection des formules | Télécharger et relire le CSV dans le navigateur |
| Tableau | Défilement, colonnes financières, totaux et pagination | Tri des colonnes, totaux filtrés, pagination de vingt lignes | Vérification mobile et parcours clavier |
| Facture fournisseur | Choix scanner/manuellement ; formulaire manuel ouvert et inspecté | Formulaire existant réutilisé depuis la vue globale, choix du projet | OCR, fichiers téléversés, ventilation sur plusieurs codes et plusieurs taxes détaillées ne sont pas reproduits dans cette passe |
| Paiement | Facture obligatoire, montant, référence, date, méthode, compte, note, fichier, brouillon/payé | Accès global au formulaire existant, note, contrôle du solde, état occupé et maintien du brouillon en cas d’erreur | Compte comptable, pièce spécifique, statut brouillon et test interactif de persistance |
| Crédit | Crédit/remboursement, taxes, projet, fournisseur, date, référence, description, coût, pièce | Accès global au crédit existant et contrôles existants conservés | Remboursement fournisseur distinct et pièce spécifique |
| Réception | Pas de bon source existant accessible dans la liste consultée | Réceptions MG Pro conservées ; contrôle quantité reçue et indicateur dérivé | Essai interactif dans un projet de démonstration |
| Intégrité | Sans modification commerciale de la source pendant cette passe | Empêche annulation d’un bon facturé ou changement de fournisseur incohérent ; contrôle dates et lignes | Contrôles serveur équivalents à auditer séparément |
| Courriel/scanner/QuickBooks | Présents dans le parcours Billdr | Aucun faux raccordement ajouté ; outils MG Pro existants conservés | Intégrations à connecter et tester |

## Conventions financières MG Pro préservées

Les indicateurs de reconnaissance excluent les brouillons et annulations. Le montant payé vient des paiements émis ; les crédits appliqués réduisent le compte fournisseur sans être présentés comme du cash payé. Le non-facturé du bon reste hors taxes, tandis que facturé, payé et compte fournisseur sont taxes incluses. L’avancement mesure la réception physique valorisée, pas la proportion payée. La date actuelle d’un bon est sa livraison requise : elle ne doit pas être présentée comme une date d’émission. Les dates d’ouverture et les identifiants séquentiels Billdr ne sont pas inventés.

Les filtres de période des indicateurs portent sur la date de chaque famille ; le solde d’une facture sélectionnée tient compte de ses règlements liés. Il ne s’agit pas d’un état comptable historique arrêté à une date.

## Vérifications et accès

Tests des achats : réponses, attribution, réception partielle, facturation, crédit, paiement, absence de double comptage et protection des liens. Tests supplémentaires pour les chiffres du registre, les dates invalides et l’annulation des bons facturés. TypeScript et build de production vérifiés pendant la passe ; voir résultat final de l’exécution pour la version exacte.

La validation interactive du code modifié et le déploiement restent à faire. Les accès précédemment vérifiés ne permettent pas l’écriture GitHub ni le déploiement sur le projet Vercel MG Pro. Un commit local ne signifie pas une publication GitHub.
