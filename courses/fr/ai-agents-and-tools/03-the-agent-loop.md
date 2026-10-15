---
id: ai-agents-and-tools/03-the-agent-loop
title: "La boucle d’agent : planifier, agir, observer"
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer le cycle planifier, agir, observer d’un agent
  - Décrire une boucle qui exécute des appels d’outils jusqu’à ce que la tâche soit terminée
  - Arrêter la boucle en toute sécurité avec une limite d’étapes
prerequisites:
  - ai-agents-and-tools/02-tool-and-function-calling
---

## Key ideas
1. **Un agent est une boucle autour de l’appel d’outils.** Envoyez les messages et les outils. Si le
   modèle demande des outils, exécutez-les, ajoutez les résultats aux messages et renvoyez. S’il répond par
   du texte, la tâche est terminée. Cette boucle simple est le cœur de la plupart des agents.
2. **Planifier, agir, observer.** À chaque tour, le modèle décide quoi faire ensuite (planifier), demande
   un outil (agir) et lit le résultat (observer). Lui demander dans le prompt système d’énoncer un court
   plan avant d’agir rend souvent ses choix plus sensés et plus faciles à suivre pour vous.
3. **L’historique est la mémoire de l’agent.** Chaque appel d’outil et chaque résultat sont ajoutés aux
   messages, si bien que le modèle voit ce qu’il a déjà essayé. C’est l’historique de Construire avec
   l’IA, qui grossit plus vite : les longues tâches demandent de la réduction ou des résumés, et coûtent plus
   cher.
4. **Fixez toujours une limite d’étapes.** Un modèle peut tourner en rond : appeler le même outil encore
   et encore ou ne jamais décider qu’il a fini. Un nombre maximal d’étapes (et idéalement un budget de
   temps ou de tokens) garantit que la boucle se termine, avec un message clair quand la limite est
   atteinte.
5. **Rendez chaque étape visible.** Affichez ou journalisez chaque appel d’outil, ses arguments et son
   résultat. Lire cette trace est la façon de comprendre, déboguer et améliorer un agent (leçon 5).

## Teaching notes
- Appuyez-vous sur la leçon 2 : la boucle est son aller-retour d’appel d’outil, répété.
- Analogie qui fonctionne : **un détective**. Regarder les indices, décider quoi vérifier ensuite, le
  vérifier, mettre à jour la théorie, recommencer jusqu’à résoudre l’affaire, mais avec une échéance, sans
  quoi l’enquête ne finit jamais.
- Démo : parcourez sur papier une trace pour « Puis-je acheter 2 théières et un mug rouge ? » : vérifier le
  stock de théières, vérifier le stock de mugs rouges, puis répondre. Demandez à l’apprenant de prédire
  chaque étape.
- Idée reçue : « l’agent planifie tout au début ». En général il décide une étape à la fois selon ce qu’il
  a observé ; les plans changent.
- Idée reçue : « plus d’étapes, de meilleurs résultats ». Les longues boucles ajoutent du coût et plus de
  chances de mal tourner ; un bon jeu d’outils et un bon prompt mènent à des boucles courtes.
- Les modèles locaux peuvent être lents sur de nombreuses étapes ; gardez les tâches petites (2 à 4 appels
  d’outils).

## Check your understanding
1. Décrivez la boucle d’agent en quelques étapes.
   Good answer: envoyer messages et outils ; si la réponse contient des appels d’outils, les exécuter, ajouter les résultats et recommencer ; si c’est une réponse textuelle, s’arrêter et la renvoyer.
2. Pourquoi une boucle d’agent doit-elle avoir une limite d’étapes ?
   Good answer: le modèle peut répéter des appels ou ne jamais finir ; une limite garantit que la boucle se termine et maîtrise le coût et le temps.
3. Comment l’agent « se souvient »-il de ce qu’il a déjà essayé pendant une tâche ?
   Good answer: chaque appel d’outil et son résultat sont ajoutés à l’historique des messages envoyé à chaque tour.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait décrire une boucle d’agent avec au moins deux
outils, une limite d’étapes et une trace.

## Going further
- Leçon suivante : donner au modèle vos propres documents (les bases du RAG).
