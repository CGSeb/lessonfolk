---
id: rag-in-depth/03-hybrid-search-and-reranking
title: Recherche hybride et reranking
level: advanced
estimatedMinutes: 20
objectives:
  - Expliquer pourquoi la recherche par mots-clés et la recherche par le sens ratent des questions différentes
  - Expliquer comment la recherche hybride fusionne deux classements
  - Expliquer ce qu’apporte un reranker et ce qu’il coûte
prerequisites:
  - rag-in-depth/02-preparing-documents
---

## Key ideas
1. **Chaque type de recherche a son angle mort.** La recherche par mots-clés (vue dans *Agents IA et
   outils*) note les morceaux selon les mots qu’ils partagent avec la question, les mots rares comptant
   davantage ; une version courante s’appelle BM25. Elle excelle sur les noms exacts, les codes, les
   références de produit et les messages d’erreur, et échoue quand la question emploie d’autres mots. La
   recherche par le sens compare des embeddings (des listes de nombres qui placent les textes sur une carte
   du sens) et trouve « congés annuels » pour « jours de vacances », mais elle peut rater un code exact
   comme un numéro de facture et tend à choisir des passages sur le bon sujet qui ne contiennent pas la
   réponse.
2. **La recherche hybride lance les deux et fusionne les résultats.** Chaque recherche produit sa propre
   liste classée. Leurs scores ne se comparent pas directement (l’un compte des mots, l’autre mesure une
   distance sur une carte), alors une approche courante fusionne plutôt les *positions* : un morceau bien
   classé dans l’une des listes, ou assez bien dans les deux, se retrouve près du haut. Une méthode
   très utilisée pour cela s’appelle la fusion par rang réciproque (reciprocal rank fusion). Le résultat
   attrape à la fois les questions à termes exacts et les questions reformulées, ce qui explique que la
   recherche hybride soit un choix par défaut courant.
3. **La récupération est un entonnoir : chercher large, puis trier avec soin.** La première recherche doit
   être rapide sur toute la collection, alors elle compare la question à chaque morceau de façon rapide
   et grossière. Elle sait bien mettre le bon morceau quelque part dans les 50 premiers, moins bien le
   mettre en premier. La chaîne prend donc un nombre généreux de candidats, puis trie à nouveau cette
   courte liste avec une méthode plus lente et plus précise, et seuls les meilleurs vont au modèle.
4. **Un reranker lit ensemble la question et chaque candidat.** La recherche par embeddings transforme
   séparément la question et le morceau en nombres, puis les compare. Un **reranker** (souvent un modèle
   appelé cross-encoder) lit la question et un candidat côte à côte et note à quel point ce passage
   répond à cette question. Il remarque ce que la première passe rate : une négation, le bon pays, le cas
   précis demandé. Il est trop lent pour tourner sur toute la collection, c’est pourquoi il ne trie que
   la liste courte.
5. **Chaque étape échange de la qualité contre du coût et du délai.** Un reranker ajoute un appel et un
   peu d’attente à chaque question ; plus de candidats, c’est plus de chances mais plus de travail ; plus
   de morceaux dans le prompt, c’est plus de coût et plus de bruit pour le modèle. Deux mesures guident
   l’équilibre : le **rappel** (le bon morceau fait-il seulement partie des candidats ?) et la
   **précision** (les morceaux envoyés au modèle sont-ils surtout utiles ?). La première recherche est
   réglée pour le rappel, le reranker pour la précision.
6. **Filtres et bonus complètent le classement.** Les métadonnées (leçon 2) peuvent exclure avant le
   classement ce qui ne doit jamais apparaître (autres pays, anciennes versions, documents que
   l’utilisateur n’a pas le droit de voir) et favoriser ce qui compte d’habitude davantage (la version la
   plus récente, la règle officielle plutôt qu’un message de forum). Un filtre est une règle ; un
   classement est une supposition. Utilisez des règles pour ce qui doit toujours être vrai.

## Teaching notes
- Analogie qui fonctionne : **un recrutement**. Trier les CV par mots-clés et par profil général donne
  vite une longue liste (la recherche hybride) ; faire passer un entretien à chaque personne de la liste
  courte est lent mais bien plus précis (le reranking). Personne n’interroge tous les candidats, et
  personne n’embauche sur le seul tri par mots-clés.
- Gardez l’exemple fil rouge. Deux questions illustrent l’idée 1 : « Que signifie le code d’erreur
  VPN-412 ? » (les mots-clés gagnent : le code est rare et exact) et « Comment travailler de chez moi en
  sécurité ? » (le sens gagne : le guide informatique parle d’« accès à distance »). La recherche hybride
  trouve les deux.
- Pour l’idée 4, un cas où le reranker aide : la question « Les prestataires peuvent-ils se faire
  rembourser le taxi ? ». La première passe classe en tête « Les employés peuvent se faire rembourser le
  taxi après 22 h » (mots et sens très proches). Le reranker, qui lit les deux ensemble, préfère le
  morceau qui parle vraiment des prestataires.
- Pour les apprenants expérimentés : la fusion par rang réciproque ajoute, pour chaque morceau, un petit
  score qui ne dépend que de sa position dans chaque liste, sans besoin d’étalonner les scores.
  Mentionnez-la seulement s’ils le demandent ; aucune formule n’est nécessaire.
- Idée reçue : « la recherche par le sens est la méthode moderne, les mots-clés sont dépassés ». La
  recherche par mots-clés reste forte sur les termes exacts et facile à expliquer ; la plupart des
  systèmes robustes gardent les deux.
- Idée reçue : « envoyer plus de morceaux au modèle par sécurité ». Plus de morceaux augmentent le coût et
  peuvent noyer le bon ; le reranker existe justement pour envoyer moins de morceaux, mais meilleurs.
- Ne nommez pas de produits de reranking ou d’embedding, et ne citez pas de chiffres de délai ou de
  benchmark : ils changent vite.
- Rythme : les idées 3 et 4 forment une seule histoire (l’entonnoir) ; racontez-les ensemble.

## Check your understanding
1. Donnez une question où la recherche par mots-clés fait mieux que la recherche par le sens, et une où elle fait moins bien. Pourquoi ?
   Good answer: les codes, noms ou messages d’erreur exacts favorisent les mots-clés car le terme rare correspond exactement ; les questions reformulées (« jours de vacances » contre « congés annuels ») favorisent le sens car aucun mot n’est partagé mais le sens est proche.
2. Pourquoi la recherche hybride ne peut-elle pas simplement additionner les scores des deux recherches, et que fait-elle à la place ?
   Good answer: les scores sont sur des échelles différentes (correspondance de mots contre distance de sens), donc pas comparables ; une approche courante fusionne les positions dans chaque liste classée, de sorte que les morceaux bien classés dans l’une ou les deux passent en tête.
3. Pourquoi une chaîne récupère-t-elle, disons, 50 candidats pour n’en garder que 5, au lieu d’en récupérer 5 directement ?
   Good answer: la première recherche est rapide mais grossière, bonne pour mettre le bon morceau quelque part dans une longue liste (rappel) mais pas pour le classer premier ; un reranker plus lent et plus précis trie ensuite la liste courte pour que seuls les meilleurs atteignent le modèle (précision), ce qui limite le coût et le bruit.
4. L’assistant d’une entreprise présente en France et en Allemagne répond sans cesse aux employés français avec la règle de congés allemande, classée en tête car formulée plus comme les questions. Corrigeriez-vous cela avec un reranker ou avec un filtre ? Pourquoi ?
   Good answer: un filtre sur la métadonnée de pays, car c’est une règle qui doit toujours être vraie ; un reranker pourrait aider mais reste une supposition sur la pertinence et pourrait encore laisser passer le mauvais pays.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait décrire l’entonnoir de récupération (une
recherche hybride large pour le rappel, puis un reranking pour la précision), y compris quand un filtre
de métadonnées est le bon outil plutôt qu’un meilleur classement.

## Going further
- Sujets : BM25, fusion par rang réciproque, cross-encoders et bi-encoders, rappel et précision.
- Leçon suivante : améliorer la question elle-même, et laisser un agent chercher.
