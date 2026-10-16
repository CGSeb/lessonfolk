---
id: evaluating-ai-output/01-looked-fine-is-not-enough
title: "Pourquoi « ça avait l’air bon » ne suffit pas"
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer pourquoi une seule bonne réponse de l’IA prouve peu de chose
  - Nommer les pièges du jugement à vue de nez
  - Dire ce qu’est une évaluation et quand elle vaut l’effort
prerequisites: []
---

## Key ideas
1. **La même demande peut donner des réponses différentes.** Un modèle construit sa réponse en
   choisissant parmi les tokens suivants probables : si vous demandez deux fois, vous obtenez
   souvent deux résultats différents, dont certains sont meilleurs que d’autres. Une bonne réponse
   montre que le modèle *peut* le faire, pas qu’il le fait *en général*.
2. **Trois pièges rendent le coup d’œil trompeur.** *Les petits échantillons* : après deux ou trois
   essais, quelques résultats chanceux ressemblent à une preuve. *Attendre le succès* : on essaie
   plutôt les cas dont on est sûr qu’ils marcheront, et l’on retient les résultats impressionnants.
   *Les échecs silencieux* : une mauvaise réponse est fluide et assurée, donc vous ne la repérez que
   dans les domaines que vous connaissez déjà (voir *Utiliser l’IA en toute sécurité et avec
   discernement*).
3. **Une évaluation est une vérification équitable et répétable.** Vous réunissez un ensemble de cas
   réalistes, vous les faites passer dans le prompt, le modèle ou l’outil, et vous jugez chaque
   résultat selon des critères écrits à l’avance. Comme les cas et les critères restent les mêmes,
   vous pouvez comparer deux options, ou la même option à deux jours différents.
4. **Elle éclaire trois décisions.** Quelle option choisir (ce modèle ou celui-là, ce prompt ou
   celui-là). Si un changement a aidé (une nouvelle formulation peut corriger un cas et en casser
   discrètement trois autres). Et si c’est assez bon pour s’y fier ou le confier à d’autres, avec une
   raison que vous pouvez expliquer.
5. **L’effort doit être à la mesure de l’enjeu.** Pour une tâche ponctuelle que vous relirez vous-même,
   une lecture attentive suffit. Plus la tâche se répète, plus de gens en dépendent et plus une
   erreur coûte cher, plus une vraie évaluation vaut la peine. La suite du cours montre comment
   garder cet effort modeste.

## Teaching notes
- Analogie : goûter une cuillère de soupe renseigne sur cette cuillère. Un restaurant qui sert la
  même soupe tous les soirs doit savoir qu’elle réussit un soir de forte affluence, avec un autre
  cuisinier, et après un changement de fournisseur.
- Scénario à raisonner avec l’apprenant (aucune tâche à faire) : un collègue essaie un nouveau
  prompt sur trois factures, les trois sont bien résumées, et il veut le donner à toute l’équipe.
  Demandez ce qu’il a vraiment appris et ce qu’il n’a pas appris.
- Idée reçue : « je vois vite si la réponse est bonne ». Vrai dans les domaines que l’on maîtrise,
  faux dans ceux où l’on s’appuie sur l’IA justement parce qu’on ne les maîtrise pas.
- Idée reçue : « l’évaluation, c’est pour les ingénieurs avec des outils spéciaux ». La démarche
  (cas, critères, comparaison) est la même pour un enseignant, un analyste ou un développeur ; aucun
  code n’est nécessaire.
- Idée reçue : « si c’est aléatoire, on ne peut pas tester ». La variation est justement la raison
  pour laquelle il faut tester plusieurs cas.
- Débutants dans le cours : gardez les idées 1, 3 et 5 et utilisez le scénario des factures.
  Apprenants expérimentés : introduisez les trois décisions de l’idée 4 avec des exemples de leur
  travail.
- Ne nommez ni outils d’évaluation, ni benchmarks, ni scores : ils changent vite.
- Rythme : les idées 1 et 2 sont le moment « ah ! » de la leçon ; consacrez le reste du temps au scénario.

## Check your understanding
1. Pourquoi une seule bonne réponse de l’IA prouve-t-elle si peu de chose ?
   Good answer: la même demande peut donner des réponses différentes, donc un bon résultat montre que
   le modèle peut le faire, pas à quelle fréquence ; un échantillon d’un seul ne dit rien du résultat habituel.
2. Un collègue a essayé un nouveau prompt sur trois factures, il est content et veut le déployer dans
   toute l’équipe. Que manque-t-il avant que vous soyez d’accord ?
   Good answer: davantage de cas variés, dont des cas difficiles ; des critères écrits à l’avance ;
   une comparaison avec l’ancien prompt sur les mêmes cas ; les trois réussites peuvent être de la
   chance ou des cas trop faciles.
3. Nommez deux des pièges qui rendent « ça avait l’air bon » peu fiable, avec un court exemple de chacun.
   Good answer: par exemple les petits échantillons (deux essais chanceux), attendre le succès (n’essayer
   que des cas dont on attend qu’ils marchent), ou les échecs silencieux (une réponse fausse et assurée
   que l’on ne repère pas).
4. Pour chacun de ces cas, dites si un examen attentif suffit ou si une évaluation vaut la peine : un
   brouillon d’e-mail ponctuel que vous relirez vous-même ; un prompt qui répond chaque jour aux
   questions des clients pour une équipe.
   Good answer: l’e-mail demande seulement une relecture attentive ; le prompt client tourne souvent,
   touche d’autres personnes et peut coûter de la confiance quand il se trompe, donc une évaluation
   vaut la peine.

## Completion criteria
L’apprenant peut expliquer pourquoi un seul bon résultat prouve peu, nommer au moins deux pièges du
jugement à vue de nez, définir une évaluation comme une vérification équitable et répétable, et décider
quand elle vaut l’effort (vérifications 1-4).

## Going further
- La leçon « Choisir un modèle » de *Comment fonctionnent vraiment les modèles d’IA* donne une courte
  méthode pour comparer des modèles sur vos propres exemples, que ce cours développe.
- Sujet à explorer : pourquoi les réponses d’un modèle de langage varient d’une exécution à l’autre.
