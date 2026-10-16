---
id: evaluating-ai-output/06-evaluating-in-real-use
title: Évaluer en conditions réelles
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer pourquoi les vérifications avant le lancement ne suffisent pas et comment l’usage réel nourrit l’évaluation
  - Décrire comment juger des agents en plusieurs étapes, et pas seulement leurs réponses finales
  - Dire ce qu’une évaluation ne peut pas révéler, et quand les personnes doivent garder la main
prerequisites:
  - evaluating-ai-output/05-comparing-and-regressions
---

## Key ideas
1. **Les vrais utilisateurs apportent des cas que vous n’aviez pas prévus.** Un jeu de test est un pari sur l’avenir.
   Une fois un outil d’IA en service, regardez des échanges réels (dans le respect de la vie privée), des signaux
   comme les corrections, les plaintes, les pouces vers le bas et les demandes de passer à un humain, et ce que les
   utilisateurs font ensuite. Cela montre où il déçoit vraiment.
2. **Transformez chaque échec réel en cas de test.** Quand quelque chose tourne mal à l’usage, ajoutez ce cas au jeu
   de test, avec une note sur ce que serait le bon résultat. Le jeu grandit à partir de la réalité, la même erreur est
   repérée la fois suivante, et d’anciens problèmes ne peuvent pas revenir sans qu’on le remarque.
3. **Jugez les agents sur le résultat et sur le chemin.** Un agent qui utilise des outils en plusieurs étapes (vu dans
   *Agents IA et outils*) peut arriver à un bon résultat par un mauvais chemin, ou à un mauvais résultat par un chemin
   raisonnable. Vérifiez si l’objectif a été atteint, mais aussi quels outils il a utilisés, s’il a sauté des
   vérifications, pris des actions risquées, tourné en boucle ou trop dépensé. Les erreurs s’accumulent au fil des
   étapes (voir « Où les agents échouent » dans ce cours) : regardez chaque étape.
4. **Quand une erreur coûte cher, les personnes gardent la main.** Pour la santé, le droit, l’argent ou les décisions
   concernant des personnes, une évaluation aide à choisir et à surveiller un outil, mais elle ne remplace pas la
   relecture des résultats importants. Les scores nourrissent le jugement humain, ils ne le remplacent pas.
5. **Sachez ce qu’une évaluation ne dit pas.** Elle ne mesure que ce que vous avez pensé à inclure. Un score élevé ne
   veut pas dire « sûr » ou « marche partout », et il vieillit à mesure que l’usage et les modèles changent. De petites
   vérifications répétées souvent valent mieux qu’une grosse faite une fois. Gardez l’effort à la mesure de l’enjeu.

## Teaching notes
- Analogie : l’inspection d’un restaurant avant son ouverture, et l’écoute chaque semaine des clients et de la
  cuisine ensuite. Les deux sont nécessaires, et les plaintes de la seconde améliorent la première.
- Scénario à raisonner avec l’apprenant (rien à mettre en place) : un assistant interne est lancé avec un bon score
  de test. Au bout d’un mois, le personnel signale qu’il donne des règles de congés périmées. Demandez ce que
  l’équipe doit faire de ce signalement, et ce que cela dit du jeu de test.
- Second scénario : un agent réserve des réunions pour une équipe et son agenda final paraît correct. Demandez ce
  que l’équipe doit encore vérifier dans les étapes qu’il a suivies.
- Idée reçue : « on a testé avant le lancement, on a fini ». Les usages évoluent, et le monde change.
- Idée reçue : « un bon score veut dire que c’est sûr ». Un score couvre ce qui a été testé, rien de plus.
- Respectez la vie privée : des conversations réelles peuvent contenir des données personnelles, donc les relire
  demande un motif légitime, un accès minimal et de la prudence (voir *Utiliser l’IA en toute sécurité et avec
  discernement*).
- Débutants dans le cours : idées 1, 2 et 5. Apprenants expérimentés : idées 3 et 4, avec des exemples tirés de leurs
  outils.
- Ne nommez ni produits de supervision, ni seuils de métriques.
- Rythme : terminez par les deux scénarios, ils relient tout le cours.

## Check your understanding
1. Pourquoi un bon score avant le lancement ne suffit-il pas ?
   Good answer: le jeu de test est un pari sur l’usage ; les vrais utilisateurs apportent des cas imprévus, et les
   modèles et les besoins changent, donc la qualité doit être surveillée à l’usage.
2. Le personnel signale une mauvaise réponse de l’assistant. Que doit-il advenir de ce signalement ?
   Good answer: l’examiner, corriger ce qui l’a causée, et l’ajouter comme nouveau cas de test avec le bon
   comportement attendu, pour que l’erreur soit repérée lors des vérifications futures.
3. Un agent est arrivé au bon résultat final, mais vous constatez qu’il a utilisé un outil qu’il n’aurait pas dû,
   avec des données de clients. Pourquoi est-ce important, et qu’est-ce que cela montre sur l’évaluation des agents ?
   Good answer: un bon résultat peut cacher un chemin risqué ; il faut juger les agents sur leurs étapes et leur usage
   des outils, pas seulement sur la réponse finale.
4. Donnez une situation où vous ne vous fieriez pas seulement à une IA juge et à un score, et dites pourquoi.
   Good answer: un contenu à fort enjeu, médical, juridique, financier ou concernant des personnes, parce que les
   erreurs coûtent cher, que les scores peuvent se tromper ou manquer des cas, et qu’une personne doit relire.

## Completion criteria
L’apprenant peut expliquer comment l’usage réel nourrit le jeu de test, juger des agents sur le résultat et sur le
chemin, nommer des situations qui demandent une relecture humaine, et énoncer les limites d’une évaluation
(vérifications 1-4).

## Going further
- La leçon « Garde-fous et supervision humaine » d’*Agents IA et outils* traite de la façon de garder les personnes aux
  commandes des actions d’un agent.
- La leçon « Où les agents échouent » du même cours explique comment les erreurs s’accumulent au fil des étapes.
