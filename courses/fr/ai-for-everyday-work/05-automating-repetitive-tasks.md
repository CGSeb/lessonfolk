---
id: ai-for-everyday-work/05-automating-repetitive-tasks
title: Automatiser les tâches répétitives
level: beginner
estimatedMinutes: 15
objectives:
  - Repérer les tâches qui valent la peine d’être confiées à l’IA
  - Transformer un bon prompt en modèle réutilisable
  - Connaître les moyens simples de gagner du temps sans code
prerequisites:
  - ai-for-everyday-work/04-brainstorming-and-decisions
---

## Key ideas
1. **Cherchez les tâches que vous faites souvent, de la même façon, avec du texte.** Points d’étape
   hebdomadaires, réponses à des questions similaires, notes de réunion, descriptions de produits,
   remise en forme d’informations : ce sont de bons candidats. Les tâches rares, floues ou à très forts
   enjeux n’en sont pas.
2. **Transformez votre meilleur prompt en modèle.** Quand un prompt fonctionne bien, enregistrez-le avec
   des blancs à remplir : « Rédige un point hebdomadaire pour [équipe] à partir de ces notes : [notes].
   Format : 3 sections, fait / à venir / bloqué, moins de 150 mots. » La fois suivante, vous n’avez qu’à
   remplir les blancs.
3. **Gardez une petite bibliothèque.** Rangez vos modèles là où vous pouvez les retrouver (une note, un
   document). Améliorez un modèle chaque fois qu’une réponse demande deux fois la même correction.
4. **Traitez les éléments similaires par lots.** Au lieu de dix demandes séparées, donnez dix éléments d’un
   coup avec un seul jeu d’instructions, par exemple « réécris chacun de ces noms de produits dans le même
   style ». Vérifiez le lot, car un élément peut être raté pendant que les autres sont bons.
5. **Utilisez ce que votre outil propose, avec prudence.** Certains assistants permettent d’enregistrer des
   instructions permanentes, des configurations réutilisables ou des tâches récurrentes. Cela peut faire
   gagner du temps, mais tout ce qui tourne sans que vous regardiez demande un contrôle de temps en temps.
   Construire de vraies automatisations qui relient des outils demande en général du code, ce qui est le
   sujet du cours Comment fonctionnent les applications d’IA.

## Teaching notes
- Analogie qui fonctionne : **une fiche de recette**. La première fois que vous cuisinez un plat, vous
  improvisez ; une fois qu’il réussit, vous notez la recette pour qu’il soit réussi à chaque fois, et vous
  ajustez la fiche quand vous l’améliorez.
- Démo : demandez à l’apprenant une tâche qu’il répète chaque semaine. Écrivez ensemble un premier prompt,
  lancez-le, corrigez un point, puis transformez-le en modèle avec des [blancs].
- Restez neutre quant aux outils : décrivez les fonctionnalités de façon générique (« instructions
  enregistrées », « tâches récurrentes ») et ne nommez jamais de produits ni ne dites quel outil a quelle
  fonctionnalité ; cela change vite.
- Idée reçue : « automatisation veut dire que l’IA le fait seule ». Ici cela veut dire moins de saisie et
  plus de cohérence ; la personne relit toujours le résultat, surtout ce qui est envoyé à d’autres.
- Idée reçue : « il faut coder pour gagner du temps avec l’IA ». Les modèles et le traitement par lots ne
  demandent aucun code et couvrent l’essentiel des répétitions du quotidien.
- Pour les apprenants techniques, mentionnez que l’étape suivante (API, scripts, outils connectés) se
  trouve dans Comment fonctionnent les applications d’IA, et gardez cette leçon sans code.

## Check your understanding
1. Lequel de ces cas est le meilleur candidat à un modèle d’IA réutilisable, et pourquoi : un point hebdomadaire d’équipe, des excuses ponctuelles à un client mécontent, ou la rédaction de la stratégie annuelle de votre entreprise ?
   Good answer: le point hebdomadaire d’équipe ; il est fréquent, suit la même forme et présente peu de risques, alors que les autres sont rares, sensibles ou à forts enjeux.
2. Qu’est-ce qui rend un modèle de prompt réutilisable ?
   Good answer: les instructions fixes (format, ton, longueur) sont écrites une fois, avec des blancs clairs pour les parties qui changent à chaque fois.
3. Vous traitez 15 descriptions de produits par lot dans une seule demande. Que devez-vous encore faire ?
   Good answer: vérifier chaque résultat, car un élément peut être faux ou hors style même quand les autres sont bons.

## Completion criteria
L’apprenant répond correctement aux vérifications et produit un modèle réutilisable avec des blancs pour une
tâche qu’il fait réellement.

## Going further
- Leçon suivante : tout rassembler dans votre propre routine d’IA.
- Comment fonctionnent les applications d’IA, pour des automatisations qui relient des outils par le code.
