---
id: how-ai-models-work/06-choosing-a-model
title: Choisir un modèle
level: intermediate
estimatedMinutes: 15
objectives:
  - Nommer les principaux compromis à considérer pour choisir un modèle
  - Expliquer la différence entre modèles à poids ouverts et modèles fermés, et entre usage local et usage dans le cloud
  - Comparer des modèles candidats sur vos propres exemples plutôt que sur les seuls classements
prerequisites:
  - how-ai-models-work/05-reasoning-models
---

## Key ideas
1. **Il n’y a pas de meilleur modèle, seulement un meilleur choix selon le besoin.** Les modèles
   diffèrent sur plusieurs plans à la fois : qualité sur votre type de tâche, rapidité, coût,
   quantité de texte qu’ils acceptent, gestion des images, de l’audio ou des outils, et
   destination de vos données. Améliorer un point en coûte souvent un autre.
2. **La taille est un compromis.** En général, les grands modèles sont plus capables, plus chers
   et plus lents ; les petits sont moins chers, plus rapides et souvent suffisants pour des
   tâches simples et bien définies comme trier des messages ou reformuler un texte. Prendre le
   plus gros modèle pour tout fait perdre du temps et de l’argent.
3. **Fermé ou à poids ouverts.** Avec un modèle *fermé*, vous l’utilisez via le service du
   fournisseur et vous ne pouvez ni le voir ni le conserver. Avec un modèle *à poids ouverts*,
   le fournisseur publie les nombres entraînés : chacun peut le télécharger, le faire tourner, l’adapter et le garder sur sa propre machine. « À poids ouverts » ne veut pas dire entièrement
   open source : les données d’entraînement et le code ne sont souvent pas partagés, et les
   licences varient, donc lisez les conditions.
4. **Local ou cloud.** Faire tourner un modèle sur votre ordinateur garde vos données chez vous
   et fonctionne hors ligne, mais demande du matériel capable et implique en général un modèle
   plus petit. Un service dans le cloud donne accès aux plus grands modèles, sans matériel à
   gérer, mais votre texte voyage jusqu’au fournisseur, donc ses conditions sur les données
   comptent (voir *Utiliser l’IA en toute sécurité et avec discernement*).
5. **Les classements sont un point de départ.** Les classements publics et les scores aident à
   dresser une présélection, mais ils mesurent des tâches générales, et les modèles sont parfois
   réglés pour eux. Le test fiable, c’est un petit ensemble d’exemples réels tirés de votre travail.
6. **Testez, puis retestez.** Passez les mêmes cinq à dix tâches réelles à deux ou trois
   candidats, jugez les réponses sur ce qui compte pour vous (juste, clair, sûr, rapide,
   abordable) et gardez des notes. Les modèles évoluent avec le temps sous un même nom : refaites
   la vérification quand quelque chose semble différent.

## Teaching notes
- Analogie : choisir un véhicule. Un camion, une voiture et un vélo ne se classent pas sur une
  seule échelle ; le meilleur dépend de la charge, de la distance et de la route.
- Démonstration : demandez à l’apprenant une tâche réelle qu’il fait et parcourez avec lui quel
  compromis compte le plus pour elle (le coût ? la confidentialité ? la qualité ?).
- Idée reçue : « à poids ouverts veut dire gratuit et privé ». Cela veut dire qu’on peut le
  faire tourner ; il faut quand même du matériel, et il peut être moins capable que les plus
  grands modèles fermés.
- Idée reçue : « le premier du classement est le meilleur pour moi ». Renvoyez à l’idée 5.
- Ne nommez ni ne classez aucun produit, ne donnez ni prix, ni tailles, ni dates de sortie : la
  leçon doit rester juste dans un an. Enseignez la méthode, pas une liste.
- Si l’apprenant n’est pas développeur, gardez l’exécution locale au niveau du concept ; ne lui
  demandez rien d’installer.
- Rythme : la question d’application est le cœur de la leçon, gardez-lui assez de temps.

## Check your understanding
1. Citez trois éléments, autres que la qualité brute, que vous compareriez entre deux modèles.
   Good answer: n’importe lesquels parmi rapidité, coût, quantité de texte acceptée, prise en
   charge des images ou des outils, destination des données, licence, besoins matériels.
2. Une entreprise veut classer chaque jour des milliers de courts messages de clients par sujet
   et doit garder ces messages sur ses propres serveurs. Que considéreriez-vous, et pourquoi ?
   Good answer: un modèle plus petit, moins cher et plus rapide suffit probablement pour une
   tâche simple ; un modèle à poids ouverts exécuté en local garde les données en interne ; le
   tester sur de vrais messages avant de décider.
3. Comment compareriez-vous deux assistants pour votre travail sans vous fier à un classement ?
   Good answer: choisir cinq à dix tâches réelles, les passer aux deux, juger selon ses propres
   critères (exactitude, clarté, rapidité, coût), noter les résultats et recommencer quand les
   choses changent.

## Completion criteria
L’apprenant peut nommer les principaux compromis, distinguer à poids ouverts et fermé, local et
cloud, et décrire un test simple sur ses propres exemples (vérifications 1-3).

## Going further
- La leçon « Gérer les erreurs, le coût et la latence » de *Construire avec l’IA* montre le coût
  et la rapidité du côté du développeur.
- *Les assistants de code IA en pratique* traite du travail avec les outils pour le code.
