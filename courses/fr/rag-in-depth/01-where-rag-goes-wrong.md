---
id: rag-in-depth/01-where-rag-goes-wrong
title: Où un système RAG se trompe
level: advanced
estimatedMinutes: 20
objectives:
  - Nommer les étapes d’une chaîne RAG et ce qui peut échouer à chacune
  - Remonter d’une mauvaise réponse à l’étape qui l’a causée
  - Juger quand une chaîne RAG n’est pas nécessaire du tout
prerequisites: []
---

## Key ideas
1. **Une réponse RAG passe par trois étapes, et chacune peut échouer.** Le RAG (génération
   augmentée par récupération, vue dans *Agents IA et outils*) consiste à retrouver les passages
   utiles dans vos documents, puis à laisser le modèle répondre à partir d’eux. En pratique, il y a
   trois étapes. L’**ingestion** transforme les documents en morceaux consultables, une fois, à
   l’avance. La **récupération** choisit quelques morceaux pour chaque question. La **génération**
   rédige la réponse à partir de ces morceaux. Une mauvaise réponse à la fin ne dit rien de l’endroit
   où les choses ont mal tourné : le même symptôme peut venir de n’importe laquelle des trois.
2. **Échecs d’ingestion : la réponse n’a jamais été trouvable.** L’extraction du texte a perdu le
   contenu (un PDF scanné lu comme vide, un tableau aplati en suite de nombres). Le découpage a séparé
   une règle de son exception, ou coupé une phrase du titre qui lui donnait son sens (« Non autorisé. »
   selon quelle règle ?). Le document est périmé, présent en trois versions, ou n’a jamais été ajouté.
   Aucune recherche, aussi habile soit-elle, ne trouve ce que l’index ne contient pas sous une forme
   utilisable.
3. **Échecs de récupération : la réponse existe mais n’a pas été choisie.** La question n’emploie pas
   les mêmes mots que le document, le bon morceau arrive sixième alors qu’on n’en garde que cinq, un
   quasi-doublon l’évince, ou un passage sur le même sujet mais sans la réponse l’emporte. Ces échecs
   sont les plus fréquents, et les plus invisibles : le modèle reçoit des passages plausibles et en
   tire une réponse fluide.
4. **Échecs de génération : le bon passage était là, la réponse est quand même fausse.** Le modèle
   ignore le passage et répond d’après son entraînement, lit mal un nombre, mélange deux passages qui
   s’appliquent à des cas différents, cite un passage qui ne dit pas ce qu’il prétend, ou répond au
   lieu de dire « les documents ne couvrent pas ce point ». Ce sont les échecs qu’on accuse d’abord,
   souvent à tort.
5. **Diagnostiquez en regardant ce que le modèle a reçu.** Face à une mauvaise réponse, demandez-vous
   dans l’ordre : la bonne information est-elle dans les documents, dans un morceau lisible ? Ce
   morceau faisait-il partie de ceux récupérés ? Si oui, la réponse l’a-t-elle bien utilisé ? Le
   premier « non » désigne l’étape à corriger. Améliorer le prompt ne répare pas un échec de
   récupération, et une meilleure recherche ne répare pas un morceau qui a perdu son sens à
   l’ingestion.
6. **Parfois, le RAG n’est pas nécessaire.** Si les documents sont peu nombreux et assez courts pour
   tenir largement dans la fenêtre de contexte du modèle (la quantité de texte qu’il peut lire à la
   fois), les lui donner tous peut être plus simple et en manquer moins. Le RAG vaut sa complexité
   quand la collection est trop grande, change souvent, mêle des documents que certains peuvent voir et
   d’autres non, ou quand le coût et le délai d’un envoi complet à chaque fois sont trop élevés. Même
   une grande fenêtre a ses limites : les modèles ont tendance à moins bien utiliser une information
   enfouie au milieu d’un long contexte.

## Teaching notes
- Analogie qui fonctionne : **une bibliothèque avec un bibliothécaire et un rédacteur**. L’ingestion,
  c’est le catalogage (un livre rangé dans le mauvais rayon, ou avec des pages manquantes, ne sera
  jamais trouvé). La récupération, c’est le bibliothécaire qui apporte cinq livres. La génération,
  c’est le rédacteur qui répond à partir d’eux. Quand la réponse est fausse, on vérifie les rayons,
  puis les livres apportés, puis la rédaction, dans cet ordre.
- Utilisez un exemple fil rouge pour tout le cours : un assistant interne qui répond aux questions des
  employés à partir des règles RH, des guides informatiques et des règles de notes de frais.
  Gardez-le ici et dans les leçons suivantes.
- Déroulez l’idée 5 sur un cas : un employé demande « Puis-je me faire rembourser un taxi après
  22 h ? » et l’assistant répond « Non ». Montrez trois causes différentes : le PDF de la règle était un
  scan et est sorti vide (ingestion) ; le morceau avec l’exception de nuit est arrivé derrière la règle
  générale (récupération) ; l’exception a été récupérée mais le modèle a énoncé la règle générale
  (génération). Même réponse, trois corrections différentes.
- Pour les apprenants qui ont déjà construit un RAG : demandez ce qu’ils ont vérifié en premier la
  dernière fois qu’il a mal répondu. La plupart ont changé le prompt ou le modèle ; le but de la leçon
  est de regarder d’abord les morceaux récupérés.
- Idée reçue : « un meilleur modèle corrigera les réponses ». Il n’aide qu’à l’étape de génération. Si
  le bon morceau n’a jamais été récupéré, un modèle plus fort écrit une mauvaise réponse plus
  convaincante.
- Idée reçue : « avec les grandes fenêtres de contexte, le RAG est mort ». Les petites collections
  stables peuvent s’en passer, mais le coût, le délai, les droits d’accès et les très grandes
  collections le gardent utile. Ne citez pas de tailles de fenêtre : elles changent vite.
- Ne promettez pas de chiffres sur la fréquence des échecs de chaque étape : ils dépendent du système.
  Ce qui tient, c’est l’ordre du diagnostic.
- Rythme : les idées 2 à 4 peuvent aller vite avec un exemple chacune. Passez le temps sur l’idée 5,
  idéalement en laissant l’apprenant diagnostiquer le cas du taxi avant de l’expliquer.

## Check your understanding
1. Nommez les trois étapes d’une chaîne RAG et une façon dont chacune peut échouer.
   Good answer: ingestion (mauvaise extraction, morceaux qui perdent leur sens, documents absents ou périmés), récupération (le bon morceau non choisi ou trop mal classé, des mots différents, un passage sur le même sujet qui l’emporte) et génération (passage ignoré ou mal lu, mauvaise citation, réponse donnée au lieu d’admettre le manque).
2. Pourquoi est-ce une erreur de corriger chaque mauvaise réponse en changeant le prompt ou le modèle ?
   Good answer: ils n’agissent que sur la génération ; si l’information a été perdue à l’ingestion ou n’a jamais été récupérée, le modèle ne peut pas l’utiliser, et un meilleur modèle écrit seulement une mauvaise réponse plus convaincante. Il faut d’abord trouver l’étape qui a échoué.
3. L’assistant dit que les employés ont 20 jours de congés ; le manuel en indique 25. Les morceaux récupérés ne contiennent qu’une ancienne règle de 2019 qui dit 20. Quelle étape a échoué, et que regarderiez-vous ensuite ?
   Good answer: la réponse suit son passage, donc la génération a fait son travail ; le problème est en amont : l’ancienne règle est toujours dans l’index (ingestion) et/ou la règle actuelle n’a pas été récupérée (récupération). Ensuite, vérifier que la règle actuelle est indexée et lisible, puis pourquoi elle est classée derrière l’ancienne.
4. Une équipe a un guide produit de 15 pages qui change rarement et veut un assistant qui réponde aux questions. A-t-elle besoin d’une chaîne RAG ? Qu’est-ce qui changerait votre réponse ?
   Good answer: probablement pas : le guide tient largement dans la fenêtre de contexte, donc le donner en entier est plus simple et en manque moins. Le RAG devient intéressant si la collection grossit, change souvent, contient des documents que seuls certains peuvent voir, ou si tout envoyer à chaque fois coûte trop cher ou est trop lent.

## Completion criteria
L’apprenant répond correctement aux vérifications, sait remonter d’une mauvaise réponse à l’ingestion,
à la récupération ou à la génération en posant dans l’ordre les questions de l’idée 5, et sait dire
quand donner le texte entier suffit.

## Going further
- Sujets : l’effet « perdu au milieu » (lost in the middle) des longs contextes, l’analyse de documents
  et l’OCR.
- Leçon suivante : préparer les documents pour que l’ingestion garde le sens.
