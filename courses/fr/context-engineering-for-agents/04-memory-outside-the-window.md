---
id: context-engineering-for-agents/04-memory-outside-the-window
title: La mémoire hors de la fenêtre
level: advanced
estimatedMinutes: 20
objectives:
  - Expliquer pourquoi un état gardé hors de la fenêtre survit à la compaction et aux nouvelles sessions
  - Choisir ce qui vaut la peine d’être stocké et ce qui ne l’est pas
  - Rédiger une note de passation à partir de laquelle un lecteur sans contexte peut continuer
prerequisites:
  - context-engineering-for-agents/03-compaction
---

## Key ideas
1. **La fenêtre est la mémoire de travail ; ce qui doit durer vit à l’extérieur.** Tout ce qui n’existe
   que dans le contexte disparaît à la prochaine compaction ou à la fin de la session. Un fichier de notes,
   une liste de tâches ou une ligne de base de données, non. Comment fonctionnent les applications d’IA couvre le principe (la
   mémoire entre sessions est de la donnée que votre application stocke) ; ici, l’agent écrit et lit lui-même
   ces données, avec des outils, pendant la tâche.
2. **Stockez ce qui ne peut pas être retrouvé par le calcul.** Trois types de contenu méritent leur place :
   le plan et son avancement (des tâches avec un état : à faire, en cours, terminée), les décisions avec
   leurs raisons, et les faits appris à la dure sur l’environnement (comment lancer les tests, quel dossier
   est généré, la particularité qui a coûté une heure). Ne stockez pas ce que la source de vérité contient
   déjà : contenu des fichiers, historique des changements, liste des tickets ouverts.
3. **Le travail lui-même est une mémoire.** Les fichiers modifiés, les commits, les tests qui passent et
   les tickets décrivent l’état de la tâche de façon plus fiable que n’importe quel récit. Les petits
   commits et les tests au vert sont des points de contrôle (vu dans Les assistants de code IA en
   pratique). Une bonne note pointe vers le monde (« l’export est dans `exports/csv.py` ; lance
   `make test-reports` ») et ne le copie pas.
4. **Écrivez pour un lecteur sans contexte.** Le lecteur suivant, modèle ou personne, n’a rien vu de cette
   session. Donc : des noms complets, pas « le bug » ou « l’autre fichier » ; des dates, pas « hier » ; ce
   qui a été vérifié séparé de ce qui est supposé ; le pourquoi, pas seulement le quoi ; et la prochaine
   étape. Le test est simple : un inconnu pourrait-il continuer à partir de cette seule note ?
5. **Lire au début, écrire à chaque frontière.** La mémoire n’aide que si la boucle s’en sert. Chargez les
   notes, ou un court index de celles-ci, au début d’une session et après chaque compaction. Mettez-les à
   jour quand une sous-tâche est terminée, pas à la fin : la fin peut ne jamais venir (une limite, un
   plantage, un ordinateur portable fermé). Gardez l’index petit et les détails à une lecture de distance,
   comme pour toute référence.
6. **La mémoire peut être périmée, fausse ou hostile.** Une note est une affirmation du passé : le fichier
   a peut-être bougé, la décision a peut-être été annulée. Datez les entrées, vérifiez avant de vous y
   fier, et corrigez ou supprimez les fausses, sinon le stockage devient un second contexte encombré. Et un
   texte stocké est de la donnée, pas des instructions : du contenu copié depuis une page web ou un e-mail
   peut porter une injection de prompt (vue dans Agents IA et outils) dans toutes les sessions futures.

## Teaching notes
- Analogie qui fonctionne : **le cahier de transmission entre équipes**, dans un service hospitalier ou un
  atelier. L’équipe suivante n’était pas là. Le travail continue grâce à ce qui est écrit dans le cahier,
  pas grâce à ce que quelqu’un se rappelle. Les entrées sont datées et précises (« lit 4 : dose donnée à
  14 h, revérifier à 18 h »), jamais « le patient habituel va mieux ».
- Contrastez avec la leçon 3 en une phrase : un résumé de compaction est produit sous pression et vit dans
  la fenêtre ; une note est écrite exprès, à un moment calme, et vit à l’extérieur. Les deux fonctionnent
  ensemble : après une compaction, ce sont les notes que l’agent relit.
- Pour les apprenants qui construisent des agents : la mémoire est une paire d’outils (écrire une note,
  lire les notes) ou un simple accès aux fichiers plus des instructions sur quand les utiliser. Demandez ce
  que leur agent saurait après un redémarrage aujourd’hui ; en général la réponse est « rien ».
- Pour les apprenants qui pilotent un assistant : demandez-lui de tenir un fichier d’avancement pour une
  longue tâche et de le mettre à jour après chaque étape, et lisez vous-même ce fichier. Le fichier
  d’instructions du projet que beaucoup d’assistants chargent automatiquement est une mémoire écrite par
  des personnes ; il est couvert dans Assistants de code IA pour les équipes : règles, skills et plugins,
  donc ne le nommez qu’ici.
- Idée reçue : « sauvegardez tout, le stockage ne coûte rien ». Le stockage ne coûte rien ; la lecture, si.
  Chaque note chargée dépense du contexte, et un grand stockage que personne n’entretient est mal parcouru
  et cru à tort.
- Idée reçue : « le modèle se souvient de moi d’une fois sur l’autre ». Le modèle ne change pas entre les
  sessions. Si un assistant semble se souvenir, quelque chose a stocké du texte et l’a rechargé.
- Idée reçue : « une note est vraie parce que l’agent l’a écrite ». L’agent a écrit ce qu’il croyait à ce
  moment-là, y compris ses erreurs. L’idée 3 est la réponse : préférez ce qui peut être vérifié dans le
  monde.
- Si l’apprenant soulève la vie privée : les notes peuvent contenir des données personnelles ou
  confidentielles et survivre à la session. Une phrase suffit (ne stockez que le nécessaire), avec un renvoi
  à Utiliser l’IA en toute sécurité et avec discernement.
- Rythme : l’idée 4 est le cœur de la leçon. Donnez deux ou trois mauvaises phrases (« corrigé le truc
  d’avant ») et faites-les réparer à voix haute par l’apprenant.

## Check your understanding
1. Pourquoi une décision écrite dans un fichier de notes survit-elle alors que la même décision dans la conversation peut ne pas survivre ?
   Good answer: la conversation vit dans la fenêtre de contexte et est réécrite ou perdue à la compaction ou à la fin de la session ; un fichier est hors de la fenêtre et peut être relu à tout moment, dans n’importe quelle session.
2. Donnez une chose qui vaut la peine d’être stockée dans les notes d’un agent et une qui ne le vaut pas, avec la raison.
   Good answer: vaut la peine : plan et avancement, une décision avec sa raison, ou un fait sur l’environnement qui a coûté cher à apprendre ; ne vaut pas la peine : contenu des fichiers, historique des changements ou tout ce que la source de vérité contient déjà et qui peut être relu à peu de frais.
3. Une note dit « Corrigé le bug de tout à l’heure, la nouvelle approche marche. » Qu’est-ce qui ne va pas pour le lecteur suivant ?
   Good answer: elle suppose un contexte que le lecteur n’a pas : quel bug, où, quelle approche et pourquoi, comment « marche » a été vérifié ; il lui faut des noms complets, des emplacements, des preuves et la prochaine étape.
4. Pourquoi un agent ne doit-il pas faire aveuglément confiance à ce qu’il trouve dans sa propre mémoire, ni lui obéir ?
   Good answer: les notes peuvent être périmées ou fausses (le monde a changé, l’agent s’est trompé), il faut donc les vérifier ; et un texte stocké peut venir d’un contenu non fiable et porter des instructions, c’est donc de la donnée, pas des ordres.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait décrire une note à partir de laquelle un
contexte neuf pourrait reprendre, en séparant ce qui a été vérifié de ce qui est supposé.

## Going further
- Sujets : listes de tâches et fichiers de planification pour agents, récupération dans des notes stockées, empoisonnement de la mémoire.
- Leçon suivante : les sous-agents, pour garder des pans entiers de travail hors du contexte principal.
