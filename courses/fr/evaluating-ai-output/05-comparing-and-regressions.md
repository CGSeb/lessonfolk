---
id: evaluating-ai-output/05-comparing-and-regressions
title: Comparer des versions et repérer les régressions
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer comment comparer équitablement deux options
  - Lire des résultats au-delà d’une moyenne, en tenant compte du bruit et des petites différences
  - Décrire pourquoi les résultats doivent être revérifiés quand un modèle change, et ce qu’il faut consigner
prerequisites:
  - evaluating-ai-output/04-scoring-methods
---

## Key ideas
1. **Comparez ce qui est comparable, et ne changez qu’une chose à la fois.** Utilisez les mêmes cas et les
   mêmes critères pour les deux options. Si vous changez le prompt et le modèle ensemble, vous ne pouvez pas
   savoir lequel a causé la différence. Une comparaison n’est équitable que si une seule chose change.
2. **Regardez ce qui a empiré, pas seulement la moyenne.** Une nouvelle version peut faire monter le score global
   tout en cassant discrètement des cas qui comptent. Un cas qui passait avant et échoue maintenant est une
   *régression*. Listez explicitement les régressions, et pesez-les selon leur importance : un nouvel échec sur
   une exigence obligatoire peut peser plus que plusieurs petits gains.
3. **Tenez compte du bruit.** Comme les réponses varient d’une exécution à l’autre, et que les jeux de test sont
   petits, un petit écart peut être de la chance. Si un résultat doit guider une décision, faites passer les cas
   plusieurs fois et cherchez les différences qui apparaissent à chaque fois. Quand l’écart est faible, dites
   « pas de différence nette » plutôt que de déclarer un gagnant.
4. **Les modèles changent sous vos pieds.** Les fournisseurs mettent à jour, remplacent et retirent des modèles,
   et un nom peut rester alors que le comportement bouge ; certains permettent de figer une version précise, ce
   qui garde un comportement plus stable jusqu’à son retrait. Un bon résultat de la saison dernière n’est donc pas
   une garantie aujourd’hui. Refaites passer vos cas quand le modèle, ses réglages ou le fournisseur changent, et
   quand les utilisateurs disent que « ça ne fait plus pareil ».
5. **Tenez un registre simple.** Notez pour chaque essai : la version du prompt, le nom et la version du modèle,
   la date, les scores et la décision. Cela permet de revenir à une version qui marchait, d’expliquer votre choix
   à d’autres et de remarquer les dérives lentes.

## Teaching notes
- Analogie : une école qui compare deux méthodes d’enseignement. Si une classe a la méthode et un autre
  enseignant, une autre année et un autre test, on ne peut rien conclure. Le changement d’un seul facteur,
  testé de la même façon, le permet.
- Scénario à raisonner avec l’apprenant (rien à lancer) : un nouveau prompt fait passer le score moyen de 78 à 82,
  mais deux questions de remboursement de clients qui passaient avant échouent maintenant. Demandez s’il faut le
  mettre en service et ce qu’ils voudraient savoir d’autre.
- Second scénario : un fournisseur annonce qu’un ancien modèle sera retiré et remplacé par un plus récent. Demandez
  ce que l’équipe doit faire avant le changement et ce qu’elle doit consigner.
- Idée reçue : « une moyenne plus haute veut dire mieux ». Elle cache ce qui a empiré et ignore le bruit.
- Idée reçue : « si ça a passé une fois, c’est bon pour toujours ». Les modèles, les prompts et les données changent.
- Débutants dans le cours : idées 1, 2 et 4 avec le premier scénario. Apprenants expérimentés : discutez des essais
  répétés, de la pondération des régressions et du figement des versions.
- Ne nommez ni fournisseurs, ni modèles, ni numéros de version, ni dates de retrait.
- Rythme : passez l’essentiel du temps sur les deux scénarios.

## Check your understanding
1. Pourquoi ne changer qu’une chose à la fois quand on compare deux options ?
   Good answer: sinon on ne peut pas savoir quel changement a causé la différence ; avec un seul changement, le
   résultat peut lui être attribué.
2. Une nouvelle version a une meilleure moyenne mais échoue sur trois cas qui passaient avant. Comment décideriez-vous
   de l’adopter ou non ?
   Good answer: regarder quels sont ces trois cas et leur importance (surtout s’ils sont obligatoires), les peser
   contre les gains, et envisager de les corriger avant de basculer.
3. Votre assistant a bien marché pendant des mois, puis le personnel dit que ses réponses ont changé. Citez deux
   causes possibles et ce que vous feriez.
   Good answer: le modèle derrière le nom a été mis à jour ou remplacé, ou les réglages et les données ont changé ;
   refaire passer les cas de test, comparer avec le registre précédent, puis figer une version ou adapter.

## Completion criteria
L’apprenant peut décrire une comparaison équitable, lire des résultats au-delà de la moyenne (régressions et bruit),
et expliquer pourquoi revérifier et tenir un registre quand un modèle change (vérifications 1-3).

## Going further
- La leçon « Gérer les erreurs, le coût et la latence » de *Comment fonctionnent les applications d’IA* examine
  l’exécution d’un modèle dans une application.
- Sujet à explorer : comment les essais répétés et les intervalles de confiance aident à lire de petites différences.
