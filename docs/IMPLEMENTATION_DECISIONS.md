# Décisions d’implémentation MG Pro — 8 octobre 2026

## Références et limites de preuve

Les deux documents fournis sont des références fonctionnelles, pas une autorisation de modifier Billdr ou d’envoyer des communications. Leur distinction T (testé), O (observé), N (non vérifié) et H (proposition) est conservée. Un contrôle T chez Billdr ne prouve pas un parcours équivalent MG Pro. Les propositions de schéma, de routes et de design sont adaptées à l’architecture existante.

- `BILLDR_FUNCTIONAL_UX_MAP.md` — SHA-256 `8e0002db6171eff9a2f8a0bed5d039e1ec1ea55cf47aa931fb844362ca3ee9da`.
- `MASTER_DEVELOPMENT_PROMPT.md` — SHA-256 `811f745f9f26e4f4007458b6a249632739dbf920dac7a188fc73fad520db3525`.

## Décisions

- Conserver le blanc et le vert MG Pro, les visites, notes vocales, carnets manuscrits et plans 2D/3D existants. Ne pas remplacer l’application par une démo générique.
- Regrouper les rubriques secondaires dans « Plus » ; conserver les quinze domaines projet et les compléments MG Pro. Ne montrer que les panneaux de la rubrique choisie.
- Les dix rubriques du catalogue utilisent les réglages existants. Les documents reçoivent une copie indépendante du gabarit ; les notes privées ne sont pas propagées lors de la réutilisation.
- Les demandes de prix, achats et heures restent rattachés au projet. L’attribution crée atomiquement un bon brouillon dans le même enregistrement projet. Un bon brouillon n’engage pas le budget. Les statuts fournisseur sont un suivi manuel ; enregistrer ne signifie pas envoyer.
- Les échéanciers se sauvegardent explicitement. Le recalcul des dépendances modifie le brouillon. Bloquer les cycles ; ne pas inventer de dates ou de prix dans les structures de départ.
- Les prix client sont des prix de vente. Masquer les coûts, notes et totaux internes côté serveur, pas uniquement dans le CSS. Les projections client conservent les montants et taxes calculés avec le moteur central.
- Les sélections et rapports sont publiés explicitement. Le choix client est autorisé et versionné côté serveur ; ce choix ne modifie pas automatiquement un contrat signé.
- Les notifications proviennent des événements autorisés ; les lectures sont propres à l’utilisateur. Ne jamais retourner les contenus avant/après de l’audit aux clients.
- Garder les versions optimistes et les erreurs visibles. Ne pas créer de document lors d’un simple clic d’ouverture.
- Tester avec les données fictives du mode démonstration. Ne migrer ni effacer de données Billdr pendant cette livraison.
- Conserver dans toute passation les incidents décrits dans la cartographie : création involontaire du journal DL-0043 et d’une tâche vide lors de l’audit Billdr. Aucune suppression corrective n’a été effectuée dans Billdr.

## Validations de ce lot

43 tests automatisés réussis : calculs décimaux, projection des prix client, notes par rôle, signatures, partage, restauration client, exports comptables, PDF long, catalogue indépendant, engagements fournisseur, jours ouvrés, dépendances et cycles. Compilation Next réussie.

Contrôles navigateur sur données fictives : création d’un produit à 150 $ de matériaux + 300 $ de main-d’œuvre, reprise en devis à 450 $ avant taxes / 517,39 $ TTC ; demande de prix avec réponse de 500 $ puis attribution en bon brouillon ; gabarit d’échéancier, recalcul, enregistrement et Gantt ; catalogue et devis à 390/320 px. Ces contrôles ne prouvent pas une recette exhaustive des comptes réels ni des 17 parcours du prompt.

## Limites à ne pas masquer

La parité exhaustive n’est pas terminée. Voir BILLDR_COVERAGE_2026-10-08.md pour chaque domaine. Les crédits et paiements fournisseur, la carte géographique des projets, le répertoire professionnel unifié, les dix écrans de réglages et leurs sous-options, les routines IA, les integrations et les volumes réels restent à compléter ou à recetter.

L’envoi réel et l’IA nécessitent leur configuration serveur (service de courriel, expéditeur et clé IA). Le carnet manuscrit permet dessin et PDF, mais ne réalise pas une reconnaissance manuscrite ni une conversion automatique en plan 2D. Les données de démonstration sont temporaires. Aucun courriel réel n’a été envoyé pendant cette recette.
