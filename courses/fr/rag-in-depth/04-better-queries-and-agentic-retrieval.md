---
id: rag-in-depth/04-better-queries-and-agentic-retrieval
title: Meilleures requêtes et récupération par agent
level: advanced
estimatedMinutes: 20
objectives:
  - Expliquer pourquoi la question de l’utilisateur est souvent une mauvaise requête de recherche
  - Choisir entre reformuler, découper et chercher plusieurs fois pour une question donnée
  - Juger les risques de laisser un agent décider quand chercher et quand s’arrêter
prerequisites:
  - rag-in-depth/03-hybrid-search-and-reranking
---

## Key ideas
1. **La question n’est pas toujours une bonne recherche.** Les gens posent leurs questions en
   conversation : « et pour les prestataires ? », « et celle dont on a parlé ? », « ça dit que je ne peux
   pas, pourquoi ? ». Envoyées telles quelles, elles ne trouvent rien d’utile, car la recherche ne voit que
   le dernier message. Les questions peuvent aussi être vagues, pleines de jargon interne, ou demander
   plusieurs choses à la fois. Améliorer ce qu’on cherche, avant de chercher, coûte souvent moins cher
   qu’améliorer la recherche.
2. **Reformulez la question en une requête autonome.** Un appel au modèle peut transformer le dernier
   message de la conversation en une requête complète et explicite : « et pour les prestataires ? »
   devient « règles de remboursement du taxi après 22 h pour les prestataires ». Il peut aussi développer
   les sigles et les termes internes. Le risque : la reformulation peut s’éloigner de ce que
   l’utilisateur voulait dire, donc la réponse finale doit toujours traiter la question d’origine.
3. **Découpez les questions qui demandent plusieurs choses.** « Comparez les règles de congés en France et
   en Allemagne » demande des passages de deux règles ; une seule recherche ramène surtout l’une des deux.
   La découper en sous-questions, chercher pour chacune et donner tous les résultats au modèle permet de
   couvrir chaque partie. Il en va de même pour les questions où un fait sert à en trouver un autre
   (« Qui valide mes notes de frais, et quel est son plafond ? »).
4. **Cherchez avec un brouillon de réponse, pas seulement avec la question.** Une question et le passage
   qui y répond sont souvent formulés très différemment. Une technique demande d’abord au modèle d’écrire
   une courte réponse hypothétique, puis cherche avec ce brouillon, car il ressemble davantage aux
   documents que la question (la technique est connue sous le nom de HyDE). Le brouillon n’est qu’une clé
   de recherche : il peut contenir des faits inventés et ne doit jamais être montré comme la réponse.
5. **Récupération par agent : laisser le modèle chercher autant qu’il le faut.** Au lieu d’une seule
   recherche avant de répondre, la récupération devient un outil dans une boucle d’agent (vue dans
   *Agents IA et outils*) : le modèle cherche, lit les résultats, décide s’ils suffisent, et cherche à
   nouveau avec d’autres mots ou pour une pièce manquante. Cela traite les questions ouvertes en
   plusieurs étapes qu’une chaîne fixe ne sait pas traiter, et permet au modèle de ne pas chercher quand
   une question n’en a pas besoin.
6. **Plus de liberté, c’est plus de façons d’échouer.** Un agent peut s’arrêter trop tôt et répondre sur
   des résultats maigres, chercher en rond, ou faire beaucoup d’étapes et coûter bien plus qu’une seule
   recherche. Il lui faut une limite d’étapes, une règle claire pour savoir quand les éléments suffisent
   (et pour dire « introuvable »), et des traces lisibles. Choisissez l’approche la plus simple qui répond
   aux questions que les gens posent vraiment : une chaîne fixe pour les questions factuelles simples, la
   récupération par agent pour les plus difficiles.

## Teaching notes
- Analogie qui fonctionne : **un bibliothécaire de référence**. Un bon bibliothécaire ne tape pas vos mots
  exacts dans le catalogue : il demande ce que vous voulez dire, le traduit dans les termes du
  catalogue, cherche à plusieurs endroits pour une question en deux parties, et continue jusqu’à en avoir
  assez (ou vous dit que la bibliothèque ne l’a pas).
- Gardez l’exemple fil rouge. Utilisez la conversation « Puis-je prendre un taxi pour rentrer après une
  réunion tardive ? » → « Oui, après 22 h. » → « Et pour les prestataires ? » pour illustrer l’idée 2 : le
  dernier message seul ne ramène rien sur les taxis.
- Pour l’idée 4, rendez le point concret : la question « Combien de temps ai-je pour envoyer mes
  tickets ? » partage peu de mots avec la phrase de la règle « Les justificatifs doivent être transmis
  dans les 30 jours suivant la dépense » ; un brouillon comme « Les justificatifs doivent être transmis
  dans les N jours suivant la dépense » en est bien plus proche.
- Pour les apprenants expérimentés : parlez du routage (une première étape peu coûteuse qui décide si
  une question a besoin de récupération, quelle source interroger, ou s’il faut une récupération par
  agent), et du coût de chaque appel au modèle ajouté avant la recherche.
- Idée reçue : « la récupération par agent est toujours meilleure ». Elle est plus souple, mais plus
  lente, plus chère et moins prévisible ; pour une question factuelle simple, une seule bonne recherche
  l’emporte.
- Idée reçue : « la requête reformulée peut remplacer la question ». La reformulation sert à la
  recherche ; la réponse doit traiter ce que l’utilisateur a demandé, avec ses mots.
- Restez dans la compréhension et le jugement : l’apprenant choisit une technique pour une question
  décrite, il ne la met pas en œuvre.
- Rythme : les idées 2 et 3 vont vite avec des exemples. Prenez le temps sur 5 et 6 : c’est ce compromis
  dont les apprenants avancés ont besoin.

## Check your understanding
1. Pourquoi un message de relance comme « et pour les prestataires ? » ne ramène-t-il souvent rien d’utile, et comment le système peut-il y remédier ?
   Good answer: la recherche ne voit que la courte relance, à laquelle manque le sujet de la conversation ; un appel au modèle peut la reformuler en requête autonome à l’aide de la conversation (« règles de remboursement du taxi pour les prestataires »), tandis que la réponse traite toujours la question d’origine.
2. Quelle est l’idée derrière la recherche avec une réponse hypothétique, et quel est son principal risque ?
   Good answer: un brouillon de réponse est formulé davantage comme les documents que la question, donc il correspond mieux au bon passage ; mais il peut contenir des faits inventés, donc il ne sert que de clé de recherche et n’est jamais montré comme la réponse.
3. Pour chaque question, utiliseriez-vous une seule recherche, un découpage, ou une récupération par agent ? (a) « Que signifie le code d’erreur VPN-412 ? » (b) « Comparez le congé parental en France et en Allemagne. » (c) « Je pars m’installer en Espagne l’an prochain ; qu’est-ce qui change pour mon contrat, mes notes de frais et mes accès informatiques ? »
   Good answer: (a) une seule recherche : un fait exact ; (b) un découpage en une sous-question par pays, pour récupérer les deux règles ; (c) une récupération par agent (ou un découpage avec plusieurs recherches), car la question couvre plusieurs sources et peut demander d’autres recherches selon ce qui est trouvé.
4. Qu’est-ce qui peut mal tourner quand un agent décide quand chercher et quand s’arrêter, et quelles limites mettriez-vous en place ?
   Good answer: il peut s’arrêter trop tôt sur des éléments maigres, boucler ou chercher en rond, ou faire beaucoup d’étapes coûteuses ; les limites comprennent un nombre maximal d’étapes, une règle pour savoir quand les éléments suffisent et pour répondre « introuvable », et des traces lisibles pour vérifier son comportement.

## Completion criteria
L’apprenant répond correctement aux vérifications, sait associer une question décrite à la
reformulation, au découpage, à la recherche avec un brouillon de réponse ou à la récupération par agent,
et sait nommer les contrôles dont un agent de récupération a besoin.

## Going further
- Sujets : reformulation de requêtes, décomposition de requêtes, HyDE (hypothetical document
  embeddings), routage, RAG par agent (agentic RAG).
- Leçon suivante : évaluer séparément la récupération et les réponses.
