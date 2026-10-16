---
id: ai-agents-and-tools/01-from-chatbot-to-agent
title: Du chatbot à l’agent
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer ce qui fait d’un système d’IA un agent
  - Placer un système sur le spectre allant du chatbot au workflow puis à l’agent
  - Décider quand un agent n’est pas nécessaire
prerequisites:
  - how-ai-apps-work/07-sharing-and-next-steps
---

## Key ideas
1. **« Agent » est utilisé à la légère, alors précisons-le.** On appelle agents beaucoup de choses. Une
   définition utilisable : un **agent** est un système où un modèle décide de la prochaine action à
   mener, l’exécute via des outils, regarde le résultat, et recommence jusqu’à ce que la tâche soit
   terminée.
2. **Un spectre, pas un interrupteur.** Un **chatbot** ne répond que par du texte. Un **workflow** utilise
   un modèle à l’intérieur d’étapes que votre code fixe à l’avance (résumer, puis classer, puis envoyer).
   Un **agent** laisse le modèle choisir les étapes et leur ordre. Chaque cran sur le spectre donne plus
   de liberté au modèle.
3. **Les outils sont la façon dont un modèle agit.** Un modèle ne produit que du texte. Il ne peut agir
   sur le monde (chercher, lire un fichier, envoyer un e-mail) qu’à travers des fonctions que votre code
   expose et exécute pour lui. Ce qu’un agent peut faire, c’est exactement l’ensemble des outils que vous
   lui donnez.
4. **Plus de liberté, plus de risque et de coût.** Les agents peuvent traiter des tâches ouvertes, mais ils
   sont plus lents, consomment plus de tokens, sont plus difficiles à tester et peuvent mal tourner de plus
   de façons, car chaque étape peut ajouter une erreur.
5. **Souvent, vous n’avez pas besoin d’un agent.** Si vous pouvez écrire les étapes à l’avance, un workflow
   est plus simple, moins cher et plus prévisible. Tournez-vous vers un agent quand les étapes dépendent
   vraiment de ce qu’on trouve en chemin.

## Teaching notes
- Le but de ce cours est de remplacer le battage par un modèle mental clair : restez calme et concret, et
  évitez les affirmations sur ce que les agents feront bientôt ou sur les meilleurs produits.
- Vous êtes, dans ce chat, peut-être vous-même un agent (vous pouvez lire des fichiers et appeler des
  outils). Si c’est le cas, servez-vous-en comme exemple vivant : dites de quels outils vous disposez et
  comment vous choisissez de les utiliser. Sinon, dites-le honnêtement.
- Analogie qui fonctionne : **une recette contre un cuisinier**. Un workflow suit la recette pas à pas ;
  un agent est un cuisinier qui regarde dans le frigo, décide quoi préparer et s’adapte en route. Le
  cuisinier est plus flexible, et plus susceptible de vous surprendre.
- Idée reçue : « un agent est un modèle plus intelligent ». C’est en général le même type de modèle, dans
  une boucle, avec des outils. La différence est le système autour.
- Idée reçue : « les agents agissent seuls ». Ils n’agissent qu’à travers des outils que votre code exécute,
  avec les permissions que vous leur donnez (leçon 6).
- Ne nommez ni frameworks d’agents ni produits : le cours est sans framework.

## Check your understanding
1. Avec vos propres mots, qu’est-ce qui fait d’un système un agent plutôt qu’un chatbot ?
   Good answer: le modèle décide quelles actions mener, les exécute via des outils, observe les résultats et recommence jusqu’à ce que ce soit terminé, au lieu de seulement répondre par du texte.
2. Une entreprise veut toujours : lire un e-mail d’assistance, le classer et rédiger une réponse. Agent ou workflow ? Pourquoi ?
   Good answer: un workflow ; les étapes sont connues à l’avance, donc des étapes fixes sont plus simples, moins chères et plus prévisibles que de laisser un modèle choisir.
3. Pourquoi les agents sont-ils plus difficiles à rendre fiables qu’un simple appel de modèle ?
   Good answer: ils font de nombreuses étapes, chacune peut mal tourner et les erreurs s’additionnent ; ils sont moins prévisibles, plus lents, coûtent plus cher et sont plus difficiles à tester.

## Completion criteria
L’apprenant répond correctement aux vérifications, en plaçant notamment une tâche sur le spectre
chatbot/workflow/agent avec une raison.

## Going further
- Leçon suivante : l’appel d’outils et de fonctions, la brique de base des agents.
