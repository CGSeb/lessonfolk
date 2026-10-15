---
id: ai-agents-and-tools/04-giving-a-model-your-data
title: Donner vos données à un modèle (les bases du RAG)
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer la génération augmentée par récupération (RAG) et pourquoi elle est nécessaire
  - Expliquer comment la recherche par mots-clés retrouve les passages pertinents dans vos propres documents
  - Faire répondre le modèle à partir de ces passages et les lui faire citer
prerequisites:
  - ai-agents-and-tools/03-the-agent-loop
---

## Key ideas
1. **Les modèles ne connaissent pas vos documents.** Un modèle connaît ce qu’il a appris à l’entraînement,
   pas le manuel de votre entreprise ni vos notes, et vos documents sont souvent trop volumineux pour être
   collés en entier. Le **RAG (retrieval-augmented generation, génération augmentée par récupération)**
   consiste à : trouver d’abord les parties pertinentes, puis ne donner que celles-ci au modèle avec la
   question.
2. **Découper, récupérer, puis générer.** Découpez les documents en **morceaux** (chunks : un paragraphe ou
   quelques centaines de mots chacun). Pour chaque question, trouvez les morceaux les plus susceptibles de
   contenir la réponse. Mettez-les dans le prompt avec des instructions claires, et laissez le modèle
   répondre.
3. **La récupération peut se faire par mots-clés ou par sens.** La recherche par mots-clés note les
   morceaux selon les mots qu’ils partagent avec la question : simple, transparente, sans modèle
   supplémentaire. Les **embeddings** transforment le texte en listes de nombres de sorte que des textes
   de sens proche soient proches, ce qui trouve des correspondances même avec des mots différents. Les
   vrais systèmes utilisent souvent des embeddings, parfois combinés aux mots-clés.
4. **Ancrez la réponse et citez.** Dites au modèle de ne répondre qu’à partir des passages donnés, de
   dire quand ils ne contiennent pas la réponse et de citer le passage utilisé. Les citations permettent à
   l’utilisateur de vérifier (comme dans Utiliser l’IA en toute sécurité et avec discernement).
5. **La récupération peut être un outil.** Dans un agent, `search_documents(query)` n’est qu’un outil de
   plus : le modèle décide quand chercher et quoi chercher, et peut chercher à nouveau si les premiers
   résultats n’étaient pas assez bons.

## Teaching notes
- Analogie qui fonctionne : **un examen à livre ouvert**. L’étudiant (le modèle) ne mémorise pas le livre ;
  un bon index (la récupération) indique les bonnes pages, et l’étudiant répond à partir d’elles, en citant
  la page.
- Pour les exemples, utilisez le texte non confidentiel de l’apprenant s’il en a (notes, manuel public) ;
  sinon, inventez quelques courts passages.
- La recherche par mots-clés est le cœur de la leçon ; les embeddings sont une extension facultative. Si
  l’apprenant essaie les embeddings, son outil local ou son fournisseur doit proposer un modèle d’embedding ;
  suivez sa documentation, et ne nommez pas de modèles précis.
- Idée reçue : « le RAG rend les réponses correctes ». Il aide le modèle à utiliser les bonnes
  informations, mais la récupération peut manquer le bon morceau, et le modèle peut quand même mal lire ou
  ajouter des choses. Les citations et « dis quand tu ne sais pas » réduisent le risque ; elles ne le
  suppriment pas.
- Idée reçue : « collez simplement tous les documents ». Trop de texte est lent, coûteux, peut ne pas tenir
  dans la fenêtre de contexte et peut noyer la partie pertinente.
- Rappelez brièvement que les documents donnés à un modèle hébergé quittent l’ordinateur de l’apprenant
  (leçon sur la vie privée) ; un modèle local les garde en local.

## Check your understanding
1. Quel problème le RAG résout-il, et quelles en sont les principales étapes ?
   Good answer: les modèles ne connaissent pas vos documents et ne peuvent pas tous les prendre d’un coup ; le RAG découpe les documents en morceaux, récupère les pertinents pour une question et les donne au modèle pour qu’il réponde à partir d’eux.
2. Quelle est la différence entre la recherche par mots-clés et les embeddings pour la récupération ?
   Good answer: la recherche par mots-clés fait correspondre des mots partagés (simple, transparente, rate les synonymes) ; les embeddings représentent le sens par des nombres de sorte que des sens proches correspondent même avec des mots différents (demande un modèle d’embedding).
3. Pourquoi demander au modèle de citer les passages et de dire quand la réponse n’y est pas ?
   Good answer: cela garde la réponse ancrée dans les documents, permet aux utilisateurs de vérifier la source et réduit les réponses inventées quand la récupération n’a rien trouvé de pertinent.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait décrire une chaîne récupération-puis-réponse qui
cite des passages et gère une question que les documents ne couvrent pas.

## Going further
- Sujets : embeddings, recherche vectorielle, stratégies de découpage, recherche hybride.
- Leçon suivante : où les agents échouent.
