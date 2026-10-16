---
id: ai-coding-assistants-for-teams/06-team-setup
title: La configuration IA de votre équipe
level: intermediate
estimatedMinutes: 15
objectives:
  - Décider ce qui, dans la configuration IA, est partagé et ce qui reste personnel
  - Entretenir instructions, skills et plugins comme du code
  - Convenir de conventions d’équipe pour le travail assisté par l’IA et les déployer
prerequisites:
  - ai-coding-assistants-for-teams/05-permissions-and-hooks
---

## Key ideas
1. **La configuration fait partie de la base de code.** AGENTS.md, règles à portée, commandes, skills,
   réglages partagés et liste des plugins approuvés vivent dans le dépôt. Les changements passent par des
   pull requests et des relectures comme n’importe quel code, car ils changent le comportement de
   l’assistant de chaque coéquipier. Les fichiers personnels et réglages locaux restent hors de git.
2. **Gardez les règles vivantes.** Quand l’assistant fait deux fois la même erreur, ajoutez ou corrigez
   une règle (ou un contrôle, si cela ne doit jamais arriver). Quand une règle ne compte plus, supprimez-la.
   Testez un changement avec une session neuve sur une vraie tâche. Nommez un responsable pour que le
   fichier ne pourrisse pas, et pointez vers lui dans le README pour que les nouveaux le trouvent.
3. **Traitez les plugins et serveurs MCP comme des dépendances.** Un plugin, skill, hook ou serveur MCP
   tiers s’exécute avec vos accès et peut lire votre code, lancer des commandes ou envoyer des données
   ailleurs. Installez-les depuis des sources de confiance, lisez ce qu’ils font, figez les versions et
   gardez une courte liste approuvée. Un fichier d’instructions ou un skill malveillant dans une
   dépendance est un vecteur d’attaque connu.
4. **Convenez de conventions d’équipe.** Une charte de travail IA d’une page répond à quelques questions :
   quels outils sont approuvés et quel code ou quelles données peuvent leur être envoyés ; que le code écrit
   par l’IA passe la même barre de relecture, et que la personne qui ouvre la pull request en est
   responsable ; comment l’aide de l’IA est mentionnée (par exemple une ligne en pied de commit, si l’équipe
   le souhaite) ; et la taille des pull requests que les relecteurs accepteront.
5. **Déployez en douceur.** Commencez avec un dépôt et un petit AGENTS.md, montrez aux coéquipiers les
   commandes et skills qui font gagner du temps, et travaillez en binôme avec ceux qui sont moins à l’aise.
   Faites le point lors d’une rétro et ajustez. Des valeurs par défaut partagées aident ; imposer une
   méthode personnelle à tous, non.

## Teaching notes
- Exemple en direct : le dépôt LessonFolk est une petite configuration complète. `AGENTS.md` est partagé,
  `CLAUDE.md` l’importe et ajoute une règle de tests, les skills vivent dans `.claude/skills/`, le format
  des commits est convenu dans `AGENTS.md`, et `.progress/` reste personnel et ignoré par git. Demandez à
  l’apprenant de repérer chaque élément, puis ce qui manque (par exemple l’application de la règle de
  tests, leçon 5) ; c’est un bon récapitulatif du cours.
- Analogie qui fonctionne : **une cuisine partagée**. Des étagères étiquetées, un planning de nettoyage et
  une liste convenue de fournisseurs la font fonctionner pour tous ; un nouvel appareil d’un vendeur
  inconnu est vérifié avant d’être branché.
- Idée reçue : « on configure une fois et c’est fini ». Le code, les outils et l’équipe changent ; une
  règle périmée est pire que pas de règle, car l’assistant la suit avec assurance.
- Idée reçue : « le code écrit par l’IA demande un processus de relecture spécial ». La barre est la même ;
  ce qui change, c’est le volume, alors gardez les pull requests petites (vu dans le cours précédent).
- Les règles sur les données (ce qui peut aller vers quel outil) s’appuient sur le cours Utiliser l’IA en
  toute sécurité et avec discernement et sur la leçon 5 de Les assistants de code IA en pratique ;
  récapitulez-les en une ligne, ne les réenseignez pas.
- Posez des questions sur l’équipe réelle de l’apprenant (taille, outils, ce qui est déjà en place) et
  construisez les idées 4 et 5 à partir de ses réponses. Les apprenants qui travaillent seuls peuvent
  appliquer les idées 1 à 3 à leurs propres projets et garder l’idée 4 pour plus tard.
- C’est la dernière leçon : récapitulez le cours (instructions, portées, commandes et skills, garde-fous,
  configuration d’équipe) et célébrez. Suggérez la suite : Comment fonctionnent les applications d’IA pour ajouter de l’IA à leurs
  propres applications, et Agents IA et outils pour comprendre comment leur assistant fonctionne de
  l’intérieur.

## Check your understanding
1. Un coéquipier modifie AGENTS.md directement sur la branche principale pour ajouter une règle. Pourquoi est-ce un problème, et que devrait-il se passer à la place ?
   Good answer: le fichier change le comportement de l’assistant de chacun, donc le changement doit passer par une pull request et une relecture comme du code, et être testé sur une vraie tâche.
2. Quelqu’un suggère d’installer pour l’équipe un serveur MCP tiers populaire. Que vérifiez-vous d’abord ?
   Good answer: qui le publie et si la source est fiable, de quel accès il a besoin et ce qu’il fait des données (il s’exécute avec vos accès), qu’il est figé sur une version, et qu’il est ajouté à la liste approuvée après relecture.
3. Que mettriez-vous dans la charte de travail IA de votre équipe ? Donnez au moins trois points.
   Good answer: trois éléments parmi les outils approuvés et le code ou les données qui peuvent leur être envoyés, la même barre de relecture et la responsabilité du code écrit par l’IA par la personne qui ouvre la pull request, comment l’aide de l’IA est mentionnée, la taille des pull requests, où vit la configuration partagée et qui la maintient, comment ses changements sont relus.

## Completion criteria
L’apprenant répond correctement aux vérifications et a rédigé, ou sait décrire, une configuration d’équipe
qui couvre les fichiers partagés, la maintenance, la vérification des plugins et une charte de travail.

## Going further
- Comment fonctionnent les applications d’IA, pour ajouter des fonctionnalités d’IA à vos propres projets.
- Agents IA et outils, pour comprendre comment les assistants de type agent fonctionnent de l’intérieur.
- La documentation de votre assistant sur les réglages d’équipe et d’organisation.
