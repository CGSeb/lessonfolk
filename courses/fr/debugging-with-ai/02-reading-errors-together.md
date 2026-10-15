---
id: debugging-with-ai/02-reading-errors-together
title: Lire ensemble les erreurs et les traces de pile
level: intermediate
estimatedMinutes: 15
objectives:
  - Demander à l’assistant d’expliquer une erreur avant de demander une correction
  - Lire une trace de pile et distinguer où une erreur a surgi de où elle a commencé
  - Vérifier une explication dans le code au lieu de la croire sur parole
prerequisites:
  - debugging-with-ai/01-giving-the-assistant-what-it-needs
---

## Key ideas
1. **Expliquer d’abord, corriger ensuite.** « Corrige ça » vous donne un correctif que vous ne comprenez
   peut-être pas. « Explique cette erreur : que signifie-t-elle, d’où vient-elle, qu’est-ce qui pourrait la
   causer ? » vous donne de la compréhension, dont vous avez besoin pour juger toute correction. Vous
   pouvez toujours demander la correction ensuite.
2. **Anatomie d’une erreur.** La plupart des erreurs ont un **type** (le genre de problème, comme une clé
   manquante ou une valeur du mauvais type), un **message** (les détails, qui nomment souvent la valeur ou
   le nom concernés) et une **trace de pile** : la chaîne des appels de fonctions en cours au moment où
   c’est arrivé, chacun avec un fichier et un numéro de ligne.
3. **Où ça a surgi n’est pas toujours où ça a commencé.** Une trace de pile montre où l’erreur a été levée,
   en général à une extrémité de la trace (le bas en Python, le haut dans beaucoup d’autres langages). La
   cause est souvent plus tôt : une fonction qui n’a rien renvoyé, de mauvaises données lues dans un
   fichier, un mauvais argument passé trois appels plus haut. Lisez d’abord les lignes qui appartiennent à
   votre propre code ; les cadres à l’intérieur des bibliothèques sont rarement là où se trouve le bug.
4. **Faites désigner des preuves à l’assistant.** Demandez-lui de relier son explication à des lignes
   précises : « Quelle ligne de mon code passe la mauvaise valeur ? Quelle valeur penses-tu qu’elle a à cet
   endroit ? » Une explication qui nomme une ligne et une valeur se vérifie en quelques secondes ; une
   explication vague (« probablement un problème de configuration ») ne se vérifie pas.
5. **Apprenez l’erreur, pas seulement celle-ci.** Demandez ce que le type d’erreur signifie d’habitude et
   ses causes courantes dans votre langage ou framework. La prochaine fois, vous la reconnaîtrez vous-même
   et vous jugerez plus vite les réponses de l’assistant.

## Teaching notes
- Analogie qui fonctionne : **un colis livré abîmé**. Les dégâts ont été constatés à votre porte (là où
  l’erreur a surgi), mais ils ont pu survenir à l’entrepôt (là où elle a commencé). L’historique de suivi,
  comme la trace de pile, vous dit chaque étape par laquelle il est passé.
- Parcourez avec l’apprenant une courte trace de pile, dans le langage qu’il utilise. En Python, une
  `KeyError` ou une `TypeError: unsupported operand type(s)` levée deux fonctions sous la vraie cause
  fonctionne bien ; lisez-la depuis la fin, puis trouvez le premier cadre dans son propre code.
- Idée reçue : « la ligne de l’erreur est la ligne à corriger ». Souvent, c’est seulement là où la mauvaise
  valeur a fini par poser problème ; la correction va là où cette valeur a été produite.
- Idée reçue : « si l’explication semble juste, elle est juste ». Les assistants expliquent de mauvaises
  causes avec la même assurance que les bonnes. Vérifiez chaque affirmation dans le code : cette ligne
  existe-t-elle, cette variable contient-elle vraiment cette valeur ?
- Les apprenants expérimentés lisent déjà les traces de pile ; concentrez-les sur l’idée 4 (faire en sorte
  que l’assistant s’engage sur des affirmations vérifiables) et sur les erreurs de frameworks inconnus, où
  l’assistant aide le plus.

## Check your understanding
1. Pourquoi demander à l’assistant d’expliquer une erreur avant de lui demander de la corriger ?
   Good answer: il faut comprendre le problème pour juger si une correction est juste ; une explication peut être vérifiée dans le code, alors qu’un correctif non compris peut masquer le symptôme ou être faux.
2. Une trace de pile montre une erreur dans la fonction d’analyse de dates d’une bibliothèque, appelée depuis votre fonction `load_orders`. Où regardez-vous d’abord, et pourquoi ?
   Good answer: à l’appel dans son propre code (`load_orders`) et la valeur qu’il passe, car la bibliothèque est probablement correcte et la cause est sans doute la donnée ou l’argument que votre code lui a donné.
3. L’assistant dit que l’erreur est « probablement causée par un problème de configuration ». Comment rendre cette réponse utile ?
   Good answer: lui demander de désigner des preuves précises (quelle ligne, quelle valeur, quel réglage) et comment les vérifier ; une affirmation vague ne peut pas être testée.

## Completion criteria
L’apprenant répond correctement aux vérifications, sait lire une trace de pile pour trouver le premier cadre
dans son propre code, et demande à l’assistant une explication vérifiable avant une correction.

## Going further
- La documentation de votre langage sur ses types d’erreurs ou d’exceptions intégrés.
- Leçon suivante : transformer les explications en hypothèses que vous pouvez tester.
