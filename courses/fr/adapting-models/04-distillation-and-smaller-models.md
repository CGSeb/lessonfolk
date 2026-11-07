---
id: adapting-models/04-distillation-and-smaller-models
title: La distillation et les modèles plus petits
level: advanced
estimatedMinutes: 20
objectives:
  - Expliquer comment la distillation entraîne un modèle plus petit à partir d’un plus grand
  - Juger quand la distillation est rentable et où l’élève échoue
  - Nommer des alternatives moins coûteuses à la distillation
  - Vérifier les conditions qui s’appliquent aux sorties du professeur
prerequisites:
  - adapting-models/03-data-for-fine-tuning
---

## Key ideas
1. **Un professeur écrit les exemples, un élève les apprend.** Dans la *distillation*, un grand
   modèle compétent (le *professeur*) répond à de nombreuses entrées réelles de votre tâche, et un
   modèle bien plus petit (l’*élève*) est fine-tuné sur ces réponses. Le but est d’approcher la
   qualité du professeur sur cette seule tâche, au coût et à la vitesse de l’élève. C’est du
   fine-tuning (leçon 2) dont les données d’entraînement viennent d’un modèle plutôt que de
   personnes.
2. **Elle est rentable à grand volume, sur une tâche stable et précise.** Un modèle plus petit
   coûte moins par appel, répond plus vite, et peut tourner sur vos propres serveurs, voire sur un
   appareil, ce qui garde les données en interne. Ces économies s’additionnent quand la tâche se
   répète un grand nombre de fois et change peu ; pour quelques centaines d’appels par mois, le
   travail de distillation se rembourse rarement.
3. **L’élève ne vaut que ce qu’on lui a montré.** Il réussit bien sur des entrées semblables à
   celles de son jeu d’entraînement et décroche plus vite que le professeur en dehors : un nouveau
   produit, une demande inhabituelle, un changement de politique. Il dépasse rarement le
   professeur, et il copie ses erreurs : filtrez les réponses du professeur par des contrôles ou
   des relectures avant d’entraîner dessus, et gardez un jeu de test de cas réels, y compris des
   nouveaux.
4. **Essayez d’abord les façons moins coûteuses de réduire la taille.** Un modèle plus petit avec
   un bon prompt et une recherche documentaire peut déjà suffire : testez-le avant d’entraîner quoi
   que ce soit. Le *routage* envoie les demandes faciles à un petit modèle et les difficiles à un
   grand. La *quantification* stocke les nombres d’un modèle avec moins de précision, pour qu’il
   prenne moins de mémoire et tourne plus vite, généralement avec une petite perte de qualité.
   Ces options peuvent se combiner avec la distillation ou la rendre inutile.
5. **Vérifiez les conditions des deux côtés.** Les conditions de certains fournisseurs interdisent
   d’utiliser les sorties de leurs modèles pour construire des modèles concurrents, et les modèles
   open-weight sont publiés sous des licences qui diffèrent sur ce qu’elles autorisent. Lisez les
   conditions du professeur avant de générer des données d’entraînement, et la licence de l’élève
   avant de le déployer.

## Teaching notes
- Analogie qui fonctionne : **un expert chevronné qui écrit un guide de terrain pour les
  juniors**. Les juniors traitent bien et à moindre coût les cas courants en suivant le guide ; un
  cas que le guide n’a jamais couvert demande toujours l’expert.
- Cas suivi : l’équipe de support obtient maintenant de bons brouillons d’un grand modèle, mais à
  des dizaines de milliers de tickets par mois, le coût et le délai sont trop élevés. La
  distillation convient : gros volume, tâche assez stable, professeur dont on peut vérifier les
  réponses. Puis un nouveau produit sort, et les brouillons de l’élève à son sujet sont mauvais.
  Demandez à l’apprenant pourquoi et que faire (ajouter de nouveaux exemples du professeur,
  réentraîner, et en attendant router les tickets du nouveau produit vers le grand modèle).
- Idée reçue : « l’élève devient aussi bon que le professeur ». Sur sa tâche précise, il peut s’en
  approcher ; en dehors, c’est un petit modèle.
- Idée reçue : « plus petit veut dire moins bien ». Pour une tâche précise et bien définie, un
  petit modèle adapté peut être le meilleur choix une fois le coût et la vitesse pris en compte.
- Les apprenants expérimentés connaissent peut-être le sens d’origine de la distillation
  (entraîner l’élève sur les probabilités du professeur, pas seulement sur ses réponses finales).
  Mentionnez-le comme la forme classique ; avec un professeur fermé, seules les réponses sont
  généralement disponibles.
- Ne citez ni tailles de modèles, ni prix, ni chiffres de vitesse, et n’interprétez pas les
  licences : dites à l’apprenant de les lire.
- Rythme : le scénario du nouveau produit porte la leçon.

## Check your understanding
1. Expliquez la distillation avec vos mots, en prenant l’équipe de support comme exemple.
   Good answer: le grand modèle rédige des brouillons de réponse à de nombreux tickets réels, les brouillons sont vérifiés, et un modèle plus petit est fine-tuné dessus pour produire des réponses semblables plus vite et à moindre coût.
2. Quand la distillation est-elle rentable, et quand ne vous en donneriez-vous pas la peine ?
   Good answer: elle est rentable pour une tâche précise, stable et à gros volume où le coût, la vitesse ou l’exécution en interne comptent ; pas pour de petits volumes, des tâches qui changent souvent, ou quand un modèle plus petit avec un bon prompt suffit déjà.
3. Après la distillation, l’élève rédige de mauvais brouillons pour les tickets sur un produit qui vient de sortir. Pourquoi, et que feriez-vous ?
   Good answer: l’élève n’a appris que les cas de ses données d’entraînement et se dégrade en dehors ; router ces tickets vers le grand modèle pour l’instant, collecter des réponses vérifiées du professeur sur le nouveau produit, réentraîner et tester sur de nouveaux cas.
4. Nommez deux façons de réduire le coût ou le délai qui ne demandent pas de distillation.
   Good answer: deux parmi : un modèle plus petit avec un bon prompt et une recherche documentaire, le routage des demandes faciles vers un petit modèle et des difficiles vers un grand, la quantification, des prompts plus courts ou la mise en cache.

## Completion criteria
L’apprenant répond correctement aux questions, explique les rôles du professeur et de l’élève,
juge quand la distillation est rentable et où l’élève échoue, et nomme des alternatives et les
conditions à vérifier (vérifications 1-4).

## Going further
- Sujets : la distillation de connaissances, le routage entre modèles, la quantification.
- Leçon suivante : décider si une adaptation en vaut la peine, et la faire vivre.
