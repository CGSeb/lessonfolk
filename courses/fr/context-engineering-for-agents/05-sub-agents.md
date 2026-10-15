---
id: context-engineering-for-agents/05-sub-agents
title: "Les sous-agents : déléguer à un contexte neuf"
level: advanced
estimatedMinutes: 20
objectives:
  - Expliquer comment un sous-agent garde petit le contexte de l’agent principal
  - Rédiger un brief sur lequel un sous-agent peut agir sans le contexte de l’agent principal
  - Décider ce qu’un sous-agent doit renvoyer, et traiter son rapport comme une affirmation à vérifier
prerequisites:
  - context-engineering-for-agents/04-memory-outside-the-window
---

## Key ideas
1. **Un sous-agent est une boucle d’agent appelée comme un outil.** L’agent principal appelle quelque chose
   comme `run_subagent(brief)`. Votre code démarre une seconde boucle avec sa propre liste de messages
   vide, ses propres outils et sa propre limite d’étapes. Cette boucle travaille jusqu’à avoir une réponse,
   et seule cette réponse finale revient à l’agent principal, comme un résultat d’outil ordinaire.
2. **L’avantage est l’isolation.** Le sous-agent peut lire quarante fichiers et remplir sa propre fenêtre ;
   l’agent principal reçoit un paragraphe. Toute l’exploration reste hors du contexte principal, qui reste
   centré sur la tâche et ses décisions. C’est un échange, pas une économie : le travail total effectué
   par les modèles augmente en général. Vous payez plus pour garder un contexte propre.
3. **Le brief est tout le monde du sous-agent.** Il démarre sans rien savoir de ce que sait l’agent
   principal : ni l’objectif de l’utilisateur, ni les contraintes, ni ce qui a déjà été écarté. Un brief
   qui marche donne l’objectif et pourquoi il compte, à quoi ressemble « terminé », ce qui est déjà connu,
   les limites (lecture seule ? quels fichiers sont interdits ?) et ce qu’il faut renvoyer. C’est le modèle
   principal qui écrit ce brief, donc ses propres instructions doivent demander ces éléments.
4. **Décidez de ce qui revient.** Demandez un rapport court et structuré : la réponse, les preuves
   (chemins, lignes, commandes lancées), ce qui a été vérifié et ce qui n’est qu’inféré, et ce qui n’a pas
   été fait. Tout ce qui est volumineux va dans un fichier, et le rapport en donne le chemin. Un rapport
   aussi long que l’exploration ramène le problème que le sous-agent était là pour supprimer.
5. **Un rapport est une affirmation, pas un fait.** Un sous-agent peut s’arrêter trop tôt, mal lire, ou
   dire qu’il a réussi alors que non (annoncer un succès est vu dans Agents IA et outils). L’agent
   principal voit le rapport, pas la trace qui est derrière. Vérifiez en proportion des enjeux : ouvrez le
   fichier qu’il cite, lancez le test dont il dit qu’il passe. Et gardez la trace du sous-agent dans vos
   propres journaux, car vous en aurez besoin pour comprendre un mauvais rapport.
6. **Donnez-lui moins de pouvoir qu’à l’agent principal.** Un sous-agent envoyé enquêter a besoin d’outils
   de lecture, pas d’écriture. Donnez à chacun le plus petit ensemble d’outils pour sa mission, sa propre
   limite d’étapes et de coût, et aucune possibilité de lancer d’autres sous-agents sauf si vous l’avez
   prévu. Cela limite à la fois les accidents et ce qu’une instruction injectée pourrait faire.

## Teaching notes
- Analogie qui fonctionne : **envoyer un assistant de recherche aux archives**. Il passe la journée parmi
  les cartons ; vous recevez une note d’une page. Votre bureau reste dégagé. Mais la note vaut ce que vaut
  votre demande (« renseigne-toi sur le contrat de 1987 » contre « trouve qui a signé le contrat de 1987
  avec Dupont, et rapporte une copie de la page des signatures »), et vous n’étiez pas aux archives, donc
  pour tout ce qui est important vous demandez à voir la page.
- Partez de la boucle d’agent, reformulée en une phrase depuis Agents IA et outils : le modèle demande un
  outil, le code l’exécute et ajoute le résultat. Un sous-agent, c’est cela, où l’outil se trouve être une
  autre boucle. Rien de plus mystérieux.
- Pour les apprenants qui construisent des agents : les pièces sont une fonction qui exécute une boucle et
  renvoie une chaîne, une définition d’outil pour elle, et des lignes de prompt système qui apprennent au
  modèle principal à rédiger un brief. Demandez où la trace du sous-agent leur serait visible.
- Pour les apprenants qui pilotent un assistant : beaucoup d’assistants de type agent peuvent lancer des
  sous-agents, d’eux-mêmes ou sur demande ; renvoyez les apprenants à la documentation de leur outil. Ce
  qu’ils peuvent faire aujourd’hui : demander à l’assistant de déléguer une enquête et de faire un bref
  rapport, et lire le brief qu’il rédige quand l’outil le montre.
- Idée reçue : « le sous-agent sait ce que nous avons fait jusque-là ». Il connaît le brief. L’échec le
  plus courant est un brief d’une ligne écrit par un agent principal qui a oublié que le lecteur part de
  zéro, la même erreur que la note de passation de la leçon 4.
- Idée reçue : « les sous-agents rendent la tâche moins chère ». Ils rendent le contexte principal plus
  petit. Le total coûte en général plus cher.
- Idée reçue : « le rapport est le résultat des outils, donc il est fiable ». C’est le résumé qu’un modèle
  fait de son propre travail, avec les faiblesses de tout résumé (leçon 3).
- Le brief et le rapport sont deux passations avec perte. Reliez-les aux leçons 3 et 4 en une phrase : la
  compétence qui consiste à écrire pour un lecteur sans contexte est la même.
- Gardez la question « quand utiliser plusieurs agents ? » pour la leçon 6. Ici, l’apprenant doit repartir
  capable de bien déléguer un morceau de travail.

## Check your understanding
1. En quel sens un sous-agent « économise-t-il du contexte », et que n’économise-t-il pas ?
   Good answer: son exploration se déroule dans sa propre fenêtre et seul un court rapport entre dans le contexte principal, qui reste concentré ; il n’économise pas le travail total des modèles ni le coût, qui augmentent en général.
2. Que doit contenir un brief pour qu’un sous-agent fasse un travail utile ?
   Good answer: l’objectif et pourquoi il compte, à quoi ressemble terminé, ce qui est déjà connu ou écarté, les contraintes et limites, et ce qu’il faut renvoyer et sous quelle forme ; car le sous-agent démarre sans rien du contexte de l’agent principal.
3. Que doit contenir le rapport d’un sous-agent, et pourquoi doit-il rester court ?
   Good answer: la réponse, les preuves (chemins, lignes, commandes), ce qui a été vérifié par opposition à inféré, et ce qui n’a pas été fait ; court parce qu’un long rapport remplit à nouveau le contexte principal, le matériel volumineux étant écrit dans un fichier et référencé.
4. Un sous-agent rapporte « la cause est dans `auth/refresh.py`, ligne 88 ; je l’ai confirmé avec les tests ». Que doit faire l’agent principal, ou vous, avant d’agir dessus ?
   Good answer: le traiter comme une affirmation : lire les lignes citées, lancer ou inspecter le test mentionné, en proportion des enjeux ; et avoir la trace du sous-agent à disposition pour vérifier ce qu’il a réellement fait.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait lister ce que doit contenir le brief d’un
sous-agent et ce que doit contenir son rapport.

## Going further
- Sujets : conceptions orchestrateur et travailleurs, moindre privilège pour les agents, journalisation et traçage d’agents imbriqués.
- Leçon suivante : un agent ou plusieurs, pour décider quand la délégation en vaut la peine.
