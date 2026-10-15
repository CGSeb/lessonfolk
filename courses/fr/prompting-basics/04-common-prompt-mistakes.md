---
id: prompting-basics/04-common-prompt-mistakes
title: Les erreurs de prompt courantes
level: beginner
estimatedMinutes: 15
objectives:
  - Reconnaître les erreurs de prompt les plus courantes
  - Réécrire un prompt défectueux pour les corriger
prerequisites:
  - prompting-basics/03-iterating-on-a-bad-answer
---

## Key ideas
1. **Trop vague, ou contexte supposé partagé.** « Corrige ça », « améliore-le », « le format habituel » :
   l’assistant ne sait pas ce que « ça », « mieux » ou « habituel » signifient pour vous. Nommez la chose,
   le problème et le résultat voulu.
2. **Trop de tâches à la fois.** « Résume ce rapport, traduis-le, écris trois tweets et un plan de
   diapositives » d’un seul coup donne souvent chaque partie à moitié réussie. Découpez les gros travaux
   en étapes, un prompt par étape, et vérifiez chaque résultat avant de passer à la suite.
3. **Les questions orientées.** « N’est-il pas vrai que mon idée d’entreprise est géniale ? » invite
   l’assistant à vous donner raison, car un texte complaisant est une réponse probable. Posez plutôt des
   questions neutres : « Quels sont les points forts et les points faibles de cette idée ? »
4. **Les consignes contradictoires.** « Sois très détaillé mais reste bref » ou « formel mais décontracté »
   force l’assistant à choisir, et vous ne pouvez pas prévoir quoi. Relisez votre prompt et décidez de ce
   qui compte le plus.
5. **Partager ce qu’il ne faut pas.** Il est tentant de tout coller pour le contexte, mais mots de passe,
   données personnelles d’autres personnes ou documents de travail confidentiels doivent rester dehors,
   sauf si vous savez comment l’outil les traite. Remplacez-les par des marqueurs ou retirez-les.

## Teaching notes
- Format qui fonctionne : montrez un court « mauvais prompt » pour chaque erreur, demandez à l’apprenant ce
  qui ne va pas, puis laissez-le le réécrire avant de montrer votre version. Les apprenants retiennent les
  erreurs qu’ils ont repérées eux-mêmes.
- Analogie pour l’erreur 3 : **demander à un ami qui déteste contredire**. Si vous demandez « ça a l’air
  super, non ? », vous entendrez « oui ». Demandez « qu’est-ce que tu changerais ? » pour avoir un vrai avis.
- Idée reçue : « l’IA me dira si ma question est biaisée ». Parfois elle objecte, mais souvent elle suit la
  formulation. C’est à l’apprenant de poser ses questions de façon neutre.
- L’erreur 5 n’est qu’un court rappel pratique ; n’en faites pas un cours sur la vie privée. Si l’apprenant
  en veut plus, renvoyez au cours Utiliser l’IA en toute sécurité et avec discernement (sa leçon sur la vie privée).
- Faites le lien avec les leçons 1 à 3 : l’erreur 1 relève de la leçon 1 (contexte, objectif, public),
  l’erreur 2 reprend l’idée d’étapes et de retours de la leçon 3.
- Rythme : cette leçon est surtout de la pratique. Limitez les explications à une phrase ou deux par erreur.

## Check your understanding
1. Qu’est-ce qui ne va pas dans « Le télétravail n’est-il pas clairement mieux pour tout le monde ? », et comment le réécririez-vous ?
   Good answer: c’est une question orientée qui invite à approuver ; une version neutre demande les avantages et inconvénients ou les preuves des deux côtés.
2. Un ami demande à un assistant de « résumer ce rapport de 30 pages, écrire un communiqué de presse et rédiger cinq publications pour les réseaux sociaux » dans un seul prompt, et obtient de mauvais résultats. Que lui conseilleriez-vous ?
   Good answer: le découper en étapes (d’abord le résumé, le vérifier, puis le communiqué à partir du résumé, puis les publications), un prompt par tâche.
3. Avant de coller un document dans un assistant de chat, que faut-il vérifier ?
   Good answer: qu’il ne contient pas de mots de passe, de données personnelles d’autres personnes ni d’informations confidentielles, ou retirer et remplacer ces parties d’abord.

## Completion criteria
L’apprenant répond correctement aux vérifications, en nommant et en corrigeant les erreurs des prompts
défectueux des vérifications 1 et 2.

## Going further
- Leçon suivante : ce qu’un prompt parfait ne peut pas corriger.
