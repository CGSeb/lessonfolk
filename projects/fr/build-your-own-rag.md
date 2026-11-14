---
id: build-your-own-rag
title: Construire votre propre RAG et le rendre fiable
level: advanced
theme: building-with-ai
authors: [lessonfolk]
description: Construisez votre propre chaîne de génération augmentée par récupération sur des documents que vous choisissez, de l’extraction aux réponses sourcées, puis mesurez séparément la récupération et les réponses, et corrigez l’étape qui échoue le plus.
estimatedHours: 5
buildsOn: [rag-in-depth, how-ai-apps-work, evaluating-ai-output]
needs:
  - Un ordinateur avec le langage de programmation de votre choix installé, et un éditeur de code
  - Un modèle gratuit pour les réponses et un modèle d’embeddings gratuit, sur votre ordinateur ou via une API hébergée dans son offre gratuite
  - 5 à 30 documents non confidentiels (règlement d’un club, notices de produits, notes de cours, rapports publics)
  - Un tableur pour noter les résultats des tests
  - Un agent de code IA qui modifie votre projet à partir de vos instructions (facultatif, si vous préférez diriger le travail plutôt que taper le code)
---

## Brief
Construisez un système qui répond aux questions à partir d’un ensemble de documents que vous
choisissez, et auquel vous pouvez faire confiance : il trouve les bons passages, répond à
partir d’eux, les cite, et dit quand les documents ne couvrent pas une question. Vous
construisez toute la chaîne vous-même : extraire le texte, le découper en morceaux, les
indexer, récupérer les meilleurs pour une question, et générer une réponse à partir d’eux.
Ensuite, vous mesurez où elle échoue et vous la corrigez.

C’est vous qui choisissez les documents, le langage de programmation et les modèles, locaux ou
hébergés. Vous choisissez aussi comment vous construisez : vous pouvez écrire le code
vous-même, en demandant de l’aide à une application de chat IA si besoin, ou diriger un agent
de code IA qui écrit et modifie le code à partir de vos instructions. Dans les deux cas, c’est
vous qui décidez comment fonctionne chaque étape, vous vérifiez ce qui a été écrit, et vous
devez savoir expliquer chaque étape : chaque jalon vous le demande.

Votre tuteur est votre coach : il explique les idées, vous pose des questions, vous aide à
lire vos résultats et relit vos choix, mais il n’écrira ni la chaîne, ni le jeu de test, ni les
corrections à votre place.

Utilisez des documents non confidentiels et sans données personnelles. Si vous utilisez une
API hébergée, votre clé est un mot de passe : ne la collez jamais dans une conversation ni dans
votre code.

## Milestones
1. **Choisir les documents et concevoir la chaîne.** Choisissez la collection et décidez ce que
   fera chaque étape de la chaîne.
   Done when: l’apprenant nomme la collection et confirme qu’elle ne contient rien de
   confidentiel ni de personnel, explique pourquoi elle demande une récupération plutôt que de
   tenir entière dans le contexte du modèle, dit pour chaque étape (extraction, découpage,
   recherche, génération) ce qu’il prévoit et pourquoi, et dit comment il va construire : en
   écrivant le code lui-même, ou en dirigeant un agent de code IA.
2. **Préparer les documents et y chercher.** Transformez les documents en morceaux qui ont du
   sens seuls, indexez-les, et récupérez les meilleurs pour une question.
   Done when: l’apprenant montre le texte extrait et les morceaux d’un vrai document, chaque
   morceau compréhensible seul et portant sa source (et son titre de section ou autre
   contexte), puis montre une question qui ramène des morceaux classés avec leurs sources, et
   explique son choix de découpage et son type de recherche (par mots-clés, par sens, ou les
   deux).
3. **Générer des réponses appuyées sur les passages.** Envoyez au modèle les morceaux récupérés
   et la question, et obtenez une réponse qui s’appuie sur eux.
   Done when: l’apprenant montre ce que son code envoie au modèle, une réponse qui cite les
   morceaux utilisés, et une question à laquelle les documents ne répondent pas, avec ce que
   fait le système dans ce cas.
4. **Construire un jeu de test et mesurer étape par étape.** Écrivez des questions avec les
   passages qui doivent y répondre, et mesurez séparément la récupération et les réponses.
   Done when: l’apprenant partage au moins 10 questions, chacune avec son passage attendu, dont
   une à laquelle les documents ne répondent pas, une qui demande deux passages et une
   formulée autrement que les documents ; indique combien de fois le passage attendu a été
   récupéré et si chaque réponse était fidèle aux passages récupérés ; et classe chaque échec
   par étape : ingestion, récupération ou génération.
5. **Corriger l’étape la plus faible et dire pour quoi le système est fiable.** Améliorez
   l’étape qui échoue le plus, mesurez à nouveau, et écrivez les limites du système.
   Done when: l’apprenant montre un changement à la fois sur l’étape la plus faible, avec les
   résultats de tout le jeu de test avant et après (y compris les questions qui se sont
   dégradées), dit pour quels types de questions il fait confiance au système et lesquels
   demandent une vérification, et explique comment l’index suivra quand des documents seront
   ajoutés, modifiés ou supprimés.

## Coaching notes
- **Coachez, ne construisez pas.** N’écrivez jamais la chaîne, une de ses étapes, les questions
  de test ou une version corrigée du code de l’apprenant. Quand il bloque, montez une échelle
  d’aide : d’abord une question (« le bon morceau faisait-il partie de ceux que le modèle a
  reçus ? »), puis l’idée utile (vue dans Le RAG en profondeur), et seulement ensuite un court
  exemple de l’idée sur d’autres documents que les siens. Vous pouvez expliquer un message
  d’erreur et dire où chercher, pas coller la correction.
- **Demandez comment il construit, à l’étape 1, et notez-le.** Les étapes sont les mêmes dans
  les deux cas ; votre coaching, non.
  - **Il écrit le code lui-même** : coachez sur le code et les choix. S’il colle du code écrit
    par une IA en chat, demandez-lui de l’expliquer avant de l’utiliser.
  - **Il dirige un agent de code IA** : son travail, ce sont la conception, les instructions,
    les vérifications et les décisions. Coachez sur ces points, et n’écrivez jamais les
    instructions à sa place. Demandez-lui de donner à l’agent une étape à la fois et de
    regarder les vrais morceaux, passages récupérés et prompts, pas seulement les réponses
    finales. Surveillez un agent qui choisit tous les réglages sans le dire, écrit la clé dans
    le code, ou ajoute des étapes que personne n’a demandées.
  - Dans les deux cas, les lignes « Done when: » demandent à l’apprenant d’expliquer chaque
    étape. S’il ne sait pas, demandez-lui d’y revenir avant d’avancer.
- **Étape 1 : trop peu de documents.** Si toute la collection tient facilement dans le
  contexte du modèle, le RAG n’est peut-être pas nécessaire (vu dans « Où un système RAG se
  trompe »). Proposez une collection plus grande ou plus variée, ou acceptez-la comme exercice
  si l’apprenant le dit.
- **Étape 2 : personne ne regarde le texte extrait.** Demandez-lui d’ouvrir le texte extrait
  d’un vrai document avant le découpage : pages scannées sans texte, en-têtes répétés et
  tableaux aplatis sont fréquents (vu dans « Préparer les documents : morceaux et
  métadonnées »). Des morceaux coupés à longueur fixe qui séparent une règle de son titre sont
  l’erreur suivante. Pour la recherche, par mots-clés, par sens avec des embeddings, ou les
  deux : tout est valable ; demandez ce que chacune manquerait sur ses documents (vu dans
  « Recherche hybride et reranking »).
- **Étape 3 : le modèle répond avec ses propres connaissances.** Si les réponses sont justes
  mais absentes des passages, le système n’est pas ancré. Demandez ce que ses consignes disent
  sur l’usage des seuls passages, leur citation, et le fait de dire quand la réponse n’y est
  pas. Le texte récupéré est une donnée, pas une instruction : un document peut contenir du
  texte qui essaie d’orienter le modèle.
- **Étape 4 : une seule note globale.** « 8 réponses justes sur 10 » cache où ça échoue. Insistez
  sur deux mesures : le passage attendu a-t-il été récupéré, et la réponse était-elle fidèle à
  ce qui a été récupéré (vu dans « Évaluer séparément la récupération et les réponses »). S’il
  utilise une IA juge pour la fidélité, demandez-lui de la comparer à sa propre lecture sur
  quelques réponses.
- **Étape 5 : corriger la mauvaise étape.** Modifier le prompt ne répare pas un passage jamais
  récupéré, et une meilleure recherche ne répare pas un morceau qui a perdu son sens. Suivez
  l’ordre du diagnostic : dans les documents sous forme d’un morceau lisible, puis récupéré,
  puis bien utilisé. Un changement à la fois, et relancez tout le jeu : un nouveau découpage
  peut corriger certaines questions et en casser d’autres. Les meilleures requêtes (reformuler
  ou découper la question) sont vues dans « Meilleures requêtes et récupération par agent ».
- **Fraîcheur.** Les documents supprimés sont l’angle mort habituel : un document retiré de la
  source mais encore dans l’index continue d’être cité (vu dans « Le RAG en production :
  fraîcheur, accès et coût »).
- **Ne demandez jamais la clé, et pas de données privées.** Si l’apprenant colle une clé d’API,
  dites-lui de la révoquer et d’en créer une nouvelle, et ne la répétez jamais. Si ses
  documents contiennent finalement des données personnelles ou confidentielles, demandez-lui de
  passer à d’autres documents.
- **Les apprenants expérimentés** peuvent ajouter des filtres de métadonnées (date, version),
  une étape de reranking, ou la date de la source dans chaque réponse, et mesurer si chacun
  vaut la peine sur le jeu de test.
- **Rythme.** Le projet tient en deux ou trois séances, souvent moins avec un agent de code ;
  les étapes 2 et 4 sont les plus longues. Enregistrez des notes après chaque étape pour que la
  séance suivante reparte de là. Vous ne voyez que ce que l’apprenant colle : demandez les
  morceaux, les passages récupérés, les prompts et les résultats au lieu de supposer.

## Review
1. La chaîne couvre l’extraction, le découpage, la recherche et la génération, et l’apprenant
   sait expliquer chaque étape.
2. Les morceaux ont du sens seuls et portent leur source.
3. Les réponses s’appuient sur les passages récupérés, les citent, et disent quand les
   documents ne répondent pas.
4. La récupération et les réponses ont été mesurées séparément sur un jeu de test avec passages
   attendus et cas particuliers du RAG, et les échecs ont été classés par étape.
5. La correction a visé l’étape la plus faible, tout le jeu de test a été relancé, et les
   limites et la mise à jour de l’index sont écrites.
6. Rien de ce qui a été partagé pendant le projet ne contenait de clé, de données personnelles
   ni de documents confidentiels.

## Going further
- Ajoutez un second type de recherche et fusionnez les résultats, puis mesurez si la
  récupération s’améliore sur votre jeu de test.
- Enregistrez la date et la version de chaque morceau, et indiquez dans chaque réponse de quand
  date sa source.
- Gardez le jeu de test et relancez-le après chaque changement de documents, de découpage ou
  de modèle.
