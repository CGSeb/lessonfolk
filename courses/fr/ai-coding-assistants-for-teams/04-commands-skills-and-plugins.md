---
id: ai-coding-assistants-for-teams/04-commands-skills-and-plugins
title: Commandes, skills et plugins
level: intermediate
estimatedMinutes: 20
objectives:
  - Distinguer les règles toujours chargées des commandes et skills à la demande
  - Choisir entre une commande, un skill, un sous-agent et un plugin pour un workflow d’équipe
  - Expliquer comment les plugins et les serveurs MCP étendent un assistant
prerequisites:
  - ai-coding-assistants-for-teams/03-scopes-layers-and-imports
---

## Key ideas
1. **Des règles pour chaque tâche, des workflows pour certaines tâches.** Le fichier d’instructions est
   chargé à chaque fois, il ne doit donc contenir que ce qui s’applique à toute tâche. Une procédure
   répétable (« préparer une release », « écrire une migration », « relire une PR selon notre liste de
   contrôle ») appartient à quelque chose qui n’est chargé qu’en cas de besoin.
2. **Commandes : un prompt enregistré que vous appelez par son nom.** La plupart des outils permettent
   d’enregistrer un prompt dans un fichier du dépôt et de le lancer comme commande slash
   (`/release-notes`) ou fichier de prompt, souvent avec des arguments. Toute l’équipe lance alors le même
   prompt relu au lieu de retaper sa propre version.
3. **Skills : des instructions que l’assistant récupère quand elles sont pertinentes.** Un **skill** est
   un dossier avec un fichier `SKILL.md` (un nom, une description d’une ligne, puis des instructions) et
   éventuellement des scripts ou des modèles. Seule la description reste dans le contexte ; l’assistant lit
   le reste quand une tâche y correspond, ou quand vous l’invoquez. Les skills permettent d’ajouter de
   nombreux workflows sans alourdir chaque requête. Le format `SKILL.md` est partagé par plusieurs outils.
4. **Sous-agents : un assistant avec son propre contexte.** Certains outils permettent de définir des
   agents spécialisés (un relecteur, un rédacteur de tests) avec leurs propres instructions et des outils
   limités. L’assistant principal leur confie une tâche, et ils renvoient un résultat sans remplir la
   conversation principale de leur travail.
5. **Plugins et MCP : empaqueter et connecter.** Un **plugin** (appelé extension dans certains outils)
   regroupe commandes, skills, agents, hooks et connexions pour qu’une équipe les installe en une seule
   étape, depuis le dépôt ou un catalogue partagé (une « marketplace »). Les serveurs **MCP** (Model
   Context Protocol) connectent l’assistant à des systèmes extérieurs comme le suivi de tickets, une base
   de données ou la documentation ; les plugins en incluent souvent. Tout ce que vous installez s’exécute
   avec vos accès, traitez-le donc comme une dépendance (leçon 6).

## Teaching notes
- Exemple en direct : ouvrez `.claude/skills/` dans le dépôt LessonFolk avec l’apprenant. Chaque dossier
  (`learn`, `progress`, `review`, `create-course`, `edit-course`) a un court `SKILL.md` dont la description
  dit quand l’utiliser, et dont le corps renvoie à une procédure dans `AGENTS.md`. Montrez comment cela
  garde les procédures dans un seul fichier partagé (leçon 3) tout en donnant à Claude Code des points
  d’entrée nommés, à la demande. `course-builder`, dans le même dossier, est un petit plugin qui ajoute un
  panneau latéral pendant la rédaction d’un cours.
- Si vous tournez dans un outil, montrez à l’apprenant comment lister les commandes ou skills disponibles
  dans cette session.
- Analogie qui fonctionne : **le règlement sur le frigo contre le classeur de recettes**. Les règles sur le
  frigo s’appliquent à tous, tous les jours ; les recettes restent dans le classeur jusqu’à ce que
  quelqu’un cuisine ce plat. Les plugins sont un classeur de recettes qu’on peut acheter ou partager ; MCP
  donne à la cuisine un accès à la boutique d’à côté.
- Comment les outils nomment tout cela, fin 2026 (cela change vite ; vérifiez la documentation, et ne
  présentez pas les manques comme définitifs) :

  | Concept | Claude Code | OpenAI Codex | GitHub Copilot | Cursor | Gemini CLI |
  |---|---|---|---|---|---|
  | Prompts enregistrés | commandes slash (intégrées aux skills) | prompts personnalisés | `.github/prompts/*.prompt.md` | `.cursor/commands/` | `.gemini/commands/*.toml` |
  | Skills (`SKILL.md`) | `.claude/skills/` | pris en charge | pris en charge | voir la doc | voir la doc |
  | Sous-agents | `.claude/agents/` | voir la doc | agents personnalisés (`.github/agents/`) | voir la doc | voir la doc |
  | Lots | plugins et marketplaces | voir la doc | voir la doc | voir la doc | extensions |
  | Serveurs MCP | oui | oui | oui | oui | oui |

- Idée reçue : « mettez chaque procédure dans AGENTS.md ». Cela marche pour quelques-unes, mais un long
  fichier dilue les règles qui comptent ; déplacez les procédures vers des skills ou des commandes dès
  qu’il y en a plusieurs.
- Idée reçue : « un skill, c’est du code ». Un skill est surtout des instructions textuelles ; les scripts
  sont des aides facultatives qu’il peut lancer.
- Gardez MCP au niveau de « ce qu’il connecte » ; le fonctionnement interne de l’appel d’outils et de MCP
  est enseigné dans le cours Agents IA et outils.
- Pour les apprenants qui préfèrent faire plutôt que lire, écrivez ensemble une petite commande ou un
  skill pendant la leçon et lancez-le.

## Check your understanding
1. Votre équipe a une procédure de 30 lignes pour préparer une release. Pourquoi la mettre dans une commande ou un skill plutôt que dans AGENTS.md ?
   Good answer: AGENTS.md est chargé à chaque requête, donc une procédure utilisée occasionnellement gaspille du contexte et dilue les autres règles ; une commande ou un skill n’est chargé que lorsque la tâche de release se présente, et l’équipe partage toujours une seule version relue.
2. Quelle est la différence entre une commande et un skill ?
   Good answer: une commande est un prompt enregistré qu’on appelle explicitement par son nom ; un skill a une description qui reste dans le contexte pour que l’assistant puisse charger ses instructions (et fichiers) de lui-même quand une tâche y correspond, ainsi que quand on l’appelle.
3. Qu’apporte un plugin par rapport au fait de committer quelques fichiers de commandes dans le dépôt ?
   Good answer: il regroupe plusieurs éléments (commandes, skills, agents, hooks, connexions MCP) en une unité installable et versionnée qui peut être partagée entre projets et équipes via un catalogue.
4. Chaque fois que votre assistant relit une pull request selon la liste de contrôle de l’équipe, la longue relecture remplit la conversation principale. Quelle option de cette leçon convient, et pourquoi ?
   Good answer: un sous-agent (un relecteur avec ses propres instructions et des outils limités) ; il travaille dans son propre contexte et ne renvoie que le résultat.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait choisir, pour un workflow d’équipe donné, entre
le fichier d’instructions, une commande, un skill, un sous-agent et un plugin, avec une raison.

## Going further
- Le cours Agents IA et outils, pour l’appel d’outils et la façon dont les agents utilisent des systèmes extérieurs.
- La documentation de votre assistant sur les commandes, skills, sous-agents et plugins.
- La documentation du Model Context Protocol : modelcontextprotocol.io
