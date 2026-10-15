---
id: context-engineering-for-agents/01-why-long-tasks-go-wrong
title: Pourquoi les longues tâches tournent mal
level: advanced
estimatedMinutes: 20
objectives:
  - Expliquer pourquoi le contexte d’un agent grossit pendant une longue tâche et ce que cela coûte
  - Décrire les façons dont un long contexte dégrade le comportement d’un agent
  - Repérer dans une trace les symptômes d’un contexte dégradé
prerequisites:
  - ai-agents-and-tools/06-guardrails-and-human-oversight
---

## Key ideas
1. **Le contexte ne fait que grossir.** Un agent est une boucle : le modèle demande un outil, votre code
   l’exécute, le résultat est ajouté aux messages, et toute la liste est renvoyée (vu dans Agents IA et
   outils). Rien ne part jamais de lui-même. Au bout de cinquante étapes, la tâche d’origine tient en
   quelques lignes en haut, et presque tout le reste est d’anciens résultats d’outils : fichiers lus,
   résultats de recherche, sorties de commandes, tentatives ratées.
2. **Tenir dans la fenêtre ne veut pas dire être bien utilisé.** La fenêtre de contexte est la limite
   stricte, mais la qualité baisse bien avant qu’elle soit pleine. À chaque étape, le modèle doit trouver
   les quelques lignes qui comptent parmi tout le reste, et chaque page de plus est une chose de plus à
   laquelle il peut s’accrocher par erreur. Traitez l’attention du modèle comme un budget que chaque token
   dépense, pas comme un espace libre jusqu’à la limite.
3. **Un long contexte se dégrade de quatre façons.** **Instructions enfouies** : une contrainte donnée au
   début (« ne change pas l’API publique ») perd du poids sous des milliers de lignes ultérieures.
   **Informations périmées** : l’agent a lu un fichier à l’étape 5, l’a modifié à l’étape 20, et raisonne
   toujours à partir de l’ancienne copie. **Contradiction** : deux versions du même fait, ou trois
   tentatives ratées à côté de celle qui a marché, sans rien qui dise laquelle est à jour.
   **Distraction** : des résultats qui n’étaient utiles que pour une étape continuent d’attirer l’agent
   vers des questions secondaires, et ses propres erreurs passées deviennent des exemples qu’il imite.
4. **Le coût et le temps croissent plus vite que la tâche.** Chaque étape renvoie tout ce qui précède, donc
   une tâche deux fois plus longue coûte bien plus du double à traiter : chaque nouvelle étape repaie toutes
   les précédentes. De nombreux fournisseurs facturent moins un début répété (la mise en cache), ce qui
   réduit la facture mais ne fait rien pour le problème d’attention.
5. **Un contexte dégradé se voit dans la trace.** L’agent relit un fichier qu’il a déjà lu, relance une
   commande qui a déjà échoué, enfreint une règle du premier message, défait une décision qu’il avait
   prise plus tôt, ou dit « terminé » alors qu’une partie de la tâche est oubliée. Une telle étape est du
   bruit ; plusieurs d’affilée, tard dans une longue tâche, désignent le contexte.
6. **L’ingénierie de contexte consiste à décider ce que le modèle voit à chaque étape.** Le prompting
   façonne le premier message. L’ingénierie de contexte gère toute la fenêtre sur toute la tâche : ce qui y
   entre, ce qui reste dehors, ce qui est compressé, ce qui est stocké ailleurs et ce qui est confié à un
   autre agent. Un prompt plus sévère ne répare pas une fenêtre encombrée ; changer ce qu’elle contient, si.

## Teaching notes
- Les apprenants viennent de deux côtés : ceux qui construisent des agents en code, et ceux qui pilotent
  pendant des heures des assistants de type agent. Demandez dès la première minute lequel ils sont et
  prenez chaque exemple de leur côté. Les idées sont les mêmes ; seul le vocabulaire change (« la liste de
  messages » pour les constructeurs, « la session » pour les utilisateurs).
- Analogie qui fonctionne : **un bureau pendant un long projet**. Chaque document que vous ouvrez reste sur
  le bureau. Au bout d’une journée, le brief est quelque part sous la pile, deux versions du même brouillon
  sont côte à côte, et vous prenez l’ancienne. Le bureau n’est pas trop petit ; il est trop plein pour
  travailler. Le ranger est un travail que vous devez décider de faire.
- Partez de l’expérience de l’apprenant : demandez si un assistant ou un agent a déjà « empiré » tard dans
  une longue session, et ce qu’il a fait. La plupart ont une histoire ; rattachez-la aux quatre façons de
  l’idée 3.
- Idée reçue : « une fenêtre de contexte plus grande règle ça ». Une fenêtre plus grande déplace la limite
  stricte, pas le problème d’attention : une plus grande pile reste une pile. Elle fait aussi coûter plus
  cher chaque étape.
- Idée reçue : « le modèle oublie d’abord les choses les plus anciennes, comme une personne ». Rien n’est
  oublié : chaque ligne est toujours là et se dispute toujours l’attention. Les positions qui reçoivent
  moins d’attention varient selon les modèles, n’enseignez donc pas de règle du genre « le milieu est perdu ».
- Idée reçue : « répétez l’instruction en majuscules ». Cela peut aider quelques étapes, puis la répétition
  est enfouie elle aussi. Cela traite le symptôme de l’idée 3, pas la cause.
- Reliez l’idée 3 à « les erreurs s’accumulent » de Agents IA et outils en une phrase : un mauvais résultat
  qui reste dans le contexte continue d’induire en erreur les étapes suivantes. Ne réenseignez pas les modes
  de défaillance.
- Idée 4 : gardez le raisonnement qualitatif. Un petit schéma suffit (« l’étape 1 envoie 1 page, l’étape 2
  en envoie 2, l’étape 3 en envoie 3… »). Ne citez ni prix, ni tailles de fenêtre, ni longueur à partir de
  laquelle la qualité baisse : ils diffèrent selon les modèles et changent vite.
- L’idée 6 est la carte du cours : budgétisation (leçon 2), compaction (leçon 3), mémoire hors de la
  fenêtre (leçon 4), sous-agents (leçons 5 et 6). Nommez-les en une phrase chacune et passez à la suite ;
  ne commencez pas à les enseigner.
- Rythme : les idées 1 et 2 vont vite pour ce public. Passez le temps sur les idées 3 et 5, avec les
  histoires de l’apprenant ou de courtes traces inventées.

## Check your understanding
1. Un agent a une très grande fenêtre de contexte et en a utilisé le quart. Pourquoi son travail peut-il quand même empirer ?
   Good answer: tenir n’est pas être bien utilisé ; le modèle doit trouver les lignes pertinentes parmi tout le reste, donc plus de contenu signifie plus d’instructions enfouies, de résultats périmés ou contradictoires et de distractions, bien avant la limite.
2. Citez deux façons dont un long contexte dégrade un agent, avec un exemple de chacune.
   Good answer: deux éléments parmi instructions enfouies (une contrainte précoce est ignorée), informations périmées (raisonner à partir d’une ancienne copie d’un fichier modifié), contradiction (plusieurs versions ou tentatives ratées sans indication de laquelle est à jour) et distraction (d’anciens résultats ou des erreurs passées l’éloignent de la tâche), chacun avec un exemple plausible.
3. Pourquoi une tâche avec deux fois plus d’étapes coûte-t-elle bien plus du double ?
   Good answer: chaque étape renvoie tout l’historique, donc chaque nouvelle étape repaie toutes les précédentes ; le total croît plus vite que le nombre d’étapes. La mise en cache peut baisser le prix mais pas la quantité sur laquelle le modèle doit porter son attention.
4. Tard dans une longue session, l’agent enfreint une règle de votre premier message. Pourquoi répéter la règle plus fermement est-il une correction faible ?
   Good answer: la règle n’a pas été mal comprise, elle a été enfouie ; la répétition sera à son tour enfouie. La vraie correction change ce qu’il y a dans le contexte (retirer, compresser ou déplacer du contenu), ce qui est le sens de l’ingénierie de contexte.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait nommer au moins trois symptômes d’une longue tâche
qui tourne mal et rattacher chacun à une cause de l’idée 3 (ou au gaspillage décrit aux idées 1 et 4).

## Going further
- Sujets : fonctionnement de l’attention dans un transformeur, mise en cache des prompts, évaluation des longs contextes.
- Leçon suivante : budgétiser la fenêtre de contexte.
