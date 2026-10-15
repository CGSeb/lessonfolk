---
id: prompting-basics/03-iterating-on-a-bad-answer
title: Améliorer une mauvaise réponse
level: beginner
estimatedMinutes: 15
objectives:
  - Traiter une première réponse comme un brouillon à améliorer
  - Diagnostiquer pourquoi une réponse a raté sa cible
  - La corriger avec des relances ciblées ou en repartant de zéro
prerequisites:
  - prompting-basics/02-role-examples-and-format
---

## Key ideas
1. **La première réponse est un brouillon, pas un verdict.** Un chat est une conversation : vous pouvez
   réagir à la réponse et l’orienter. La plupart des bons résultats arrivent après une ou deux relances.
2. **Diagnostiquez avant de réessayer.** Demandez-vous pourquoi la réponse a raté sa cible. Les causes
   habituelles : une information manquante (l’assistant a deviné), un mauvais format ou une mauvaise
   longueur, une réponse trop générique (pas d’objectif ni de public), ou un malentendu sur la tâche.
   Chacune a une solution différente.
3. **Donnez un retour précis.** « Pas bien, recommence » ne donne rien à l’assistant. « Plus court,
   supprime le deuxième paragraphe et rends le ton moins formel » si. Dites ce qu’il faut garder autant
   que ce qu’il faut changer.
4. **Laissez l’assistant vous poser des questions.** Quand vous ne savez pas quoi ajouter, demandez :
   « Avant de répondre, pose-moi les questions dont tu as besoin pour bien faire ça. » Cela transforme le
   contexte manquant en une courte interview.
5. **Sachez quand repartir de zéro.** Dans une longue conversation pleine de tentatives rejetées, les
   erreurs précédentes peuvent continuer à ressurgir. Ouvrir une nouvelle conversation avec un seul prompt
   amélioré, qui inclut ce que vous avez appris, est souvent plus rapide que d’empiler les corrections.

## Teaching notes
- Analogie qui fonctionne : **un coiffeur**. Si la coupe n’est pas bonne, vous ne partez pas sans rien dire,
  et vous ne dites pas juste « raté ». Vous dites « un peu plus court sur les côtés, gardez le dessus ».
  Un retour précis, étape par étape.
- Démo en direct : donnez volontairement une réponse médiocre à une demande vague de l’apprenant, puis
  guidez-le pour la diagnostiquer (laquelle des causes de l’idée 2 ?) et écrire une relance. Montrez la
  réponse améliorée.
- Idée reçue : « si la première réponse est mauvaise, l’IA n’en est pas capable ». Souvent la demande
  manquait simplement d’informations. Tentez un tour de diagnostic et de correction avant de conclure.
- Idée reçue : « régénérer encore et encore le même prompt finira par marcher ». Redemander peut donner une
  réponse différente, mais sans changer le prompt, vous lancez juste les dés. Changez quelque chose.
- L’idée du « nouveau départ » renvoie à Les bases de l’IA : le modèle travaille à partir de ce qui est dans
  la conversation, donc une conversation pleine de mauvaises tentatives fait partie de ce qu’il voit.
- Avec des utilisateurs expérimentés, concentrez-vous sur les idées 4 et 5, qu’ils utilisent le moins.

## Check your understanding
1. Un assistant vous a écrit un message d’anniversaire beaucoup trop long et formel. Quelle relance enverriez-vous ?
   Good answer: un retour précis qui nomme les changements (ex. « fais-le en 2 phrases, chaleureux et décontracté, garde la blague sur… »), pas seulement « recommence ».
2. Citez deux raisons différentes pour lesquelles une réponse peut rater sa cible, et comment vous corrigeriez chacune.
   Good answer: deux causes parmi information manquante (ajouter le contexte), mauvais format ou longueur (demander le format), trop générique (ajouter objectif ou public), tâche mal comprise (reformuler plus clairement), chacune associée à une correction adaptée.
3. Quand vaut-il mieux ouvrir une nouvelle conversation plutôt que corriger encore ?
   Good answer: quand la conversation compte beaucoup de tentatives ratées ou a dérivé, si bien que les anciennes erreurs reviennent ; un prompt neuf et amélioré qui intègre ce qu’on a appris fonctionne mieux.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait transformer un retour vague (« c’est nul ») en
une relance précise qui nomme ce qu’il faut changer et ce qu’il faut garder.

## Going further
- Leçon suivante : les erreurs de prompt les plus courantes et comment les éviter.
