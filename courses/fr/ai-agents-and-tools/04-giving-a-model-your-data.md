---
id: ai-agents-and-tools/04-giving-a-model-your-data
title: Donner vos données à un modèle (les bases du RAG)
level: intermediate
estimatedMinutes: 20
objectives:
  - Expliquer la génération augmentée par récupération (RAG) et pourquoi elle est nécessaire
  - Expliquer comment la recherche par mots-clés et la recherche par le sens (embeddings) retrouvent chacune les passages pertinents dans vos propres documents
  - Faire répondre le modèle à partir de ces passages et les lui faire citer
prerequisites:
  - ai-agents-and-tools/03-the-agent-loop
---

## Key ideas
1. **Les modèles ne connaissent pas vos documents.** Un modèle connaît ce qu’il a appris à l’entraînement,
   pas le manuel de votre entreprise ni vos notes. La solution évidente, tout coller dans le prompt (le
   texte que vous envoyez au modèle), échoue souvent : un modèle ne peut lire qu’une quantité limitée de
   texte à la fois, appelée sa **fenêtre de contexte**, et un long document peut ne pas y tenir. Même
   quand il y tient, c’est plus lent, plus coûteux, et la phrase utile peut se perdre dans le tas.
2. **RAG : récupérer, puis générer.** Le **RAG (retrieval-augmented generation, génération augmentée par
   récupération)** consiste à *récupérer* (aller chercher) d’abord les quelques passages qui comptent pour
   cette question, puis à *générer* une réponse à partir d’eux. Pensez à une question posée à un collègue
   sur un manuel de 200 pages : il ne le relit pas en entier, il ouvre l’index, trouve deux pages et répond
   à partir d’elles. La chaîne comporte trois étapes : préparer les documents une fois (les découper en
   **morceaux**, chunks : un paragraphe ou quelques centaines de mots, assez petits pour être utiles seuls),
   récupérer les meilleurs morceaux pour chaque question, puis les mettre dans le prompt avec des
   instructions claires et laisser le modèle répondre.
3. **Récupération par mots-clés.** Le moyen le plus simple de trouver les meilleurs morceaux est de noter
   chacun selon les mots qu’il partage avec la question, en donnant plus de poids aux mots rares
   (« déménagement ») qu’aux mots courants (« le »). Cela ne demande aucun modèle supplémentaire, et l’on
   voit exactement pourquoi un morceau a été choisi. Sa faiblesse : il ne reconnaît que les mots eux-mêmes.
   Une question sur les « congés payés » ne trouve rien dans un morceau qui parle de « jours de vacances »,
   alors que cela veut dire la même chose.
4. **Récupération par le sens (embeddings).** Pour comparer le sens plutôt que les mots, un programme à
   part, un **modèle d’embedding**, transforme un texte en une liste de nombres appelée **embedding**.
   Voyez ces nombres comme les coordonnées du texte sur une carte du sens : des textes qui parlent de la
   même chose ont des coordonnées voisines, même avec des mots différents. On transforme une fois chaque
   morceau en embedding et on les garde ; quand une question arrive, on la transforme aussi en embedding et
   l’on retient les morceaux les plus proches. « Congés payés » tombe alors près de « jours de vacances ».
   Vous ne lisez jamais ces nombres vous-même. L’idée est expliquée dans *Comment fonctionnent vraiment les
   modèles d’IA* (« Les embeddings : le sens en nombres »). Limites : « proche » veut dire « sur le même
   sujet », pas « contient la réponse », et les noms ou codes exacts (un numéro de facture) se trouvent
   souvent mieux par mots-clés. C’est pourquoi les vrais systèmes combinent souvent les deux.
5. **Ancrez la réponse et citez.** Dites au modèle de ne répondre qu’à partir des passages donnés, de dire
   quand ils ne contiennent pas la réponse et de nommer le passage utilisé. Les citations permettent à
   l’utilisateur de vérifier la source (comme dans Utiliser l’IA en toute sécurité et avec discernement).
6. **La récupération peut être un outil.** Dans un agent, `search_documents(query)` n’est qu’un outil de
   plus : le modèle décide quand chercher et quoi chercher, et peut chercher à nouveau avec d’autres mots si
   les premiers résultats n’étaient pas assez bons.

## Teaching notes
- Analogie qui fonctionne : **un examen à livre ouvert**. L’étudiant (le modèle) ne mémorise pas le livre ;
  un bon index (la récupération) indique les bonnes pages, et l’étudiant répond à partir d’elles, en citant
  la page.
- Utilisez un seul exemple fil rouge pendant toute la leçon : un petit manuel d’entreprise de trois courts
  passages, par exemple « Congés annuels : les employés ont 25 jours de congés payés par an »,
  « Déménagement : vous avez 2 jours de congé en plus », « Notes de frais : envoyez vos justificatifs sous
  30 jours ». Demandez « Combien de jours de congé ai-je si je déménage ? » et déroulez chaque étape : quel
  morceau obtient la meilleure note par mots-clés (mots partagés : « jours », « congé », « déménage »/
  « déménagement »), et ce qui change si la question parle d’« allocation de vacances » (les mots-clés
  échouent, le sens fonctionne encore).
- Avant l’idée 4, vérifiez si l’apprenant sait ce qu’est un embedding, sans le supposer. S’il a suivi
  *Comment fonctionnent vraiment les modèles d’IA*, rappelez-le en une phrase. Sinon, utilisez l’analogie de
  la carte (un plan de ville où les commerces sont placés selon ce qu’ils vendent : les boulangeries se
  regroupent) et gardez les maths à l’écart : ni vecteurs, ni formules, ni tailles. « Coordonnées » et
  « voisin » suffisent.
- Définissez chaque terme à sa première apparition : prompt, fenêtre de contexte, morceau, récupérer,
  embedding. N’en employez pas deux dans la même phrase avant que l’apprenant ait rencontré les deux.
- Les deux façons de récupérer comptent. Ne présentez pas les embeddings comme un bonus avancé que
  l’apprenant peut ignorer. S’il les essaie, son outil local ou son fournisseur doit proposer un modèle
  d’embedding ; suivez sa documentation, et ne nommez pas de modèles précis.
- Idée reçue : « le RAG rend les réponses correctes ». Il aide le modèle à utiliser les bonnes
  informations, mais la récupération peut manquer le bon morceau, et le modèle peut quand même mal lire ou
  ajouter des choses. Les citations et « dis quand tu ne sais pas » réduisent le risque ; elles ne le
  suppriment pas.
- Idée reçue : « collez simplement tous les documents ». Trop de texte est lent, coûteux, peut ne pas tenir
  dans la fenêtre de contexte et peut noyer la partie pertinente.
- Idée reçue : « les embeddings comprennent la question comme une personne ». Ils placent seulement un texte
  près de textes semblables ; deux passages sur le même sujet peuvent être proches même si un seul contient
  la réponse.
- Rappelez brièvement que les documents donnés à un modèle hébergé quittent l’ordinateur de l’apprenant
  (leçon sur la vie privée) ; un modèle local les garde en local.
- Rythme : les idées 3 et 4 méritent le plus de temps. Un apprenant pressé peut voir 5 et 6 en une phrase chacune.

## Check your understanding
1. Quel problème le RAG résout-il, et quelles en sont les principales étapes ?
   Good answer: les modèles ne connaissent pas vos documents et ne peuvent pas tous les prendre d’un coup ; le RAG découpe les documents en morceaux, récupère les pertinents pour une question et les donne au modèle pour qu’il réponde à partir d’eux.
2. Un employé pose une question sur l’« allocation de vacances », mais le manuel ne parle que de « congés annuels ». La recherche par mots-clés trouverait-elle le bon passage ? Et la recherche par le sens ? Pourquoi ?
   Good answer: la recherche par mots-clés le rate probablement car les mots diffèrent ; la recherche par le sens (embeddings) le trouve car les deux expressions ont des positions voisines sur la carte du sens, sans avoir besoin d’un mot commun.
3. Avec vos mots, qu’est-ce qu’un embedding, et comment sert-il à choisir les passages pour une question ?
   Good answer: une liste de nombres qui place un texte sur une carte du sens, de sorte que les sens proches soient voisins ; les morceaux et la question sont chacun transformés en embeddings et l’on récupère les morceaux les plus proches de la question.
4. Pourquoi demander au modèle de citer les passages et de dire quand la réponse n’y est pas ?
   Good answer: cela garde la réponse ancrée dans les documents, permet aux utilisateurs de vérifier la source et réduit les réponses inventées quand la récupération n’a rien trouvé de pertinent.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait décrire une chaîne récupération-puis-réponse qui
choisit les passages par mots-clés ou par le sens, les cite et gère une question que les documents ne
couvrent pas.

## Going further
- Sujets : embeddings, recherche vectorielle, stratégies de découpage, recherche hybride.
- Leçon suivante : où les agents échouent.
