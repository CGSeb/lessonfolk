---
id: rag-in-depth/02-preparing-documents
title: "Préparer les documents : morceaux et métadonnées"
level: advanced
estimatedMinutes: 20
objectives:
  - Expliquer pourquoi l’extraction du texte est la première chose à vérifier
  - Juger une stratégie de découpage pour une collection de documents donnée
  - Expliquer comment le contexte ajouté et les métadonnées rendent un morceau trouvable et utilisable
prerequisites:
  - rag-in-depth/01-where-rag-goes-wrong
---

## Key ideas
1. **L’extraction passe avant tout.** Avant tout découpage, il faut sortir le texte des PDF, des
   présentations, des pages web et des tableurs. Cette étape perd beaucoup, sans bruit : une page
   scannée sans couche de texte sort vide si elle ne passe pas par l’OCR (reconnaissance optique de
   caractères, un logiciel qui lit le texte d’une image) ; les en-têtes et pieds de page se répètent dans
   chaque morceau ; les mises en page sur deux colonnes mélangent leurs lignes ; un tableau devient une
   rangée de nombres sans noms de colonnes. Regarder le texte extrait de quelques vrais documents est la
   vérification la moins chère de toute la chaîne, et la plus souvent oubliée.
2. **Un bon morceau se comprend seul.** La récupération renvoie des morceaux, pas des documents : chaque
   morceau doit donc porter assez d’information pour être utile seul. Trop petit, il perd son sens
   (« Ceci ne s’applique pas aux prestataires. » Quelle règle ?). Trop grand, il mélange plusieurs
   sujets : il correspond vaguement à beaucoup de questions et remplit la fenêtre de contexte de texte
   inutile. Il n’existe pas de bonne taille universelle ; la bonne taille est celle qui garde ensemble une
   idée, une règle ou une réponse pour ces documents-là.
3. **Découpez selon la structure, pas à longueur fixe.** Couper tous les N mots est simple mais tranche
   les phrases, les listes et les tableaux en plein milieu. Découper selon la structure propre du
   document (titres, sections, paragraphes, éléments de liste, lignes de tableau) garde ensemble ce qui va
   ensemble. Un petit **chevauchement** (répéter la fin d’un morceau au début du suivant) limite les dégâts
   quand une coupe tombe quand même mal. Certains contenus demandent un traitement à part : un tableau est
   mieux gardé entier, ou transformé en une phrase par ligne avec ses noms de colonnes ; une FAQ donne
   naturellement un morceau par question-réponse.
4. **Rendez à chaque morceau son contexte.** Un morceau dépend souvent de son origine : « La limite est
   de 50 euros » ne veut rien dire sans « Règles de notes de frais > Repas > Déplacements à l’étranger ».
   Ajouter à chaque morceau le titre du document et le chemin de ses titres, ou une courte phrase rédigée
   (souvent par un modèle) qui le situe dans son document, le rend à la fois plus facile à trouver et plus
   sûr à utiliser. Certains fournisseurs appellent cela la récupération contextuelle (contextual
   retrieval) ; l’idée est simplement qu’un morceau ne doit pas arriver orphelin.
5. **Les métadonnées permettent de filtrer avant de chercher.** Gardez avec chaque morceau des
   informations sur lui : document source, date, version, service, langue, pays, qui a le droit de le
   voir. La récupération peut alors être restreinte (« uniquement la règle en vigueur pour la France »)
   au lieu d’espérer que la bonne version arrive en tête. Ce sont aussi les métadonnées qui rendent
   possibles, plus tard, les citations, la fraîcheur et le contrôle d’accès.
6. **Nettoyez la collection, pas seulement les morceaux.** Trois versions de la même règle, des
   brouillons à côté des documents définitifs et des copies dans plusieurs dossiers se font concurrence
   dans la recherche, et la mauvaise gagne parfois. Décider quels documents entrent dans l’index, et
   quelle version est en vigueur, améliore souvent les réponses plus que n’importe quelle technique de
   recherche.

## Teaching notes
- Analogie qui fonctionne : **les fiches d’un exposé**. Chaque fiche doit avoir un sens quand on la prend
  seule, alors on écrit le sujet en haut. Une fiche avec une demi-phrase ne sert à rien ; une fiche qui
  couvre trois sujets est difficile à retrouver et à utiliser.
- Gardez l’exemple fil rouge : l’assistant de l’entreprise avec les règles RH, les guides informatiques
  et les règles de notes de frais. Montrez le morceau « Ceci ne s’applique pas aux prestataires. », puis
  le même morceau précédé de « Règles de notes de frais > Taxi après 22 h » : l’apprenant doit voir que
  le second peut être trouvé par une question sur les taxis et correctement compris par le modèle.
- Pour l’idée 1, un cas parlant : une règle de notes de frais scannée et indexée sans OCR est un
  document vide. Toutes les questions sur les notes de frais reçoivent alors une réponse tirée des
  mauvais documents, et rien dans la réponse ne le révèle.
- Pour les apprenants expérimentés : discutez du compromis sur la taille des morceaux du point de vue de
  la récupération (les petits morceaux se comparent plus précisément, les grands portent plus de
  contexte), et des techniques qui séparent les deux, comme comparer sur un petit morceau mais donner au
  modèle la section qui l’entoure. Restez conceptuel.
- Idée reçue : « il existe une meilleure taille de morceau ». Les tailles citées en ligne viennent des
  documents de quelqu’un d’autre. Évitez de donner des nombres comme règles ; ce qui compte, c’est qu’un
  morceau contienne une idée utilisable pour cette collection.
- Idée reçue : « les métadonnées sont un rangement facultatif ». Filtrer par version ou par pays évite
  des erreurs qu’aucun classement ne corrige de façon fiable, et la leçon 6 en dépend pour les droits
  d’accès.
- Restez descriptif : l’apprenant juge des stratégies pour des documents décrits ; il ne découpe rien
  lui-même.
- Rythme : les idées 2 à 4 sont le cœur. Les idées 5 et 6 peuvent être plus courtes si l’apprenant
  travaille déjà avec des métadonnées.

## Check your understanding
1. Pourquoi faut-il regarder le texte extrait de quelques documents avant de régler quoi que ce soit d’autre ?
   Good answer: l’extraction peut perdre du contenu sans bruit (scans sans OCR, colonnes mélangées, tableaux sans noms de colonnes, en-têtes répétés) ; si le texte est faux ou absent, aucun découpage ni aucune recherche ne peut le récupérer, et la vérification coûte peu.
2. Qu’est-ce qui ne va pas avec des morceaux trop petits, et avec des morceaux trop grands ?
   Good answer: trop petits, ils perdent leur sens ou le contexte qui les rend compréhensibles ; trop grands, ils mélangent plusieurs sujets, correspondent vaguement aux questions et remplissent la fenêtre de contexte de texte inutile.
3. Un manuel RH est découpé tous les 300 mots. Le morceau « Les employés en période d’essai n’y ont pas droit. » ressort sans cesse pour des questions sur le télétravail, mais le modèle ne sait pas à quoi il se rapporte. Que changeriez-vous, et pourquoi ?
   Good answer: découper selon les titres du document au lieu d’une longueur fixe, et/ou ajouter à chaque morceau le chemin de ses titres ou une courte phrase qui le situe (par exemple « Règles de télétravail > Conditions »), pour que le morceau soit compris et retrouvé correctement seul.
4. L’assistant cite parfois une ancienne règle de notes de frais remplacée l’an dernier. Donnez deux mesures de préparation qui l’éviteraient.
   Good answer: retirer les versions périmées de l’index ou ne marquer comme active que la version en vigueur, et garder des métadonnées comme la version et la date pour que la récupération filtre sur la règle actuelle (au lieu d’espérer qu’elle arrive en tête).

## Completion criteria
L’apprenant répond correctement aux vérifications, sait expliquer ce qui rend un morceau utilisable
seul, et sait proposer à la fois un changement de découpage et un changement de métadonnées ou de
collection pour un problème décrit.

## Going further
- Sujets : OCR et analyse de documents, découpage selon la structure, récupération contextuelle,
  morceaux parents et enfants.
- Leçon suivante : combiner recherche par mots-clés et par le sens, puis le reranking.
