---
id: ai-coding-assistants/02-splitting-the-work
title: Découper le travail en bonnes tâches
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer pourquoi de petites tâches bien spécifiées fonctionnent mieux que de grandes tâches vagues
  - Découper une fonctionnalité en tâches qu’un assistant peut réussir de façon fiable
  - Rédiger des critères de « terminé » clairs pour une tâche de code
prerequisites:
  - ai-coding-assistants/01-what-your-assistant-sees
---

## Key ideas
1. **De grandes demandes vagues produisent du grand code vague.** « Construis la page de paiement » laisse
   à l’assistant le soin de deviner des centaines de décisions : forme des données, validation, états
   d’erreur, style, cas limites. Chaque supposition peut être fausse, et un gros changement est long à
   relire. Les erreurs s’additionnent aussi : un mauvais choix précoce se propage à tout ce qui est construit
   dessus.
2. **Une bonne tâche est petite, précise et vérifiable.** Elle touche quelques fichiers, a un seul objectif
   clair, et vous voyez vite si cela a marché. « Ajoute une fonction `validateCart` dans `cart.ts` qui
   rejette les quantités inférieures à 1, avec des tests unitaires » est une bonne tâche ; « améliore le
   panier » n’en est pas une.
3. **Planifiez d’abord, puis construisez par étapes.** Pour tout ce qui dépasse un petit changement,
   demandez à l’assistant un plan avant tout code : les étapes, les fichiers que chaque étape touche, les
   questions ouvertes. Corrigez le plan (c’est peu coûteux), puis lancez une étape à la fois et vérifiez
   chacune avant la suivante.
4. **Dites ce que « terminé » veut dire.** Donnez des critères d’acceptation que l’assistant et vous pouvez
   tous deux vérifier : le comportement attendu, les cas à gérer, les tests qui doivent passer, ce qui ne
   doit pas changer. Sans eux, l’assistant décide seul quand s’arrêter, souvent trop tôt ou avec des
   changements en plus que vous n’avez pas demandés.
5. **Gardez les décisions pour vous.** Découpez de façon que les choix importants (modèle de données, forme
   de l’API, quelle bibliothèque ajouter, règles de sécurité) soient faits par vous, idéalement avant le
   début de la tâche. Confiez à l’assistant le travail qui découle de ces décisions, pas les décisions
   elles-mêmes.

## Teaching notes
- Analogie qui fonctionne : **rédiger des tickets pour un coéquipier rapide mais tout nouveau**. Vous ne
  lui donneriez pas « construis le paiement » le premier jour ; vous lui donneriez des tickets bien
  délimités avec des critères d’acceptation clairs, et vous relirez chacun.
- Idée reçue : « les outils de type agent peuvent maintenant prendre des fonctionnalités entières, donc
  découper est inutile ». Ils peuvent tenter de grandes tâches, mais plus le changement est gros, plus il
  est difficile à relire et plus les suppositions s’accumulent. Découper concerne votre capacité à vérifier,
  pas seulement celle de l’outil à faire.
- Idée reçue : « planifier avec l’assistant fait perdre du temps ». Corriger un mauvais plan prend une
  minute ; corriger une mauvaise implémentation dans dix fichiers prend bien plus longtemps.
- Faites le lien avec la leçon 1 : chaque brief de tâche a toujours besoin du contexte (fichiers,
  contraintes, un exemple).
- Pour les développeurs web, utilisez des découpages familiers : modèle de données → route d’API →
  validation → composant d’interface → états (chargement, vide, erreur) → tests.
- Si l’apprenant est expérimenté, laissez-le découper une vraie fonctionnalité de son propre travail et
  critiquez le découpage ensemble plutôt que d’utiliser un exemple générique.

## Check your understanding
1. Pourquoi « construis la page des paramètres utilisateur » donne-t-il en général de moins bons résultats qu’une série de tâches plus petites ?
   Good answer: l’assistant doit deviner de nombreuses décisions, les mauvaises suppositions s’additionnent et le gros résultat est difficile à relire ; chaque petite tâche peut être spécifiée et vérifiée.
2. Qu’est-ce qui fait une « bonne » tâche de code pour un assistant ?
   Good answer: un périmètre réduit (quelques fichiers), un objectif clair, le contexte nécessaire et des critères de terminé clairs comme le comportement attendu et les tests qui doivent passer.
3. Avant de laisser l’assistant implémenter une fonctionnalité de taille moyenne, que devez-vous lui demander, et pourquoi ?
   Good answer: un plan (étapes, fichiers, questions ouvertes), car corriger un plan est peu coûteux et permet de garder les décisions importantes avant que le moindre code soit écrit.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait découper une fonctionnalité en petites tâches
avec des critères de terminé clairs, en gardant pour lui les décisions clés.

## Going further
- Rédiger de bons tickets et critères d’acceptation, une compétence qui se transpose directement au brief
  des assistants IA.
- Leçon suivante : relire le code que l’assistant écrit.
