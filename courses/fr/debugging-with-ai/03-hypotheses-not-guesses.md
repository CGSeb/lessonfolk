---
id: debugging-with-ai/03-hypotheses-not-guesses
title: Des hypothèses, pas des suppositions
level: intermediate
estimatedMinutes: 20
objectives:
  - Demander à l’assistant des causes probables classées, chacune avec un moyen de la tester
  - Choisir un test peu coûteux pour une hypothèse (journaux, affichages, débogueur, dichotomie)
  - Changer une seule chose à la fois et laisser les preuves décider
prerequisites:
  - debugging-with-ai/02-reading-errors-together
---

## Key ideas
1. **Une supposition est une correction sans raison.** Essayer les correctifs de l’assistant les uns après
   les autres jusqu’à ce que l’erreur disparaisse, c’est deviner. Vous pouvez tomber sur quelque chose qui
   masque le bug, et vous n’apprenez rien dans les deux cas. Le débogage fonctionne mieux comme une
   expérience : une hypothèse, un test, un résultat.
2. **Demandez des causes classées avec des tests.** Au lieu de « corrige », demandez : « Liste les trois
   causes les plus probables, la plus probable d’abord. Pour chacune, comment pourrais-je la confirmer ou
   l’écarter rapidement ? » L’assistant est bon pour lister les causes possibles ; vous et le programme
   décidez laquelle est vraie.
3. **Les tests peu coûteux d’abord.** Moyens de tester une hypothèse, à peu près du plus rapide au plus
   lourd : afficher ou journaliser la valeur à la ligne suspecte ; vérifier les données d’entrée ; lancer
   la reproduction avec une variation ; la parcourir pas à pas avec un **débogueur** (un outil qui met le
   programme en pause pour inspecter les variables ligne par ligne). Préférez le test qui écarte le plus de
   choses au moindre effort, pas seulement la cause la plus probable.
4. **Procédez par dichotomie quand vous êtes perdu.** Si ça marchait avant et plus maintenant, coupez la
   recherche en deux : testez une version à mi-chemin entre la bonne et la mauvaise (les outils de gestion
   de versions peuvent automatiser cela sur les commits), ou retirez la moitié du code ou de l’entrée et
   voyez si le bug reste. Chaque étape divise l’espace de recherche par deux, donc même un long historique
   se réduit vite.
5. **Un changement à la fois, puis mise à jour.** Changez une chose, relancez et notez le résultat.
   Redonnez le résultat à l’assistant (« j’ai affiché `total` : c’est une chaîne, pas un nombre ») et
   demandez-lui de mettre à jour son classement. Les preuves valent mieux que l’assurance, celle de
   l’assistant comme la vôtre.

## Teaching notes
- Analogie qui fonctionne : **un mécanicien face à un bruit de moteur étrange**. Un bon mécanicien ne
  remplace pas des pièces au hasard jusqu’à ce que cela s’arrête ; il liste les causes probables, vérifie
  d’abord la moins chère (est-ce juste un cache mal fixé ?) et ne remplace une pièce que lorsque les preuves
  y mènent.
- Donnez à l’apprenant un prompt réutilisable : « Voici le bug [brief]. Ne le corrige pas encore. Liste les
  causes les plus probables, classées, avec un test rapide pour chacune. »
- Idée reçue : « demander des hypothèses est plus lent que demander une correction ». Pour les bugs simples,
  la première correction marche souvent. Pour tout ce qui résiste à une ou deux tentatives, deviner coûte
  bien plus de temps que quelques tests ciblés.
- Idée reçue : « un agent qui exécute le code lui-même n’a pas besoin de cela ». Les outils de type agent
  peuvent lancer des tests et ajouter des affichages eux-mêmes, ce qui est utile, mais ils peuvent aussi
  enchaîner de nombreuses modifications spéculatives. Demandez-leur d’énoncer l’hypothèse avant chaque
  changement et d’annuler les changements qui n’ont pas aidé.
- Dichotomie : nommez l’idée et le fait que les outils de gestion de versions peuvent l’automatiser sur
  les commits ; n’enseignez pas de commande précise sauf si l’apprenant le demande, puis utilisez son outil.
- Rappelez à l’apprenant de retirer ensuite les affichages et journaux temporaires (la leçon 5 y revient).
- C’est la leçon la plus longue ; vérifiez l’engagement après l’idée 2 et après l’idée 4.

## Check your understanding
1. Quelle est la différence entre deviner et tester une hypothèse pendant le débogage ?
   Good answer: deviner essaie des corrections jusqu’à ce que l’erreur disparaisse sans savoir pourquoi ; tester une hypothèse énonce une cause possible, lance une vérification qui la confirme ou l’écarte, et laisse le résultat décider de la suite.
2. Que demandez-vous à l’assistant à la place de « corrige » quand un bug résiste à une première tentative ?
   Good answer: une liste classée de causes probables, chacune avec un moyen rapide de la confirmer ou de l’écarter.
3. Une fonctionnalité marchait la semaine dernière et est cassée maintenant, après une quarantaine de commits. Vous n’avez aucune idée de quel changement l’a cassée. Quelle approche convient ?
   Good answer: la dichotomie : tester une version à mi-chemin entre la bonne et la mauvaise, garder la moitié qui contient le changement et recommencer (les outils de gestion de versions peuvent l’automatiser).
4. Pourquoi ne changer qu’une seule chose à la fois ?
   Good answer: pour savoir quel changement a eu quel effet ; changer plusieurs choses à la fois rend le résultat impossible à interpréter.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait lancer, ou décrire, une boucle hypothèse → test
peu coûteux → résultat → classement mis à jour, en changeant une seule chose à la fois.

## Going further
- La méthode scientifique, que cette leçon applique au code.
- La documentation de votre outil de gestion de versions sur la dichotomie.
- La documentation du débogueur de votre éditeur ou de votre langage, pour les points d’arrêt et l’exécution pas à pas.
- Leçon suivante : distinguer une correction de la cause racine de celle qui ne fait que masquer le symptôme.
