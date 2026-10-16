---
id: evaluating-ai-output/03-what-makes-a-good-test-set
title: Ce qui fait un bon jeu de test
level: intermediate
estimatedMinutes: 15
objectives:
  - Décrire ce que contient un bon jeu de test
  - Repérer les faiblesses d’un jeu de test qui paraît correct
  - Expliquer pourquoi les cas utilisés pour ajuster un prompt cessent de mesurer sa qualité
prerequisites:
  - evaluating-ai-output/02-defining-good
---

## Key ideas
1. **Un bon jeu de test ressemble à l’usage réel.** Ses cas emploient les mots, le désordre et le mélange de
   sujets qu’apportent les vrais utilisateurs : fautes de frappe, phrases inachevées, longs textes collés.
   Des cas propres, inventés par l’auteur du prompt, flattent le résultat, car ce sont ceux pour lesquels
   le prompt a été imaginé.
2. **Il est varié et comprend des cas difficiles.** En plus des demandes typiques, un bon jeu contient les
   cas délicats : questions ambiguës, informations manquantes, entrées très longues ou très courtes, autre
   langue, demandes que l’assistant doit refuser, et cas où le bon comportement est de dire « je ne sais
   pas ». Un jeu de cas faciles dit « super » de tout.
3. **Chaque cas dit à quoi ressemble le bon résultat.** Pour certains, il y a une seule bonne réponse (une
   date, une catégorie). Pour d’autres, une courte liste de points qui doivent apparaître ou ne doivent pas
   apparaître, tirée des critères. Sans cela, juger chaque cas redevient un débat.
4. **La taille compte moins que la couverture, mais le petit a des limites.** Quelques dizaines de cas bien
   choisis sont un bon départ, bien meilleur que trois. Mais un petit jeu ne peut pas montrer de petites
   différences entre deux options : un écart d’un cas sur vingt peut être de la chance. Le jeu doit
   grandir à mesure que vous rencontrez de nouvelles situations.
5. **Ne réglez pas sur les cas avec lesquels vous testez.** Si vous ajustez un prompt jusqu’à ce qu’il réussisse
   ces cas, vous lui apprenez à réussir ces cas, et le score ne dit plus comment il se comportera sur des
   cas nouveaux. Gardez de côté des cas sur lesquels vous n’ajustez jamais, et servez-vous-en pour vérifier la
   version finale. Traitez avec soin les données de vraies personnes quand vous constituez des cas (voir
   *Utiliser l’IA en toute sécurité et avec discernement*).

## Teaching notes
- Analogie : un examen de conduite passé sur le parking vide où l’élève s’est entraîné. Il dit que l’élève sait
  conduire là, pas sur une route mouillée avec de la circulation.
- Scénario à raisonner avec l’apprenant (rien à collecter) : une équipe de support a un jeu de huit questions
  qu’elle a écrites elle-même, toutes bien formulées et sur le produit principal. Demandez ce qui manque et
  quels trois cas elle ajouterait d’abord.
- Second scénario : un prompt a été reformulé jusqu’à réussir les dix cas de test. Demandez ce que l’équipe
  peut en conclure, et ce qu’elle ne peut pas conclure.
- Idée reçue : « plus il y a de cas, mieux c’est ». Dix cas réfléchis valent mieux que cent quasi-copies.
- Idée reçue : « le jeu de test est terminé une fois construit ». Les nouveaux échecs de l’usage réel doivent
  y entrer (leçon 6).
- Débutants dans le cours : idées 1, 2 et 5 avec le scénario du support. Apprenants expérimentés : discutez de
  la part de cas difficiles et de la mise de côté d’un groupe de cas.
- Ne donnez pas de nombre précis de cas comme règle : cela dépend de l’enjeu et de la variété.
- Rythme : terminez par le scénario « reformulé jusqu’à réussir », c’est celui qui surprend.

## Check your understanding
1. Une équipe teste son assistant sur vingt questions écrites par ses développeurs, toutes claires et sur le
   sujet principal. Nommez deux faiblesses de ce jeu.
   Good answer: il ne ressemble pas à l’usage réel (propre, écrit par des initiés) et il n’a pas de cas
   difficiles (ambigus, désordonnés, hors sujet), donc les résultats paraîtront meilleurs que la réalité.
2. Nommez trois sortes de cas difficiles que doit contenir un bon jeu de test pour un assistant de support client.
   Good answer: par exemple une question peu claire, une demande hors de son périmètre qu’il doit refuser, une
   information manquante, un message en colère, une autre langue, un très long message.
3. Un prompt a été modifié jusqu’à réussir les cinquante cas de test. Un responsable dit « cinquante sur
   cinquante, c’est prêt ». Que répondriez-vous ?
   Good answer: le prompt a été ajusté sur ces cas, donc le score ne dit plus comment il se comporte sur des cas
   nouveaux ; vérifier sur des cas mis de côté qui n’ont jamais servi à l’ajuster.

## Completion criteria
L’apprenant peut nommer les caractéristiques d’un bon jeu de test (réaliste, varié avec des cas difficiles,
chacun avec une définition du bon résultat), trouver les défauts d’un jeu décrit, et expliquer pourquoi des cas
sur lesquels on a ajusté ne peuvent pas confirmer la qualité (vérifications 1-3).

## Going further
- La leçon « Vie privée : ce qu’il ne faut pas coller dans un chat » d’*Utiliser l’IA en toute sécurité et avec
  discernement* s’applique aux exemples réels utilisés comme cas de test.
- Sujet à explorer : pourquoi les chercheurs gardent un jeu de côté qui ne sert jamais à l’entraînement ni à
  l’ajustement.
