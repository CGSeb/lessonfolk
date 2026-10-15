---
id: context-engineering-for-agents/02-budgeting-the-context-window
title: Budgétiser la fenêtre de contexte
level: advanced
estimatedMinutes: 20
objectives:
  - Lister ce qui partage la fenêtre de contexte d’un agent
  - Trouver où vont les tokens avant de couper quoi que ce soit
  - Réduire le gaspillage avec des résultats d’outils façonnés, des références et des coûts fixes plus légers
prerequisites:
  - context-engineering-for-agents/01-why-long-tasks-go-wrong
---

## Key ideas
1. **Cinq choses se partagent la fenêtre.** Les instructions (prompt système et règles du projet), les
   définitions d’outils (nom, description et arguments de chaque outil, envoyés à chaque étape même
   inutilisés), les messages (ce que l’utilisateur a dit, ce que le modèle a répondu et planifié), les
   résultats d’outils, et la place laissée à la prochaine réponse. Un budget commence par connaître ces
   cinq lignes.
2. **Mesurez avant de couper.** Comptez les tokens de chaque part à quelques moments d’une vraie tâche : les
   chiffres de consommation renvoyés avec chaque appel de modèle, ou un décompte par type de message dans
   votre propre journal, suffisent. Dans la plupart des longues tâches, les résultats d’outils sont de loin
   la plus grosse part. Coupez d’abord la plus grosse part, pas celle que vous regardez le plus souvent
   (en général le prompt système).
3. **Façonnez les résultats d’outils à la source.** Un résultat d’outil est un texte que votre code a choisi
   de renvoyer : renvoyez donc ce dont l’étape suivante a besoin : les lignes qui correspondent avec un peu
   d’autour, pas le fichier ; les tests qui échouent, pas tout le journal ; un décompte et les premières
   lignes, pas toute la table. Quand vous coupez, dites-le dans le résultat (« affichage de 20 lignes sur
   2 340 ; filtrez pour restreindre »), pour que le modèle sache qu’il y en a plus et comment l’obtenir. Une
   troncature silencieuse le fait raisonner à partir d’une vue partielle sans le savoir.
4. **Gardez des références, chargez le contenu quand il le faut.** Un chemin de fichier, un identifiant ou
   une table des matières coûte quelques tokens ; le contenu en coûte des milliers. Donnez à l’agent les
   références et un outil pour aller chercher le détail à l’étape qui en a besoin, plutôt que de tout
   charger « par sécurité » au début. Le compromis : plus d’étapes, et l’agent peut manquer ce qu’il n’ouvre
   jamais (le même risque que la récupération, vue dans Agents IA et outils). Les références ont besoin de
   bons noms pour valoir la peine d’être ouvertes.
5. **Les coûts fixes se paient à chaque étape.** Tout ce qui se trouve en haut du contexte est renvoyé et
   relu à chaque tour : un long prompt système, des dizaines d’outils aux longues descriptions, des
   documents chargés « au cas où ». Ne gardez là que ce dont chaque étape a besoin. Déplacez les consignes
   pour les situations rares vers quelque chose que l’agent peut charger à la demande, et retirez les outils
   dont la tâche n’a pas besoin : de nombreux outils similaires font aussi mal choisir le modèle.

## Teaching notes
- Analogie qui fonctionne : **un établi et des tiroirs étiquetés**. Sur l’établi : la pièce sur laquelle
  vous travaillez et les deux outils en cours d’utilisation. Tout le reste est dans des tiroirs aux
  étiquettes claires, à portée de main. Un établi couvert de tous les outils que vous possédez est plus
  lent à utiliser, même si rien ne manque. Les étiquettes comptent : un tiroir sans étiquette n’est jamais
  ouvert.
- Pour les apprenants qui construisent des agents : chaque idée est un changement dans leur code (fonctions
  d’outils, prompt système, liste d’outils). Demandez ce que leurs outils renvoient aujourd’hui et quel
  résultat est le plus gros.
- Pour les apprenants qui pilotent un assistant : ils ne peuvent pas réécrire ses outils, mais ils
  contrôlent beaucoup. Demandez des lectures ciblées (« seulement la fonction `refund` »), préférez les
  commandes à sortie courte (une exécution de tests silencieuse, un journal filtré), déconnectez les outils
  et extensions dont la tâche n’a pas besoin, et gardez courts les fichiers d’instructions du projet.
  Beaucoup d’assistants peuvent montrer comment le contexte est actuellement rempli : renvoyez l’apprenant à
  la documentation de son outil et ne nommez pas de commande.
- Idée reçue : « couper la sortie des outils fait perdre de l’information, donc c’est risqué ». Le risque
  est la coupe silencieuse. Un résultat qui dit ce qui a été coupé et comment obtenir le reste ne perd rien :
  le détail reste à un appel d’outil de distance.
- Idée reçue : « chargez tout au début pour que l’agent ait une vue complète ». La vue complète, c’est
  exactement le bureau encombré de la leçon 1. Une carte de ce qui existe vaut mieux que le contenu de tout.
- Idée reçue : « le prompt système est petit, il n’a pas d’importance ». Multipliez-le par le nombre
  d’étapes, et rappelez-vous qu’il se dispute l’attention avec la tâche à chacune d’elles.
- L’idée 2 est celle que les apprenants sautent. Insistez : sans mesure, on réduit les instructions écrites
  à la main et on laisse l’outil qui renvoie des fichiers entiers.
- Ne donnez ni nombres de tokens, ni prix, ni tailles de fenêtre. Si l’apprenant veut des chiffres,
  faites-le raisonner en parts (« environ deux tiers de la fenêtre sont de la sortie de tests »).
- Vider les résultats déjà présents dans l’historique est la leçon suivante (compaction) ; ici, le sujet
  est ce qui entre dans la fenêtre au départ.

## Check your understanding
1. Nommez ce qui partage la fenêtre de contexte d’un agent. Quelle part est généralement la plus grosse dans une longue tâche ?
   Good answer: les instructions, les définitions d’outils, les messages (utilisateur et modèle), les résultats d’outils et la place pour la réponse ; les résultats d’outils dominent en général.
2. Un outil de recherche renvoie le contenu complet de chaque fichier correspondant. Comment changeriez-vous ce qu’il renvoie, et que doit dire le résultat ?
   Good answer: renvoyer les lignes correspondantes avec un peu de contexte, ou des chemins avec un décompte, limités à un nombre raisonnable ; indiquer ce qui a été laissé de côté et comment en obtenir plus (affiner la requête, lire un fichier précis), pour que la coupe ne soit pas silencieuse.
3. Qu’y gagnez-vous et que risquez-vous en donnant à l’agent une liste de chemins de fichiers et un outil de lecture, plutôt que de charger les fichiers d’avance ?
   Good answer: on gagne un contexte bien plus petit et un contenu chargé seulement quand il est pertinent ; on risque des étapes en plus et que l’agent n’ouvre jamais un fichier qui comptait, surtout si les noms sont peu clairs.
4. Pourquoi un outil inutilisé à longue description coûte-t-il plus qu’il n’y paraît ?
   Good answer: les définitions d’outils sont un coût fixe envoyé et lu à chaque étape, donc le coût est multiplié par le nombre d’étapes, et des outils similaires en plus rendent le choix d’outil moins fiable.

## Completion criteria
L’apprenant répond correctement aux vérifications et, pour un contexte trop plein, part de la plus grosse
part et propose au moins trois changements concrets, dont un qui transforme du contenu en référence ou dit
ce qui a été coupé.

## Going further
- Sujets : tokenizers et comptage de tokens, mise en cache des prompts, conception d’outils pour agents.
- Leçon suivante : la compaction, pour ce qui est déjà dans la fenêtre.
