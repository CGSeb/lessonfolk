---
id: prompting-basics/02-role-examples-and-format
title: Rôle, exemples et format de sortie
level: beginner
estimatedMinutes: 15
objectives:
  - Utiliser un rôle pour définir la perspective d’une réponse
  - Montrer un exemple pour obtenir le style ou la structure voulus
  - Demander un format de sortie, une longueur et un ton précis
prerequisites:
  - prompting-basics/01-why-wording-matters
---

## Key ideas
1. **Un rôle définit la perspective.** Commencer par « Agis comme un professeur de maths patient » ou
   « Tu es un agent de voyage qui connaît les voyages à petit budget » indique à l’assistant quel point
   de vue, quel vocabulaire et quelles priorités adopter. Cela ne lui donne pas de nouvelles connaissances ;
   cela l’oriente vers le bon style de réponse.
2. **Un exemple vaut mieux que beaucoup d’adjectifs.** Au lieu de décrire le style voulu (« court,
   amical, un peu drôle »), collez un exemple et dites « écris-le comme ça ». Donner un ou quelques exemples
   dans le prompt s’appelle le **few-shot prompting** (« shot » signifie simplement exemple).
3. **Demandez le format dont vous avez besoin.** Une liste à puces, un tableau avec des colonnes nommées,
   des étapes numérotées, un seul paragraphe, un e-mail avec un objet… Si vous ne le dites pas, vous
   obtenez le format que l’assistant juge le plus probable.
4. **Fixez la longueur et le ton.** « En 3 phrases », « moins de 100 mots », « formel », « chaleureux et
   simple », « sans jargon ». C’est peu coûteux à ajouter et cela change beaucoup la réponse.
5. **Ajoutez des contraintes sur ce qu’il faut éviter ou inclure.** « N’utilise pas de termes techniques »,
   « inclus une estimation de prix », « utilise uniquement les ingrédients que j’ai listés ». Les
   contraintes gardent la réponse dans le cadre dont vous avez besoin.

## Teaching notes
- Analogie qui fonctionne : **commander dans un café**. « Un café » vous donne quelque chose ; « un grand
  latte à l’avoine, pas trop chaud, à emporter » vous donne ce que vous vouliez. Le rôle, l’exemple, le
  format, la longueur et le ton sont les détails de la commande.
- Démo : prenez une demande (ex. « explique ce qu’est un budget ») et répondez de trois façons dans le
  chat : sans rien ajouter, avec un rôle (« en conseiller bancaire sympathique qui parle à un adolescent »)
  et avec un format (« un tableau de 3 lignes : revenus, dépenses, épargne »). Laissez l’apprenant dire
  ce qui a le plus aidé.
- Idée reçue : « donner un rôle fait de l’IA une experte » — par ex. « agis comme un médecin » ne rend pas
  les réponses médicales fiables. Le rôle change le style, pas l’exactitude. Limitez-vous à une phrase ici ;
  la leçon 5 traite des limites.
- Idée reçue : « les exemples seront copiés mot pour mot ». L’assistant suit en général le modèle (longueur,
  ton, structure), pas le contenu. S’il copie de trop près, dites-le-lui.
- Limitez le jargon à un seul terme : « few-shot ». Définissez-le une fois, puis dites simplement « exemples ».
- Avec des apprenants expérimentés, faites-leur combiner les cinq idées dans un seul prompt et critiquez-le
  ensemble.
- Rythme : les idées 3 à 5 passent vite ; passez le plus de temps sur les exemples (idée 2), auxquels les
  débutants pensent rarement.

## Check your understanding
1. Que change le fait de donner un rôle à l’assistant, et que ne change-t-il pas ?
   Good answer: il change la perspective, le vocabulaire et le style de la réponse ; il n’ajoute pas de connaissances et ne rend pas la réponse plus exacte.
2. Vous voulez des descriptions de produits dans le même style qu’une que vous aimez déjà. Que mettre de plus efficace dans votre prompt ?
   Good answer: coller la description qu’ils aiment comme exemple et demander de nouvelles descriptions dans le même style (few-shot), plutôt que de seulement décrire le style avec des adjectifs.
3. Améliorez ce prompt pour que la réponse soit facile à utiliser : « Parle-moi des avantages et inconvénients du télétravail. »
   Good answer: demande un format précis (ex. un tableau à deux colonnes ou deux listes à puces) et ajoute au moins un élément parmi la longueur, le ton, le public ou une contrainte.

## Completion criteria
L’apprenant répond correctement aux vérifications, y compris sur le fait qu’un rôle change le style mais
pas l’exactitude, et rédige un prompt qui précise au moins un format plus un élément parmi exemple, longueur,
ton ou contrainte.

## Going further
- Leçon suivante : que faire quand la réponse rate sa cible.
