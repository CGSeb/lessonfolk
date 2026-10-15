---
id: context-engineering-for-agents/06-one-agent-or-several
title: Un agent ou plusieurs ?
level: advanced
estimatedMinutes: 20
objectives:
  - Nommer les raisons pour lesquelles plusieurs agents aident
  - Expliquer comment plusieurs agents nuisent par le coût, la coordination et les décisions conflictuelles
  - Choisir une conception pour une longue tâche et la justifier
prerequisites:
  - context-engineering-for-agents/05-sub-agents
---

## Key ideas
1. **Commencez avec un seul agent.** Un agent avec un contexte bien tenu (un budget, la compaction, des
   notes hors de la fenêtre) vient à bout de la plupart des longues tâches. Chaque agent de plus ajoute du
   coût, des passations et des endroits où les choses peuvent mal tourner. Ajoutez des agents pour une
   raison que vous pouvez nommer, pas parce que la tâche est grosse.
2. **Trois raisons tiennent la route.** **L’isolation** : une exploration volumineuse reste hors du
   contexte principal (leçon 5). **Le parallélisme** : des morceaux indépendants s’exécutent en même temps,
   si bien que la tâche finit plus tôt. **Un regard neuf** : un agent avec des instructions différentes, ou
   qui n’a pas vu comment le travail a été fait, juge le résultat et non l’intention. Un relecteur qui part
   du seul diff attrape ce que son auteur se fait passer.
3. **L’indépendance est le test.** Le travail se découpe bien quand les morceaux n’ont pas besoin des
   résultats intermédiaires des autres : des questions de recherche séparées, le même contrôle sur de
   nombreux éléments, des changements dans des modules à interface fixe. Il se découpe mal quand les
   décisions sont couplées : chaque agent fait un choix raisonnable qui ne s’accorde pas avec ceux des
   autres (deux schémas de nommage, deux conceptions de la même chose), car aucun ne voit le contexte des
   autres.
4. **Lire se découpe plus facilement qu’écrire.** Des agents qui ne font que lire ne peuvent pas se gêner.
   Des agents qui écrivent le peuvent : le même fichier modifié deux fois, des changements qui marchent
   chacun seul et cassent ensemble. Deux formes sont sûres : beaucoup d’agents lisent et un seul écrit, ou
   les rédacteurs reçoivent des zones qui ne se chevauchent pas, avec les décisions partagées prises avant
   qu’ils commencent.
5. **La coordination se paie en contexte et en erreurs.** Quelqu’un doit découper le travail, rédiger les
   briefs, lire les rapports et fusionner les résultats. Chaque brief et chaque rapport est une passation
   avec perte, comme un résumé. Le coût total se multiplie avec le nombre d’agents, et un mauvais résultat
   est plus difficile à retracer quand il a traversé trois contextes. Les agents qui doivent partager un
   état doivent le faire par des fichiers (leçon 4), pas par de longs messages entre eux.
6. **Cinq questions avant de découper.** Chaque morceau peut-il être écrit comme un brief qui se suffit à
   lui-même ? Les morceaux ont-ils besoin des résultats des autres ? Les décisions partagées sont-elles
   prises, et écrites, avant le début du travail ? Comment les résultats seront-ils vérifiés et fusionnés,
   et par qui ? Finir plus tôt, ou avoir un contexte principal plus propre, vaut-il le coût supplémentaire ?
   Une réponse branlante veut dire : un seul agent, ou des sous-agents utilisés l’un après l’autre.

## Teaching notes
- Analogie qui fonctionne : **une cuisine**. Un cuisinier prépare seul un plat, et ajouter un second
  cuisinier à la même casserole le gâche : chacun l’assaisonne. Un banquet fonctionne avec une brigade
  parce que les postes sont indépendants (sauces, pâtisserie, grillades) et que le chef a fixé le menu et
  les horaires avant le service. La brigade est plus rapide ; elle a aussi besoin d’un chef qui ne fait que
  coordonner et contrôler les assiettes.
- Cette leçon porte sur le jugement. Enseignez les idées 1 à 5 rondement, puis passez l’essentiel du temps
  sur des cas : les propres tâches de l’apprenant d’abord, des cas inventés ensuite.
- Pour les apprenants qui construisent des agents : la forme habituelle est un agent orchestrateur qui
  lance des travailleurs comme des outils et fusionne leurs rapports. Demandez ce qui, dans leur
  conception, décide des choses partagées (noms, interfaces, formats) avant que les travailleurs
  commencent.
- Pour les apprenants qui pilotent un assistant : les mêmes questions s’appliquent quand ils lancent
  plusieurs sessions côte à côte, ou demandent à un assistant de lancer des sous-agents en parallèle. La
  forme pratique de l’idée 4 : ne jamais laisser deux sessions modifier les mêmes fichiers en même temps ;
  donnez à chacune sa propre copie de travail ou sa propre zone.
- Idée reçue : « plus d’agents, c’est plus intelligent ». Plusieurs agents n’en savent pas plus qu’un seul ;
  chacun en sait moins, puisque chacun ne voit que son brief. Ce qu’ils gagnent, c’est de la place et de la
  vitesse.
- Idée reçue : « les agents s’arrangeront en se parlant ». Chaque échange dépense du contexte des deux côtés
  et est une passation qui perd du détail. Les décisions prises avant le découpage sont moins coûteuses et
  plus fiables que les négociations pendant.
- Idée reçue : « parallèle veut dire moins cher ». Parallèle veut dire plus tôt. Le coût est la somme de
  tous les agents plus la coordination.
- Ne présentez pas une conception comme « l’architecture standard », et ne nommez pas de frameworks : ils
  changent vite. Les questions de l’idée 6 leur survivront.
- C’est la dernière leçon. Gardez quelques minutes pour récapituler le cours comme une seule chaîne : le
  contexte ne fait que grossir (leçon 1), alors dépensez-le avec soin (leçon 2), compressez-le
  délibérément (leçon 3), gardez à l’extérieur ce qui doit durer (leçon 4), et confiez des morceaux entiers
  à un contexte neuf (leçons 5 et 6) quand le travail est assez indépendant. Félicitez l’apprenant.

## Check your understanding
1. Donnez deux bonnes raisons d’utiliser plus d’un agent, et une mauvaise.
   Good answer: bonnes : isoler une exploration volumineuse, travailler en parallèle sur des morceaux indépendants, un relecteur au regard neuf ; mauvaises : « la tâche est grosse », « plus d’agents, c’est plus intelligent » ou « ce sera moins cher ».
2. Pourquoi deux agents qui travaillent sur des parties couplées d’une conception produisent-ils souvent un résultat qui ne s’assemble pas ?
   Good answer: chacun ne voit que son propre brief et contexte, donc chacun fait des choix localement raisonnables mais incompatibles (noms, interfaces, approches) ; les décisions partagées n’ont pas été prises avant le découpage.
3. Pourquoi la lecture en parallèle est-elle plus sûre que l’écriture en parallèle, et quelles sont deux formes sûres pour l’écriture ?
   Good answer: les lecteurs ne peuvent pas entrer en conflit, les rédacteurs peuvent modifier les mêmes choses ou faire des changements qui cassent ensemble ; les formes sûres sont beaucoup de lecteurs avec un seul rédacteur, ou des rédacteurs avec des zones sans chevauchement et des décisions partagées fixées d’avance.
4. Citez trois coûts de la coordination entre agents.
   Good answer: trois éléments parmi le travail de découpage, de brief et de fusion, l’information perdue à chaque brief et rapport, le coût total multiplié par le nombre d’agents, et des erreurs plus difficiles à retracer entre contextes.

## Completion criteria
L’apprenant répond correctement aux vérifications et justifie un choix entre un agent et plusieurs par
l’indépendance (ou le couplage) et par lecture contre écriture, et nomme ce qui doit être décidé avant tout
découpage.

## Going further
- Sujets : évaluer les agents sur de longues tâches, motifs d’orchestration, traçage de systèmes à plusieurs agents.
- Assistants de code IA pour les équipes : règles, skills et plugins, pour les instructions partagées et les garde-fous que chaque agent d’un projet charge.
