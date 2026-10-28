---
id: rag-in-depth/05-evaluating-retrieval-and-answers
title: Évaluer séparément la récupération et les réponses
level: advanced
estimatedMinutes: 20
objectives:
  - Expliquer pourquoi un système RAG doit être évalué étape par étape
  - Décrire ce qui mesure la qualité de la récupération et ce qui mesure la qualité des réponses
  - Décrire ce que contient un bon jeu de test pour un RAG
prerequisites:
  - rag-in-depth/04-better-queries-and-agentic-retrieval
---

## Key ideas
1. **Un score global cache l’endroit du problème.** *Évaluer les réponses de l’IA* couvre la méthode
   générale : définir ce que « bon » veut dire, construire un jeu de test, noter les réponses et comparer
   les versions. Pour un RAG, un seul score « la réponse était-elle juste ? » ne suffit pas : quand il
   baisse, impossible de savoir si c’est la récupération ou la génération qui s’est dégradée, et l’on
   risque de régler la mauvaise étape (l’ordre de diagnostic de la leçon 1). Évaluez la récupération et la
   génération séparément, avec les mêmes questions de test.
2. **La récupération se mesure par rapport aux passages qui devraient être trouvés.** Pour chaque question
   de test, notez quel document ou passage contient la réponse. Puis demandez-vous : ce passage fait-il
   partie de ceux récupérés (on parle souvent de rappel à k, k étant le nombre de morceaux gardés) ? À
   quel rang arrive-t-il ? Combien des morceaux récupérés sont vraiment pertinents (la précision) ? Ces
   vérifications ne demandent aucun juge et tournent vite : elles sont idéales pour comparer des réglages
   de découpage, de recherche ou de reranking.
3. **La génération se mesure sur deux qualités distinctes.** La **fidélité** (ou ancrage) : chaque
   affirmation de la réponse est-elle appuyée par les passages récupérés ? Une réponse peut être vraie
   mais infidèle, en s’appuyant sur des connaissances d’entraînement que les documents ne confirment pas,
   ce qui pose problème quand les documents doivent faire autorité. La **pertinence et la complétude** :
   la réponse traite-t-elle la question, et toute la question ? Les citations ajoutent une troisième
   vérification : le passage cité dit-il vraiment ce que la réponse affirme ?
4. **Un jeu de test RAG a ses propres cas particuliers.** En plus des questions ordinaires avec leur
   source attendue et les points qu’une bonne réponse contient, incluez : des questions auxquelles les
   documents ne répondent pas (la bonne réponse le dit), des questions formulées autrement que les
   documents, des questions avec des codes ou des noms exacts, des questions qui demandent deux passages,
   des questions où une ancienne et une nouvelle version coexistent, et des questions auxquelles un
   utilisateur donné ne doit pas obtenir de réponse (leçon 6). Recueillez de vraies questions quand c’est
   possible : elles sont formulées comme les gens demandent vraiment.
5. **Les juges IA aident, dans certaines limites.** Vérifier la fidélité à la main sur beaucoup de
   réponses est lent, alors on demande souvent à un juge IA : « Chaque affirmation est-elle appuyée par
   ces passages ? ». Comme le montre *Évaluer les réponses de l’IA*, les juges ont besoin de critères
   clairs et doivent être comparés à des personnes sur un échantillon. Ils sont meilleurs pour « cette
   affirmation est-elle dans le texte ? » que pour « est-ce la meilleure réponse possible ? ».
6. **Lisez les échecs par étape, puis corrigez la bonne étape.** Quand un test échoue, regardez ce qui a
   été récupéré. Bon passage absent : corrigez l’ingestion ou la récupération. Bon passage présent mais
   réponse infidèle ou incomplète : corrigez la génération (instructions, nombre de morceaux, modèle).
   Gardez chaque échec comme cas de test, et relancez tout le jeu après chaque changement : un meilleur
   découpage peut corriger dix questions et en casser trois autres.

## Teaching notes
- Analogie qui fonctionne : **la dissertation d’un étudiant avec une bibliographie**. On peut vérifier
  s’il a trouvé les bons livres (la récupération), et séparément si ce qu’il a écrit s’appuie sur ces
  livres et répond au sujet (la génération). Une mauvaise note seule ne dit pas sur quoi travailler.
- Gardez l’exemple fil rouge. Montrez un cas de test en entier : question « Puis-je me faire rembourser
  un taxi après 22 h ? », source attendue « Règles de notes de frais > Taxi après 22 h », points clés
  « oui, pour les employés, avec un justificatif, sous 30 jours ». Puis montrez trois résultats : source
  non récupérée ; source récupérée mais la réponse oublie le justificatif ; source récupérée et la
  réponse ajoute un plafond que la règle ne mentionne pas (infidèle).
- Rappelez brièvement, d’après *Évaluer les réponses de l’IA*, ce que sont un jeu de test et un juge IA
  si l’apprenant n’a pas suivi ce cours ; ne les réenseignez pas.
- Pour les apprenants expérimentés : mentionnez qu’il existe des outils dédiés à l’évaluation des RAG
  et des benchmarks publics, et que ce qu’ils mesurent recoupe les idées 2 et 3 sous divers noms. Ne
  nommez pas de produits et ne citez pas de résultats de benchmark.
- Idée reçue : « si la réponse finale est juste, le système va bien ». Une bonne réponse tirée du
  mauvais passage, ou de la mémoire du modèle, échouera à la prochaine question où la mémoire se trompe.
- Idée reçue : « fidèle veut dire vrai ». Fidèle veut dire appuyé par les passages ; si les passages
  sont périmés, une réponse fidèle est fidèlement fausse, ce qui est un problème de récupération ou
  d’ingestion.
- Restez descriptif : l’apprenant dit ce qu’il mesurerait et ce qu’il inclurait ; il ne construit pas de
  jeu de test.
- Rythme : les idées 2 et 3 sont le cœur de la leçon. L’idée 5 peut être courte si l’apprenant connaît
  les juges IA.

## Check your understanding
1. Pourquoi un seul score de « bonne réponse » ne suffit-il pas pour améliorer un système RAG ?
   Good answer: quand il baisse, il ne montre pas si c’est la récupération ou la génération qui a échoué, donc on risque de régler la mauvaise étape ; mesurer séparément la récupération et la génération désigne l’étape à corriger.
2. Comment mesurez-vous la qualité de la récupération, et de quoi avez-vous besoin dans le jeu de test pour cela ?
   Good answer: pour chaque question, noter le ou les passages qui contiennent la réponse ; puis vérifier s’ils font partie des morceaux récupérés (rappel à k), à quel rang ils arrivent, et combien de morceaux récupérés sont pertinents (précision).
3. Quelle est la différence entre une réponse fidèle et une réponse correcte ? Donnez un cas où elles diffèrent.
   Good answer: fidèle signifie que chaque affirmation est appuyée par les passages récupérés ; correcte signifie vraie. Une réponse peut être correcte mais infidèle (le modèle a utilisé ses propres connaissances, pas les documents) ou fidèle mais fausse (les passages étaient périmés).
4. Nommez trois types de questions qu’un jeu de test RAG doit inclure au-delà des questions factuelles ordinaires.
   Good answer: trois parmi les questions auxquelles les documents ne répondent pas, les questions formulées autrement que les documents, les codes ou noms exacts, les questions qui demandent plusieurs passages, les anciennes contre les nouvelles versions, et les questions auxquelles un utilisateur donné ne doit pas obtenir de réponse.

## Completion criteria
L’apprenant répond correctement aux vérifications, sait nommer une mesure pour la récupération et une
pour la génération, et sait expliquer ce qu’il faut corriger quand un test échoue avec le bon passage
absent ou présent.

## Going further
- Sujets : rappel et précision à k, fidélité et ancrage, exactitude des citations, benchmarks de RAG.
- Leçon suivante : exploiter un système RAG en production.
