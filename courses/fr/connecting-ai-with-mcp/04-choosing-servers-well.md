---
id: connecting-ai-with-mcp/04-choosing-servers-well
title: Bien choisir ses serveurs
level: intermediate
estimatedMinutes: 15
objectives:
  - Décider quand une connexion vaut la peine et quand quelque chose de plus simple suffit
  - Expliquer pourquoi connecter beaucoup d’outils peut rendre un assistant moins bon
  - Appliquer le moindre privilège et des vérifications de qualité de base pour choisir un serveur
prerequisites:
  - connecting-ai-with-mcp/03-local-and-remote-servers
---

## Key ideas
1. **Partez du besoin, pas du catalogue.** Il existe beaucoup de serveurs, mais la question est de savoir ce dont vous
   avez besoin. Une tâche ponctuelle : collez le texte. Un document stable : joignez le fichier. Quelque chose que vous
   faites souvent, avec des données en direct ou de vraies actions : une connexion commence à valoir la peine. Une
   intégration native de votre outil peut être plus simple encore.
2. **Moins d’outils, c’est en général mieux.** Le nom et la description de chaque outil sont envoyés au modèle et
   prennent de la place dans la fenêtre de contexte, et une longue carte rend les mauvais choix plus probables.
   Connectez seulement ce dont la tâche a besoin et désactivez le reste. C’est la logique de budget d’*Ingénierie de
   contexte pour agents de longue durée*.
3. **Donnez le moins d’accès qui suffit.** Préférez les outils en lecture seule avant ceux qui modifient des choses,
   des autorisations étroites avant des larges, et un espace de test avant les vraies données. Pour toute action qui
   envoie, supprime, paie ou publie, gardez une étape d’approbation humaine.
4. **Jugez le serveur, pas seulement l’idée.** Regardez qui l’exploite ou le maintient, s’il est documenté et à jour,
   si les noms et descriptions de ses outils sont clairs, s’il propose un petit ensemble raisonnable d’outils, et
   comment il signale les erreurs. Un serveur officiel du service lui-même est en général un meilleur point de départ
   qu’un serveur tiers inconnu.
5. **Vérifiez qu’il fonctionne comme vous en avez besoin.** Essayez une poignée de demandes réalistes et regardez quel
   outil est choisi et si les résultats sont justes, avec les habitudes d’*Évaluer les réponses de l’IA*. Recommencez
   quand le serveur ou le modèle change.

## Teaching notes
- Analogie : une boîte à outils. Un petit ensemble bien choisi est plus rapide à utiliser qu’un garage plein de tous les
  outils jamais fabriqués, où l’on perd du temps à chercher et où l’on prend facilement le mauvais.
- Scénario à raisonner avec l’apprenant (rien à installer) : un responsable d’équipe a trouvé quinze serveurs qui
  semblent utiles et veut tous les connecter. Demandez ce qui pourrait mal tourner, quels deux il commencerait par
  connecter, et avec quel accès.
- Second scénario : trois façons de donner à un assistant le contenu d’une politique de 20 pages qui change rarement.
  Demandez laquelle ils choisiraient (coller, joindre, connecter) et pourquoi.
- Idée reçue : « plus il y a de connexions, plus l’assistant est capable ». Passé un certain point, elles ajoutent du
  bruit, du coût et du risque.
- Idée reçue : « populaire veut dire sûr ». La popularité aide, mais lisez quand même ce que le serveur peut faire.
- Ne nommez ni serveurs, ni catalogues, ni fournisseurs, ni nombres de serveurs disponibles.
- Débutants dans le cours : idées 1 à 3 avec le scénario de la politique. Apprenants expérimentés : discutez des
  vérifications de qualité et de la mesure des erreurs de choix d’outil.
- Rythme : terminez par le scénario des quinze serveurs, il rassemble les idées.

## Check your understanding
1. Pour chacun de ces cas, dites si vous colleriez, joindriez ou connecteriez : une politique qui change rarement, une
   question rapide sur un paragraphe, une file de tickets que vous consultez dix fois par jour.
   Good answer: joindre la politique, coller le paragraphe, connecter la file de tickets parce qu’elle est vivante,
   fréquente et peut impliquer des actions.
2. Donnez deux raisons pour lesquelles connecter quinze serveurs d’un coup pourrait rendre un assistant moins bon.
   Good answer: les descriptions d’outils consomment du contexte et coûtent, une longue carte rend les mauvais choix
   d’outil plus probables, et chaque serveur ajoute de l’accès et du risque.
3. Vous choisissez un serveur pour lire et mettre à jour des tâches. Citez trois choses que vous vérifieriez ou
   configureriez.
   Good answer: qui le maintient et s’il est documenté ; des descriptions d’outils claires ; lecture seule ou
   autorisations étroites d’abord avec approbation pour les modifications ; test avec des données sans importance.

## Completion criteria
L’apprenant peut décider entre coller, joindre et connecter, expliquer le coût d’un trop grand nombre d’outils, et
appliquer le moindre privilège et des vérifications de qualité à un choix (vérifications 1-3).

## Going further
- La leçon « Budgétiser la fenêtre de contexte » d’*Ingénierie de contexte pour agents de longue durée* explique
  pourquoi chaque description d’outil a un coût.
- *Évaluer les réponses de l’IA* montre comment tester qu’une connexion se comporte comme prévu.
