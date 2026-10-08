# Vérification du 8 octobre 2026

Base : `ec3b01f`, branche Claude récupérée en avance rapide sur `codex/refonte-mgpro`. Aucun ajout existant supprimé. Référence Follow My Future : dépôt VIEWMYWORK, commit `ee5b8d8`.

## Corrections de cette livraison

- Un seul dialogue pour actions rapides et menu complet ; toutes les rubriques autorisées sont regroupées en cases, avec recherche. Le passage « Plus → Menu complet » conserve la même fenêtre.
- Ordinateur : navigation principale compacte et bouton Tous les outils ouvrant la grille. Suppression du menu extensible coupé en bas.
- Mobile : aucune barre latérale. Défilement du dialogue et de la navigation ordinateur sans barre grise ; fermeture clavier et confinement du focus natifs. Le menu ne déclenche pas le clavier mobile automatiquement.
- Accès identique pour facture publique HTML et PDF : refus si client supprimé, projet inaccessible au client, facture brouillon, annulée ou supprimée.
- Liens de paiement HTTPS sans identifiants intégrés ; visibles dans le portail client, jamais transmis aux prestataires. Le paiement externe ne marque pas la facture payée.
- Santé : marge calculée avant taxes et contrats prestataires exclus des revenus et attentes client. Les blocages futurs ne sont pas comptés comme blocages de la semaine.
- Adresse MG Pro : `mg@renovationsmgpro.com` dans les valeurs par défaut, démonstration et pages publiques ; expéditeur et réponse configurés dans Vercel.
- Next.js 16.3.8, sharp 0.35.5 et source-map-js mis à jour ; audit npm sans vulnérabilité au moment du contrôle.

## Outils déjà présents dans la base Claude

Assistant et routines, quatre familles de coûts fournisseur, neuf dossiers système, création de contacts par type, URL par vue, Gantt interactif, pointage et clôture des feuilles de temps, santé des projets, décisions clients, espace client par projet, liens de facture, rappels et barre mobile à cinq accès. Leur présence ne constitue pas une recette exhaustive de tous les scénarios réels.

## Configuration externe et limites restantes

- Resend : clé stockée uniquement dans les variables sensibles Vercel. Domaine `renovationsmgpro.com` ajouté et vérification demandée ; DNS DKIM/SPF absents, état en attente. `MAIL_DOMAIN_VERIFIED=false` empêche tout faux envoi. DNS hébergés chez CrocWeb. Instructions remises séparément, sans clé API.
- Site : domaine existant `mgpro-ten.vercel.app`, projet Vercel `mgpro`. Adresse publique et secret Cron configurés.
- IA : clé Anthropic non fournie, repli local annoncé. Reconnaissance manuscrite et génération de plan 2D automatique non implémentées ; le carnet permet dessin et export PDF.
- SMS, push, QuickBooks, Zapier et synchronisation bancaire/paiement ne sont pas connectés. Aucun compte tiers ni paiement présenté comme actif.
- Migration Billdr non effectuée. Recette avec deux vrais clients et deux prestataires, installation sur appareils physiques et comparaison exhaustive de chaque bouton Billdr restent à réaliser.
- Follow My Future : adaptation des outils de suivi et facturation, pas reprise de Stripe Connect, de ses webhooks ni de l’ensemble de son moteur d’envoi.

## Validation

82 tests automatisés réussis ; compilation production et TypeScript réussis. Contrôle visuel du menu à 320×640, 390×844 et 1280×720 : un dialogue, accès au dernier outil, aucune largeur de page supérieure à l’écran, aucune barre latérale mobile. Aucun courriel client réel envoyé pendant ces tests.

Vercel : inventaire des deux pages de projets du compte ; un seul projet MG Pro identifié. Les autres projets appartiennent à d’autres sites et sont conservés. Les URL uniques de déploiement du même projet constituent son historique, pas des doublons de projet à supprimer.
