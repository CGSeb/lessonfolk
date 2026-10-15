---
id: context-engineering-for-agents/03-compaction
title: "La compaction : résumer sans perdre le fil"
level: advanced
estimatedMinutes: 20
objectives:
  - Choisir entre vider les anciens résultats, compacter et repartir de zéro
  - Dire ce qu’un résumé de compaction doit conserver
  - Reconnaître les façons dont un résumé tourne mal
prerequisites:
  - context-engineering-for-agents/02-budgeting-the-context-window
---

## Key ideas
1. **La compaction remplace l’historique par un résumé.** Construire avec l’IA couvre la forme simple :
   résumer les anciens messages d’un chat. Dans un agent, le modèle (ou un appel séparé) rédige un résumé
   du travail accompli, et la boucle continue avec les instructions, ce résumé et peut-être les derniers
   messages. Elle perd de l’information, volontairement. Toute la compétence est de choisir ce qu’on perd.
2. **Essayez d’abord l’étape la plus légère : vider les anciens résultats d’outils.** Remplacez les
   résultats que l’agent a déjà utilisés par une note d’une ligne (« contenu de `models.py` retiré ; relis-le
   si besoin »). Le raisonnement et les décisions restent, le volume part, et presque rien n’est perdu quand
   le contenu peut être récupéré à nouveau. Cela retire aussi les copies périmées, l’un des problèmes d’un
   long contexte.
3. **Un bon résumé garde ce qui ne peut pas être retrouvé.** L’objectif et les contraintes, aussi près que
   possible des mots d’origine. Les décisions et leurs raisons. Ce qui est fait et ce qui reste. Ce qui a
   été essayé et a échoué, pour ne pas le réessayer. Où sont les choses : chemins, noms, identifiants, les
   commandes qui marchent. Et la prochaine étape. Il laisse de côté la sortie brute et les détours, n’en
   gardant que la conclusion.
4. **Compactez à une frontière, avec de la marge.** Le bon moment est quand une sous-tâche est terminée et
   que son état est clair (les tests passent, une décision est prise), pas au milieu d’un changement
   délicat. Faites-le bien avant que la fenêtre soit pleine : écrire le résumé demande de la place, et un
   contexte encombré est résumé aussi mal qu’il est utilisé. Beaucoup d’outils compactent d’eux-mêmes près
   de la limite ; choisir soi-même le moment donne en général un meilleur résumé.
5. **Les résumés échouent de façons reconnaissables.** Un détail qui comptait a disparu (le message d’erreur
   exact, un nom de fichier). Une contrainte est adoucie (« ne doit pas changer l’API » devient « fais
   attention à l’API »). Un état est inventé ou arrondi (« les tests passent » alors que deux échouent). La
   raison d’une décision est perdue, et l’agent la rouvre. Et chaque nouvelle compaction résume le résumé
   précédent, donc les erreurs s’accumulent. Protégez-vous : gardez la tâche d’origine mot pour mot en
   dehors du résumé, et traitez le résumé comme une affirmation à vérifier dans les fichiers et les tests.
6. **Parfois un nouveau départ vaut mieux qu’un résumé.** Quand la session est partie dans une mauvaise
   direction, ou est empêtrée dans des tentatives ratées, un résumé emporte la confusion avec lui. Ouvrez
   une nouvelle session avec un brief que vous maîtrisez : l’objectif, ce qui est sûr, ce qu’il faut éviter.
   Vous perdez l’historique, c’est le but.

## Teaching notes
- Analogie qui fonctionne : **le compte rendu d’une longue réunion**. Personne ne relit l’enregistrement.
  Un bon compte rendu donne les décisions, qui fait quoi et les points ouverts ; un mauvais dit « nous
  avons eu une discussion productive sur le budget ». Et un compte rendu écrit à partir de comptes rendus
  précédents, sans la réunion, dérive un peu à chaque fois.
- Les trois options forment une échelle, de la moindre à la plus grande perte : vider les anciens
  résultats, compacter, repartir de zéro. Demandez à l’apprenant de placer une situation sur l’échelle avant
  d’expliquer l’idée 6.
- Pour les apprenants qui construisent des agents : la compaction est une fonction de leur boucle (quand la
  déclencher, quel prompt écrit le résumé, ce qui est gardé tel quel). Le prompt de résumé mérite le même
  soin qu’un prompt système : listez-y les rubriques de l’idée 3.
- Pour les apprenants qui pilotent un assistant : la plupart des assistants de type agent proposent un
  moyen de compacter et un moyen d’ouvrir une nouvelle session ; renvoyez-les à la documentation de leur
  outil sans nommer de commande. Ce qu’ils contrôlent, c’est le moment, et souvent une phrase disant ce que
  le résumé doit conserver.
- Idée reçue : « la compaction est un détail technique, le résultat est la même conversation, en plus
  court ». C’est une réécriture par le modèle, avec tout ce que cela implique : il peut omettre, adoucir ou
  inventer.
- Idée reçue : « compactez le plus tard possible pour garder le plus de détails ». Une compaction tardive
  est faite par un modèle déjà en difficulté avec un contexte encombré, et peut ne pas avoir la place de
  terminer.
- Idée reçue : « après la compaction, l’agent sait toujours ce qu’il a lu ». Seulement ce que dit le
  résumé. Si le contenu d’un fichier compte de nouveau, il faut le relire ; c’est bien et peu coûteux.
- Ne promettez pas qu’un résumé peut être rendu sûr. La position honnête : avec perte, utile, et à vérifier
  par rapport à l’état réel du travail. La leçon 4 donne la réponse plus solide (l’état gardé en dehors de
  la fenêtre).
- Rythme : l’idée 3 et l’idée 5 sont les deux faces d’une même liste. Enseignez l’idée 3, puis demandez à
  l’apprenant de deviner comment chaque élément peut mal tourner avant de donner l’idée 5.

## Check your understanding
1. Quelle est la différence entre vider les anciens résultats d’outils et compacter, et pourquoi essayer d’abord de vider ?
   Good answer: vider remplace les résultats utilisés par de courtes notes et garde le raisonnement et les décisions ; compacter réécrit tout l’historique sous forme de résumé. Vider ne perd presque rien quand le contenu peut être récupéré à nouveau, c’est donc l’étape la moins chère et la plus sûre.
2. Listez quatre choses qu’un résumé de compaction doit conserver.
   Good answer: quatre éléments parmi l’objectif et les contraintes dans leurs mots d’origine, les décisions et leurs raisons, le travail fait et restant, les tentatives ratées, où sont les choses (chemins, noms, commandes) et la prochaine étape.
3. Quand est-ce un bon moment pour compacter, et quand est-ce un mauvais moment ?
   Good answer: bon à une frontière où une sous-tâche est terminée et l’état clair, avec de la place dans la fenêtre ; mauvais au milieu d’un changement délicat ou quand la fenêtre est presque pleine, car le résumé est alors médiocre ou ne peut pas être terminé.
4. Donnez une façon dont un résumé peut induire l’agent en erreur, et une protection contre elle.
   Good answer: un détail perdu, une contrainte adoucie, un état inventé ou arrondi, une raison perdue ou une dérive au fil des compactions répétées ; les protections incluent garder la tâche d’origine mot pour mot en dehors du résumé et vérifier les affirmations dans les fichiers et les tests (ou repartir de zéro quand la session est empêtrée).

## Completion criteria
L’apprenant répond correctement aux vérifications et sait nommer au moins deux choses qu’un résumé bâclé
perd (comme une contrainte ou une décision, ou le vrai statut des tests) et lister ce qu’un bon résumé
conserve.

## Going further
- Sujets : prompts de résumé, points de contrôle et reprise de longues tâches.
- Leçon suivante : la mémoire hors de la fenêtre, pour ce qui doit survivre à n’importe quel résumé.
