---
id: build-with-ai/06-build-a-small-chatbot
title: Construire un petit chatbot
level: intermediate
estimatedMinutes: 15
objectives:
  - Combiner un prompt système, un historique et une gestion d’erreurs dans un seul programme
  - Concevoir un petit chatbot en terminal avec un objectif clair et un plan de test
  - Choisir une fonctionnalité à ajouter, et dire pourquoi
prerequisites:
  - build-with-ai/05-errors-cost-and-latency
---

## Key ideas
1. **Partez d’un objectif clair et étroit.** Un chatbot qui fait une seule chose bien (un camarade de
   révision pour une matière, un assistant de recettes, un bot d’assistance pour les questions d’un club)
   est plus facile à prompter, tester et croire qu’un assistant « qui fait tout ».
2. **Le cœur est une boucle.** Lire le message de l’utilisateur, l’ajouter à l’historique, envoyer
   l’historique réduit avec le prompt système, afficher la réponse, l’ajouter à l’historique, répéter
   jusqu’à ce que l’utilisateur quitte. Chaque leçon précédente est une partie de cette boucle.
3. **Assemblez les pièces.** Le prompt système de la leçon 2 fixe l’objectif ; l’historique et sa
   réduction de la leçon 4 entretiennent la conversation ; les nouvelles tentatives et messages de la
   leçon 5 l’empêchent de planter ; la sortie structurée de la leçon 3 est utile si le bot doit produire
   des données (une liste de courses enregistrée, un score de quiz).
4. **Testez-le comme un utilisateur.** Essayez des questions normales, floues, hors sujet, très longues,
   une tentative de contourner les règles, et un câble réseau débranché. Notez ce qui a mal tourné et
   corrigez une chose à la fois.
5. **Ajoutez une fonctionnalité, pas dix.** Choisissez une amélioration : une commande `/reset`,
   l’enregistrement de la conversation dans un fichier, un résumé JSON à la fin, des réponses en streaming
   ou un second « mode » dans le prompt système. De petites fonctionnalités terminées valent mieux que de
   grandes à moitié faites.

## Teaching notes
- Cette leçon est une séance de conception. Laissez l’apprenant choisir l’objectif du chatbot, et gardez
  vos explications courtes ; posez des questions sur sa conception plutôt que de la concevoir à sa place.
  S’il écrit du code seul, relisez-le avec les mêmes questions.
- Analogie qui fonctionne : **monter un meuble**. Chaque pièce vient d’une leçon précédente ; maintenant
  vous suivez l’ordre et serrez les vis. Testez avant de mettre du poids dessus.
- Idée reçue : « ça marche avec mes trois questions, donc ça marche ». Idée 4 : des tests systématiques
  avec des entrées gênantes trouvent la plupart des problèmes tôt.
- Surveillez les bugs courants : oublier d’ajouter la réponse de l’assistant à l’historique, supprimer le
  prompt système en réduisant l’historique, réessayer des erreurs non réessayables, afficher la clé d’API
  dans les journaux.
- Pour les apprenants rapides, suggérez une deuxième fonctionnalité ou une évaluation simple : une liste
  de dix messages de test à relancer après chaque changement.

## Check your understanding
1. Décrivez pas à pas la boucle principale d’un chatbot.
   Good answer: lire la saisie, l’ajouter à l’historique, envoyer le prompt système plus l’historique réduit, gérer les erreurs, afficher la réponse, l’ajouter à l’historique, répéter jusqu’à la sortie.
2. Avec quels types de messages testeriez-vous votre chatbot, et que pourrait révéler l’un d’eux ?
   Good answer: nomme plusieurs types (normal, flou, hors sujet, long, qui enfreint les règles, panne réseau) et décrit un problème concret qu’un tel test peut révéler et comment le corriger.
3. Pourquoi vaut-il mieux donner d’abord un objectif étroit à un chatbot ?
   Good answer: un objectif étroit est plus facile à décrire dans le prompt système, à tester à fond et à croire, et ses échecs sont plus faciles à repérer.

## Completion criteria
L’apprenant répond correctement aux vérifications et a décrit un chatbot à objectif étroit : son prompt
système, comment il garde l’historique, comment il gère les erreurs, les types de saisies avec lesquels le
tester et une fonctionnalité à ajouter.

## Going further
- Leçon suivante : partager votre chatbot en toute sécurité, et la suite.
