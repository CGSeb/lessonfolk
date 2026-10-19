---
id: ai-coding-assistants/06-drive-or-delegate
title: "Conduire ou déléguer : votre méthode de travail"
level: intermediate
estimatedMinutes: 15
objectives:
  - Choisir entre écrire le code soi-même, travailler en binôme avec un assistant et déléguer une tâche
  - Construire une méthode de travail personnelle à partir des habitudes de ce cours
prerequisites:
  - ai-coding-assistants/05-secrets-and-private-code
---

## Key ideas
1. **Trois modes, pas un seul.** **Conduire** : vous écrivez le code, l’assistant suggère ou répond aux
   questions. **Binôme** : vous travaillez pas à pas ensemble, en vérifiant chaque changement.
   **Déléguer** : vous confiez une tâche bien spécifiée et vous relisez le résultat. Les bons développeurs
   changent de mode plusieurs fois par jour.
2. **Déléguez ce qui est clair et facile à vérifier.** Code répétitif, changements répétitifs dans
   plusieurs fichiers, tests pour un comportement convenu, petits scripts, explications de code inconnu,
   premiers jets de documentation. La tâche est bien spécifiée, et une erreur est facile à repérer et peu
   coûteuse à annuler.
3. **Conduisez ce qui est critique, flou ou nouveau pour vous.** Décisions de conception centrales, code de
   sécurité et de paiement, exigences vagues encore en exploration, et compétences que vous apprenez encore.
   Si relire le résultat prendrait plus de temps que l’écrire, écrivez-le. Si vous ne pourriez pas dire si
   le code est juste, vous devez d’abord le comprendre.
4. **Protégez vos propres compétences.** Tout déléguer peut vous laisser incapable de déboguer ou de juger
   le code. Utilisez l’assistant pour apprendre autant que pour produire : demandez-lui d’expliquer, de
   comparer des approches, de vous interroger sur ce qu’il a écrit. C’est vous qui décidez.
5. **Votre méthode est la somme des habitudes.** Briefer avec du contexte (leçon 1), découper et planifier
   (leçon 2), relire le diff (leçon 3), tester et committer petit (leçon 4), garder les secrets dehors
   (leçon 5), et choisir le mode pour chaque tâche. Commencez avec quelques habitudes, remarquez ce qui
   marche pour vous et ajustez.

## Teaching notes
- Analogie qui fonctionne : **la voiture à double commande d’un moniteur d’auto-école**. Parfois vous
  conduisez et le moniteur regarde, parfois vous lui laissez le volant sur une route familière, mais sur le
  col de montagne verglacé vous voulez vos propres mains sur le volant.
- Idée reçue : « le but est de déléguer le plus possible ». Le but est un bon logiciel, livré efficacement ;
  déléguer une tâche que vous ne pouvez pas bien relire déplace le travail vers le débogage plus tard.
- Idée reçue : « utiliser l’IA fait de vous un moins bon développeur ». Cela peut arriver si vous cessez de
  comprendre ce que vous livrez ; utilisée pour expliquer et explorer, elle peut aussi accélérer
  l’apprentissage.
- Demandez à l’apprenant comment il travaille aujourd’hui et construisez l’idée 5 à partir de ses réponses
  plutôt que de réciter la liste ; le résultat doit ressembler à sa méthode, pas à celle du cours.
- C’est la dernière leçon : gardez du temps pour récapituler le cours et célébrer. Suggérez la suite :
  Assistants de code IA pour les équipes : règles, skills et plugins (configurer l’assistant pour toute une
  équipe avec des règles, skills et garde-fous partagés), Comment fonctionnent les applications d’IA (ajouter des fonctionnalités
  d’IA à leurs propres applications) et Agents IA et outils (comment les assistants de type agent
  fonctionnent de l’intérieur).

## Check your understanding
1. Donnez une tâche que vous déléguerez à un assistant et une que vous conduirez vous-même, et expliquez pourquoi.
   Good answer: une tâche déléguée bien spécifiée et facile à vérifier (code répétitif, tests pour un comportement connu, modifications répétitives), et une tâche conduite critique, floue ou difficile à relire (sécurité, conception centrale, exploration d’exigences vagues, compétence en cours d’apprentissage), avec une raison liée à la clarté, au risque ou à la facilité de vérification.
2. Quand est-il plus rapide d’écrire le code soi-même que de le demander à l’assistant ?
   Good answer: quand spécifier et relire le résultat prendrait plus de temps que l’écrire, ou quand on ne pourrait pas juger si le résultat est correct.
3. Décrivez en quelques étapes votre propre méthode pour une tâche typique assistée par l’IA.
   Good answer: couvre la plupart de : briefer avec du contexte, découper ou planifier, choisir un mode, état git propre, tests, relire le diff, committer petit, garder les secrets dehors.

## Completion criteria
L’apprenant répond correctement aux vérifications, sait justifier un choix de mode par la clarté, le risque
et la facilité de vérification, et a décrit une méthode qui utilise les habitudes du cours.

## Going further
- Comment fonctionnent les applications d’IA, pour ajouter des fonctionnalités d’IA à vos propres projets.
- Agents IA et outils, pour comprendre comment les assistants de type agent fonctionnent de l’intérieur.
- Assistants de code IA pour les équipes : règles, skills et plugins, pour partager règles, skills et garde-fous avec toute votre équipe.
