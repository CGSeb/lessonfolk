---
id: how-ai-models-work/05-reasoning-models
title: "Les modèles de raisonnement : réfléchir avant de répondre"
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer ce qu’un modèle de raisonnement fait différemment d’un modèle standard
  - Décider quand un modèle de raisonnement vaut son surcroît de temps et de coût
  - Énoncer les limites d’un raisonnement affiché
prerequisites:
  - how-ai-models-work/04-post-training
---

## Key ideas
1. **Un modèle standard répond d’un coup ; un modèle de raisonnement écrit d’abord son
   travail.** Avant la réponse finale, il produit un long passage de texte intermédiaire
   (planification, essais d’approches, vérifications). Ce texte est généré token par token comme
   n’importe quel autre, et il donne au modèle la place de travailler par étapes au lieu de
   sauter à une réponse.
2. **Pourquoi écrire des étapes aide.** Chaque token est produit avec une quantité fixe de
   calcul. Un problème difficile ne se résout pas en un seul token, mais il peut se résoudre en
   des centaines, chacun s’appuyant sur les précédents. C’est pourquoi demander à un modèle
   standard de « réfléchir étape par étape » aide souvent aussi.
3. **Ils sont entraînés pour cela.** Les modèles de raisonnement reçoivent en général un
   entraînement supplémentaire sur des problèmes dont la réponse peut être vérifiée, comme des
   énigmes de maths ou du code qui doit passer des tests, et sont récompensés quand la réponse
   finale est juste. Avec le temps, ils prennent des habitudes comme revenir en arrière quand une
   piste semble mauvaise.
4. **Le prix, c’est du temps et des tokens.** Le texte de réflexion prend du temps à générer et
   compte en général dans le coût. Une recherche rapide ou un court e-mail n’en tirent presque
   rien. Les maths en plusieurs étapes, le code délicat, la planification sous contraintes et
   l’analyse minutieuse en profitent le plus.
5. **Un raisonnement visible est un outil, pas une preuve.** Les étapes affichées peuvent être
   utiles à lire et à vérifier, mais elles ne sont pas un compte rendu garanti de la façon dont
   le modèle est vraiment arrivé à la réponse, et un modèle de raisonnement peut aboutir à une
   mauvaise réponse avec des étapes convaincantes. Vérifiez le résultat, surtout quand l’enjeu
   est élevé.
6. **Souvent, vous pouvez choisir l’effort.** Beaucoup d’outils permettent de régler combien le
   modèle réfléchit, ou de l’activer seulement pour les questions difficiles. Adaptez l’effort
   à la difficulté.

## Teaching notes
- Analogie : répondre à « 17 fois 24 » d’un coup, ou sur une feuille de papier. Même personne,
  même cerveau, mais le papier permet de passer par des étapes. On donne le papier aux modèles
  de raisonnement.
- Démonstration : proposez à l’apprenant un petit casse-tête en plusieurs étapes (par exemple un
  problème de planning avec trois contraintes), puis demandez-lui s’il répondrait tout de suite
  ou s’il noterait des choses.
- Idée reçue : « un modèle de raisonnement est simplement plus intelligent en tout ». Il est
  meilleur sur les problèmes en plusieurs étapes, plus coûteux et plus lent sur les simples ;
  pour l’écriture créative ou courante, le gain est faible.
- Idée reçue : « je peux lire ses pensées, donc je sais pourquoi il a dit ça ». Présentez
  l’idée 5 calmement : les étapes sont utiles, ce n’est pas une fenêtre sur un esprit.
- Ne citez ni modèles précis, ni versions, ni benchmarks, ni prix.
- Débutants : concentrez-vous sur les idées 1, 4 et sur une règle simple (« à utiliser pour les
  tâches difficiles en plusieurs étapes »). Apprenants avancés : discutez de l’entraînement sur
  des réponses vérifiables et de pourquoi il fonctionne le mieux là où l’on peut vérifier.
- Rythme : terminez par la question d’application, c’est ce que l’apprenant réutilisera.

## Check your understanding
1. Que fait un modèle de raisonnement avant de donner sa réponse finale, et pourquoi cela peut-il
   aider ?
   Good answer: il produit des étapes intermédiaires (planifier, essayer, vérifier), ce qui lui
   laisse la place de résoudre par étapes plutôt qu’en un seul bond.
2. Citez une tâche pour laquelle un modèle de raisonnement vaut l’attente supplémentaire et une
   pour laquelle ce n’est pas le cas.
   Good answer: ça vaut le coup pour des maths en plusieurs étapes, du débogage, de la
   planification sous contraintes ; pas pour un fait rapide, une courte réécriture ou une
   discussion courante.
3. Un modèle de raisonnement affiche des étapes claires et sûres d’elles, qui mènent à une
   réponse. Est-ce la preuve que la réponse est juste ? Que feriez-vous ?
   Good answer: non ; les étapes peuvent paraître convaincantes tout en étant fausses ou sans
   refléter le vrai processus ; vérifier le résultat indépendamment, surtout pour les décisions
   importantes.

## Completion criteria
L’apprenant peut expliquer l’écriture d’étapes comme la différence, choisir quand utiliser un
modèle de raisonnement, et dire pourquoi ses étapes visibles ne prouvent pas l’exactitude
(vérifications 1-3).

## Going further
- La leçon « Des hypothèses, pas des suppositions » de *Déboguer avec l’IA* applique la même idée
  de travail par étapes.
- La leçon « Où les agents échouent » d’*Agents IA et outils* montre ce qui se passe quand les
  plans tournent mal.
