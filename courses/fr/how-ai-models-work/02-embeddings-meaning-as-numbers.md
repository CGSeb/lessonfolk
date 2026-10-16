---
id: how-ai-models-work/02-embeddings-meaning-as-numbers
title: "Les embeddings : le sens en nombres"
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer ce qu’est un embedding et pourquoi des sens proches se retrouvent proches
  - Décrire comment un modèle utilise les embeddings à l’intérieur, et comment les outils de recherche les utilisent à l’extérieur
  - Nommer ce que les embeddings captent et ce qu’ils ne captent pas
prerequisites:
  - how-ai-models-work/01-text-to-tokens
---

## Key ideas
1. **Un numéro de token ne dit rien du sens.** Le numéro de « chat » pourrait très bien se
   trouver à côté de celui de « taxe ». Pour travailler avec le sens, le modèle remplace
   d’abord chaque token par une longue liste de nombres appelée *embedding*. Voyez-le comme les
   coordonnées du token sur une immense carte du sens.
2. **Proche sur la carte veut dire proche par le sens.** « Chat » se retrouve près de « chaton »
   et de « chien », loin de « facture ». Personne ne place les mots à la main : les coordonnées
   sont apprises pendant l’entraînement, car des mots utilisés dans des situations semblables
   finissent par avoir besoin de coordonnées semblables pour prédire le texte autour d’eux.
3. **La carte a des centaines ou des milliers de directions, pas deux.** C’est pourquoi elle
   peut contenir plusieurs sortes de proximité à la fois (sujet, ton, grammaire, registre).
   On ne peut pas se la représenter, mais on peut raisonner avec la distance : proche veut
   dire semblable, loin veut dire différent.
4. **Le contexte remodèle le sens.** À l’intérieur du modèle, les coordonnées de départ d’un
   mot sont ajustées par les mots qui l’entourent : « avocat » dans « avocat général » et dans
   « salade d’avocat » finissent à des endroits différents. C’est en grande partie ce qui
   permet à un modèle d’exploiter toute la conversation.
5. **Les embeddings servent aussi hors du modèle.** Un texte entier, pas seulement un mot,
   peut être transformé en un seul embedding. Comparer les embeddings d’une question et de
   nombreux documents permet de retrouver les documents les plus proches par le sens, même
   sans mot en commun. Cette « recherche par le sens » est l’une des deux façons de retrouver
   des passages dans la technique de réponse à partir de documents (RAG) vue dans *Agents IA
   et outils*, l’autre étant la recherche par mots-clés.
6. **Ils captent la ressemblance, pas la vérité.** Deux phrases peuvent être proches parce
   qu’elles parlent du même sujet tout en disant le contraire. Et les embeddings absorbent
   les régularités du texte dont ils sont issus, y compris ses biais.

## Teaching notes
- Analogie : un plan de ville où chaque commerce est placé selon ce qu’il vend. Les boulangeries
  se regroupent, les cabinets d’avocats aussi. Imaginez maintenant que le plan ait
  1 000 directions au lieu de deux : des commerces peuvent être proches à la fois par ce qu’ils
  vendent, leurs prix et leurs horaires.
- Démonstration : donnez trois mots (« chaton », « chiot », « crédit immobilier ») et demandez
  quels deux sont les plus proches, et pourquoi. Demandez ensuite comment un ordinateur, qui
  n’a que des nombres, pourrait le savoir.
- Idée reçue : « le modèle stocke une définition de dictionnaire pour chaque mot ». Il a des
  coordonnées apprises à partir de l’usage, pas des définitions.
- Idée reçue : « proche veut dire vrai ou d’accord ». Une phrase et sa négation sont en général
  très proches : dites-le explicitement à l’idée 6.
- Pas de maths : ni vecteurs, ni distances, ni formules. « Coordonnées » et « proche » suffisent.
  Pour les apprenants avancés, mentionnez que « à quel point c’est proche » se mesure avec une
  formule simple, sans la donner.
- Ne donnez pas la taille des embeddings de modèles précis : elle change.
- Rythme : passez le plus de temps sur les idées 2 et 5 ; les 3 et 4 tiennent en une phrase
  chacune pour un apprenant pressé.

## Check your understanding
1. Pourquoi un modèle transforme-t-il chaque token en embedding plutôt que d’utiliser
   directement le numéro du token ?
   Good answer: le numéro du token ne porte aucun sens ; l’embedding place le token sur une
   carte où les sens proches sont proches, ce avec quoi le modèle peut calculer.
2. Une entreprise veut que son personnel retrouve la bonne page de procédure en tapant une
   question avec des mots courants, même si la page emploie d’autres mots. En quoi les
   embeddings peuvent-ils aider ?
   Good answer: transformer la question et chaque page en embeddings et renvoyer les pages les
   plus proches par le sens, sans avoir besoin de mots-clés communs.
3. Quelqu’un dit : « Ces deux phrases sont proches dans l’espace des embeddings, donc elles
   sont d’accord. » Qu’est-ce qui ne va pas ?
   Good answer: la proximité traduit un sujet ou une formulation semblables, pas un accord ni
   la vérité ; des affirmations contraires sur le même sujet peuvent être très proches.

## Completion criteria
L’apprenant peut décrire un embedding comme une position apprise sur une carte du sens, donner
un usage à l’intérieur et un à l’extérieur du modèle, et énoncer une limite (vérifications 1-3).

## Going further
- La leçon « Donner vos données à un modèle (les bases du RAG) » d’*Agents IA et outils*
  montre la recherche par le sens à l’œuvre.
- Sujet à explorer : pourquoi le « sens » appris à partir de textes reflète les biais de ces
  textes (voir *Utiliser l’IA en toute sécurité et avec discernement*).
