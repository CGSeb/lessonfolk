---
id: debugging-with-ai/01-giving-the-assistant-what-it-needs
title: Donner à l’assistant ce dont il a besoin
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer pourquoi « ça ne marche pas, corrige » mène à des suppositions
  - Rédiger un brief de débogage avec l’erreur, une reproduction et le comportement attendu comparé à l’obtenu
  - Réduire un bug à une reproduction minimale
prerequisites:
  - ai-coding-assistants/06-drive-or-delegate
---

## Key ideas
1. **Pas de preuves, seulement des suppositions.** L’assistant ne sait que ce qui est dans son contexte
   (vu dans Les assistants de code IA en pratique). « Ma connexion est cassée, corrige » le laisse imaginer
   le bug, si bien qu’il propose la correction la plus courante pour le problème le plus courant, qui est
   rarement le vôtre. La qualité de la réponse dépend des preuves que vous lui donnez.
2. **L’erreur exacte, en entier.** Copiez le vrai message d’erreur et toute la trace de pile, pas un
   résumé (« une erreur de null »). La formulation exacte, les noms de fichiers et les numéros de ligne
   sont les indices les plus utiles qui soient. Retirez secrets, jetons et données personnelles des
   journaux avant de les coller (vu dans Les assistants de code IA en pratique), mais ne coupez pas les
   indices.
3. **Attendu contre obtenu.** Dites ce que vous avez fait, ce que vous attendiez et ce qui s’est passé à
   la place : « J’envoie le formulaire avec un e-mail vide ; j’attends un message de validation ; j’obtiens
   une erreur 500. » Beaucoup de bugs n’ont aucun message d’erreur (un total faux, une ligne manquante), et
   cette comparaison est alors tout le rapport de bug.
4. **Une reproduction minimale.** Le plus petit code et les étapes les plus courtes qui montrent encore le
   bug. Coupez tout ce qui n’est pas nécessaire jusqu’à ce que retirer quoi que ce soit de plus fasse
   disparaître le bug. Cela garde l’assistant concentré sur le vrai problème, garde le code privé hors du
   chat et révèle souvent la cause avant même que vous ne demandiez.
5. **Ce qui a changé, et ce que vous avez déjà essayé.** « Ça marchait hier ; depuis, j’ai mis à jour une
   bibliothèque et changé le format de date » désigne directement les suspects. Dites aussi ce que vous
   avez écarté, pour que l’assistant ne le suggère pas à nouveau, et donnez l’environnement qui compte
   (versions du langage et des bibliothèques, système d’exploitation, navigateur).

## Teaching notes
- Analogie qui fonctionne : **appeler un médecin**. « Je me sens mal » donne des conseils génériques ;
  « une douleur vive ici depuis mardi, pire après les repas, j’ai déjà pris des antalgiques » donne un vrai
  diagnostic. L’assistant, comme le médecin, ne peut raisonner qu’à partir des symptômes que vous décrivez.
- Suggérez un modèle réutilisable à l’apprenant : ce que j’ai fait / ce que j’attendais / ce qui s’est
  passé (erreur exacte et trace de pile) / reproduction minimale / ce qui a changé récemment / ce que j’ai
  essayé / environnement.
- Idée reçue : « l’agent peut lire mon projet, donc je n’ai pas besoin d’expliquer ». Un outil de type
  agent peut ouvrir des fichiers et lancer des commandes, mais il ne sait pas quel comportement est faux,
  ce que vous attendiez ni ce qui a changé la semaine dernière. Il a quand même besoin du rapport de bug.
- Idée reçue : « faire une reproduction minimale prend trop de temps ». C’est souvent le chemin le plus
  rapide vers la cause, avec ou sans IA ; beaucoup de bugs sont trouvés en réduisant le code.
- Ne répétez pas les leçons sur le contexte et les secrets de Les assistants de code IA en pratique ;
  rappelez chacune en une phrase. Si l’apprenant n’a pas suivi ce cours, donnez l’idée en une phrase et
  nommez-le comme l’endroit où approfondir.
- Apprenants expérimentés : allez vite sur les idées 1 à 3 et passez le temps sur l’idée 4, avec un vrai
  bug à eux. Apprenants plus novices en débogage : passez plus de temps sur les idées 2 et 3 avec un exemple
  concret.

## Check your understanding
1. Pourquoi « ma page est cassée, corrige » obtient-il en général une mauvaise réponse d’un assistant ?
   Good answer: l’assistant n’a aucune preuve sur ce bug (ni erreur, ni attendu contre obtenu, ni code), il devine donc la cause et la correction les plus courantes, qui peuvent n’avoir rien à voir avec le vrai problème.
2. Le total de votre rapport est faux, mais il n’y a aucun message d’erreur. Que donnez-vous à l’assistant ?
   Good answer: ce qu’on a fait, la valeur attendue et la valeur obtenue (avec les données d’entrée), le code qui la calcule, idéalement sous forme de petite reproduction, plus ce qui a changé récemment.
3. Qu’est-ce qu’une reproduction minimale, et pourquoi vaut-il la peine d’en faire une ?
   Good answer: le plus petit code et les étapes qui montrent encore le bug ; elle garde l’assistant concentré, garde le code sans rapport ou privé hors du chat et révèle souvent la cause d’elle-même.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait lister sans aide ce que contient un bon brief de
débogage : l’erreur exacte, l’attendu contre l’obtenu, une reproduction minimale, les changements récents et
ce qui a déjà été essayé.

## Going further
- « How to create a minimal, reproducible example », un guide bien connu du centre d’aide de Stack Overflow.
- Leçon suivante : lire l’erreur et la trace de pile avec l’assistant.
