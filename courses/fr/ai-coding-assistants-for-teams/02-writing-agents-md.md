---
id: ai-coding-assistants-for-teams/02-writing-agents-md
title: Rédiger un bon AGENTS.md
level: intermediate
estimatedMinutes: 15
objectives:
  - Structurer un fichier d’instructions autour des commandes, de la carte, des conventions, des limites et du « terminé »
  - Transformer des souhaits vagues en règles précises et vérifiables
  - Décider ce qu’il faut laisser hors du fichier
prerequisites:
  - ai-coding-assistants-for-teams/01-how-assistants-load-instructions
---

## Key ideas
1. **Commencez par les commandes.** Les lignes les plus utiles sont les commandes exactes pour installer,
   compiler, lancer, tester et analyser le projet, y compris comment lancer un seul test. Avec elles, un
   assistant de type agent peut vérifier son propre travail au lieu de deviner.
2. **Donnez une courte carte et les conventions qui ne sont pas évidentes.** Quelques lignes sur
   l’organisation du code (où vit l’API, où vont les tests) et les conventions qu’un nouveau venu
   enfreindrait : le schéma de gestion d’erreurs, la règle de nommage, la bibliothèque à utiliser pour les
   dates, le format des messages de commit. Pointez vers un fichier d’exemple plutôt que de le décrire
   longuement.
3. **Énoncez les limites.** Ce que l’assistant ne doit jamais faire ni toucher : fichiers générés,
   migrations de base de données déjà appliquées, API publiques qui ne doivent pas changer, secrets, pousser
   sur la branche principale. Dites ce qu’il faut faire à la place (« demande d’abord », « crée une nouvelle
   migration »).
4. **Définissez « terminé ».** Comment savoir qu’une tâche est finie : les tests passent, l’analyseur est
   propre, la documentation est à jour, un résumé de ce qui a changé. Cela transforme « a l’air fini » en
   un contrôle que l’assistant peut lancer.
5. **Précis et vérifiable vaut mieux que long et vague.** « Écris du code propre » ne change rien ;
   « Utilise des types `Result` pour les erreurs dans `services/`, ne lève jamais d’exception, voir
   `services/user.ts` » si. Si vous ne pouvez pas dire si une règle a été suivie, réécrivez-la. Laissez
   de côté ce que les outils font déjà respecter (le formatage que l’analyseur corrige), ce qui change
   chaque semaine, et tout ce qui est secret : le fichier est committé et lu par tous les outils.

## Teaching notes
- Analogie qui fonctionne : **une fiche de recette, pas un livre de cuisine**. Elle liste les étapes et
  les pièges (« n’ouvrez pas le four avant 20 minutes »), pas l’histoire de la cuisine française.
- Exemple en direct : parcourez avec l’apprenant le `AGENTS.md` de LessonFolk. Faites remarquer sa carte
  du dépôt, ses procédures et son tableau de messages de commit. Puis faites remarquer ce qui pourrait être
  mieux pour un projet de code : il n’a presque aucune commande de build ou de test (elles vivent dans
  `CLAUDE.md` ici), ce qui montre qu’un même fichier peut servir plusieurs publics.
- Un squelette compact à montrer (avec vos propres mots, adaptez à leur pile) :
  `## Commands` · `## Project map` · `## Conventions` · `## Boundaries` · `## Definition of done`.
  Il n’y a pas de structure imposée ; les titres rendent simplement le fichier facile à parcourir pour les
  personnes et les modèles.
- Idée reçue : « l’assistant suivra chaque règle ». Les règles sont des conseils ; les plus importantes
  ont aussi leur place dans des tests, des analyseurs ou des hooks (leçon 5). Mettez les règles les plus
  importantes en premier et gardez-les peu nombreuses.
- Idée reçue : « je dois tout écrire avant d’utiliser l’assistant ». Commencez avec les commandes et trois
  ou quatre conventions ; ajoutez une règle chaque fois que l’assistant fait deux fois la même erreur
  (leçon 6).
- Certains outils peuvent générer un premier brouillon à partir du code (par exemple une commande `/init`).
  Un brouillon est un point de départ : relisez-le et coupez ce qui est générique.
- Pour les apprenants de petits projets ou en solo, limitez-vous aux commandes, conventions et « terminé ».
  Pour ceux de grandes équipes, passez plus de temps sur les limites et sur le renvoi vers la documentation
  existante plutôt que sa copie.

## Check your understanding
1. Pourquoi les commandes exactes de build et de test sont-elles les lignes les plus précieuses d’un fichier d’instructions ?
   Good answer: elles permettent à l’assistant de lancer et de vérifier son propre travail (build, tests, analyseur) au lieu de deviner, ce qui attrape ses erreurs tôt.
2. Réécrivez la règle « Gère correctement les erreurs » pour qu’un assistant puisse la suivre et que vous puissiez la vérifier.
   Good answer: une règle précise qui nomme le schéma, l’endroit et un exemple, par ex. quel type d’erreur ou quel utilitaire utiliser dans quel dossier, ce qu’il ne faut jamais faire, et un fichier à imiter.
3. Citez deux choses qui ne doivent pas figurer dans AGENTS.md, et pourquoi.
   Good answer: deux éléments parmi secrets ou identifiants (le fichier est committé et envoyé aux outils), règles que l’analyseur ou le formateur font déjà respecter, longue documentation copiée (gaspille du contexte, pointer vers elle à la place), faits qui changent sans cesse, souhaits vagues qui ne peuvent pas être vérifiés.

## Completion criteria
L’apprenant répond correctement aux vérifications et a rédigé, ou sait décrire en détail, un fichier
d’instructions avec commandes, conventions, limites et définition de « terminé », écrit sous forme de règles
précises.

## Going further
- La convention AGENTS.md et ses exemples : agents.md
- La documentation de votre assistant sur la rédaction de bonnes instructions de projet.
