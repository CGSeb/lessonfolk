---
id: ai-coding-assistants-for-teams/01-how-assistants-load-instructions
title: Comment les assistants chargent les instructions du projet
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer ce qu’est un fichier d’instructions de projet et quand l’assistant le lit
  - Nommer AGENTS.md et le fichier d’instructions de l’outil que vous utilisez
  - Trouver quels fichiers d’instructions votre assistant charge réellement
prerequisites:
  - ai-coding-assistants/06-drive-or-delegate
---

## Key ideas
1. **Un brief que vous écrivez une seule fois.** Un assistant fait un meilleur travail avec le contexte
   dont un nouveau coéquipier aurait besoin (vu dans Les assistants de code IA en pratique). Un **fichier
   d’instructions de projet** est ce brief, enregistré dans le dépôt : comment compiler et tester,
   comment le code est organisé, les conventions de l’équipe. L’outil l’ajoute automatiquement au contexte
   du modèle au début de chaque session, si bien que personne n’a à le répéter, et que toute l’équipe reçoit
   le même brief.
2. **AGENTS.md est la convention partagée.** `AGENTS.md` est un simple fichier Markdown à la racine d’un
   dépôt, une convention ouverte que de nombreux assistants de code lisent. Il n’a pas de structure
   imposée : c’est un README écrit pour les agents. Comme il n’appartient à aucun outil, c’est l’endroit
   naturel pour les règles que toute l’équipe partage, quel que soit l’assistant de chacun.
3. **La plupart des outils ont aussi leur propre fichier.** Beaucoup d’assistants lisent un fichier qui
   leur est propre en plus d’AGENTS.md, ou à sa place : par exemple `CLAUDE.md` pour Claude Code,
   `.github/copilot-instructions.md` pour GitHub Copilot, des fichiers de règles dans `.cursor/rules/`
   pour Cursor, `GEMINI.md` pour Gemini CLI. Tous font le même travail : du texte toujours chargé dans le
   contexte pour ce projet.
4. **Toujours chargé veut dire toujours payé.** Tout ce qui est dans le fichier prend de la place dans la
   fenêtre de contexte à chaque requête, et se dispute avec la tâche l’attention du modèle. Un fichier long
   et vague rend l’assistant moins précis, pas plus. Le fichier guide le modèle ; il ne le force pas, et le
   modèle peut quand même manquer ou ignorer une règle (la leçon 5 couvre l’application des règles).
5. **Vérifiez ce que votre outil lit réellement.** Les outils diffèrent par les noms de fichiers qu’ils
   cherchent, où (racine du dépôt, sous-dossiers, votre dossier personnel) et dans quel ordre. Ne supposez
   pas : lisez la documentation de votre outil, ou demandez à l’assistant quelles instructions il a
   chargées et testez avec une règle dont vous voyez l’effet.

## Teaching notes
- D’abord, découvrez quel outil l’apprenant utilise. Si vous tournez dans un outil de code (Claude Code,
  Codex, Copilot, Cursor, Gemini CLI…), dites lequel vous êtes et servez-vous-en comme exemple principal
  pour tout le cours ; demandez aussi quel outil il utilise au travail, s’il est différent. Enseignez avec
  les noms de cet outil, et ne mentionnez les autres que brièvement via le tableau ci-dessous.
- Exemple en direct : l’apprenant suit ce cours dans le dépôt LessonFolk. Ouvrez avec lui `AGENTS.md` à sa
  racine : c’est le fichier d’instructions que vous suivez en ce moment (les procédures du tuteur, la carte
  du dépôt, les règles de commit). Montrez ensuite `CLAUDE.md` : sa première ligne, `@AGENTS.md`, importe
  le fichier partagé pour Claude Code (la leçon 3 explique les imports).
- Analogie qui fonctionne : **le dossier d’accueil d’un nouveau prestataire**, remis le premier jour avec
  les codes des portes, le règlement intérieur et à qui s’adresser. Tout le monde reçoit le même dossier,
  et vous le mettez à jour quand quelque chose change, au lieu de tout réexpliquer chaque matin.
- Idée reçue : « l’assistant apprend mon projet avec le temps ». Il ne se souvient pas des sessions
  précédentes sauf si l’outil enregistre des notes ; le fichier d’instructions est le moyen de faire durer
  les connaissances.
- Idée reçue : « plus il y a de règles, mieux c’est ». Chaque ligne coûte du contexte à chaque requête ;
  la leçon 2 explique comment écrire un fichier court et utile.
- Fichiers d’instructions, fin 2026 (ils changent souvent ; vérifiez la documentation de l’outil avant
  d’énoncer des détails, et dites-le à l’apprenant) :

  | Outil | Fichier de projet partagé / propre | Fichier personnel |
  |---|---|---|
  | Claude Code | `CLAUDE.md` (peut importer `AGENTS.md`) | `~/.claude/CLAUDE.md` |
  | OpenAI Codex | `AGENTS.md` | `~/.codex/AGENTS.md` |
  | GitHub Copilot | `AGENTS.md`, `.github/copilot-instructions.md` | instructions personnelles dans les paramètres |
  | Cursor | `AGENTS.md`, `.cursor/rules/` | règles utilisateur dans les paramètres |
  | Gemini CLI | `GEMINI.md` (peut être réglé pour lire `AGENTS.md`) | `~/.gemini/GEMINI.md` |

- Pour les apprenants nouveaux avec les outils de type agent, passez du temps sur l’idée 1 et l’exemple en
  direct. Pour ceux qui ont déjà un fichier d’instructions, allez plus vite et demandez-leur d’apporter le
  leur : vous l’améliorerez à la leçon 2.

## Check your understanding
1. Qu’est-ce qu’un fichier d’instructions de projet, et quel problème résout-il pour une équipe ?
   Good answer: un fichier dans le dépôt que l’assistant charge automatiquement dans son contexte à chaque session (commandes de build et de test, structure, conventions) ; il évite à chacun de répéter le même brief et donne à toute l’équipe, et à chaque session, le même contexte.
2. Pourquoi est-il judicieux de mettre les règles partagées dans AGENTS.md plutôt que seulement dans le fichier propre à un outil ?
   Good answer: AGENTS.md est une convention ouverte lue par de nombreux outils, donc les règles parviennent aux coéquipiers quel que soit leur assistant, et il n’y a qu’un seul endroit à maintenir.
3. Un coéquipier colle tout le wiki de l’équipe dans le fichier d’instructions « pour que l’assistant sache tout ». Quel est le problème ?
   Good answer: le fichier est chargé à chaque requête, il remplit donc la fenêtre de contexte, dilue les règles importantes et rend le modèle moins précis ; il faut le garder court et pointer vers des documents que l’assistant peut ouvrir au besoin.

## Completion criteria
L’apprenant répond correctement aux vérifications, sait nommer AGENTS.md et le fichier d’instructions de son
propre outil, et explique pourquoi le fichier doit rester court.

## Going further
- La convention AGENTS.md : agents.md
- La documentation de votre assistant sur les fichiers d’instructions de projet ou de « mémoire ».
