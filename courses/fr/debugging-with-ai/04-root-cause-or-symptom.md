---
id: debugging-with-ai/04-root-cause-or-symptom
title: Cause racine ou symptôme ?
level: intermediate
estimatedMinutes: 15
objectives:
  - Distinguer une correction qui supprime la cause de celle qui fait taire le symptôme
  - Reconnaître les corrections qui masquent les symptômes que proposent couramment les assistants
  - Utiliser des « pourquoi ? » répétés pour atteindre la cause racine
prerequisites:
  - debugging-with-ai/03-hypotheses-not-guesses
---

## Key ideas
1. **Faire disparaître l’erreur n’est pas le but.** Le **symptôme** est ce que vous voyez (un plantage, une
   valeur fausse) ; la **cause racine** est la raison pour laquelle cela arrive (des mauvaises données
   acceptées en amont, une mauvaise hypothèse, un cas manquant). Une correction qui supprime le symptôme
   sans la cause laisse le bug en place, en général plus discret et plus difficile à trouver plus tard.
2. **Connaissez les silencieux.** Les assistants sont entraînés à vous donner du code qui fonctionne, et le
   moyen le plus rapide d’y arriver est souvent de cacher le problème. Méfiez-vous de : intercepter toutes
   les exceptions et continuer ; un test qui retourne tôt ou utilise une valeur par défaut quand des
   données manquent ; une validation retirée ou assouplie ; des conversions de type forcées partout ; des
   nouvelles tentatives, des délais ou des temps d’attente plus longs ajoutés ; et des tests modifiés (vu
   dans Les assistants de code IA en pratique : un test modifié pour passer cache le bug).
3. **Demandez « pourquoi ? » jusqu’à ce que ça ne concerne plus le code.** « Ça plante parce que `price`
   est vide. Pourquoi est-il vide ? Parce que l’import garde des lignes sans prix. Pourquoi ? Parce que
   personne ne valide le fichier. » La correction va au « pourquoi » le plus profond sur lequel vous pouvez
   agir, ici la validation de l’import, pas la ligne qui a planté.
4. **Certains garde-fous sont corrects, s’ils sont honnêtes.** Une valeur par défaut ou une exception
   interceptée est un choix de conception valide quand des données manquantes sont normales et attendues.
   La différence : une vraie correction gère le cas exprès et le dit (une erreur claire, un journal, une
   valeur par défaut documentée) ; un silencieux fait juste cesser le bruit.
5. **Demandez à l’assistant de justifier la correction.** « Quelle cause ce changement traite-t-il ? Que
   devient maintenant la mauvaise entrée qui a causé le plantage ? Existe-t-il une correction plus près de
   la source ? » Une correction qui ne peut pas expliquer ce qu’il advient du mauvais cas est probablement
   un silencieux.

## Teaching notes
- Analogie qui fonctionne : **un détecteur de fumée**. Retirer la pile arrête le bruit ; trouver ce qui
  brûle, c’est la correction. Parfois l’alarme est trop sensible et doit être déplacée, mais vous le
  décidez après avoir cherché le feu, pas à la place.
- Montrez une paire concrète en Python (ou dans le langage de l’apprenant) : `try: ... except Exception:
  pass` autour de l’appel qui plante, contre la validation des données là où elles sont lues avec une
  erreur claire levée à cet endroit.
- Idée reçue : « le code défensif est toujours bon ». Les garde-fous qui cachent des états inattendus font
  voyager les bugs plus loin de leur cause, ce qui les rend plus difficiles à déboguer plus tard.
- Idée reçue : « l’erreur a disparu, donc la correction a marché ». Elle a peut-être seulement bougé : les
  mauvaises données atteignent maintenant un rapport, une base de données ou un utilisateur au lieu de
  planter.
- Ne réenseignez pas les tests affaiblis : une ligne rappelant qu’un test modifié pour passer cache le bug,
  puis passez à la suite. Si l’apprenant n’a pas suivi Les assistants de code IA en pratique, donnez l’idée
  en une phrase et nommez ce cours.
- Apprenants expérimentés : discutez du moment où un garde-fou est le bon choix de conception (idée 4) avec
  des cas de leur propre travail, comme des champs optionnels ou des réseaux peu fiables.

## Check your understanding
1. L’assistant corrige un plantage en enveloppant l’appel dans un bloc qui intercepte toutes les exceptions et ne fait rien. Pourquoi est-ce un problème ?
   Good answer: cela masque le symptôme sans corriger la cause ; les mauvaises données ou le mauvais état restent, les échecs deviennent silencieux et le bug resurgit plus tard à un endroit plus difficile à retracer.
2. Citez trois types de changements qui peuvent faire disparaître une erreur sans corriger sa cause.
   Good answer: trois éléments parmi intercepter toutes les exceptions, retours anticipés ou valeurs par défaut pour des données manquantes, validation retirée ou assouplie, conversions de type forcées, nouvelles tentatives, délais ou temps d’attente plus longs, tests modifiés pour passer.
3. Le total d’une commande plante parce qu’une remise vaut `None`. Comment trouvez-vous où va la vraie correction ?
   Good answer: demander « pourquoi ? » à répétition (pourquoi est-ce `None`, où a-t-elle été produite, pourquoi cela a-t-il été permis) et corriger à la cause la plus profonde sur laquelle on peut agir, comme là où la remise est calculée ou les données validées, pas seulement là où ça a planté.

## Completion criteria
L’apprenant répond correctement aux vérifications, sait nommer les silencieux courants et peut expliquer,
pour une correction donnée, quelle cause elle traite et ce qu’il advient du mauvais cas.

## Going further
- La technique des « cinq pourquoi », utilisée dans l’analyse des causes racines.
- « Fail fast », un principe de conception visant à faire apparaître les problèmes près de leur cause.
- Leçon suivante : prouver que la correction fonctionne vraiment.
