---
id: ai-coding-assistants-for-teams/03-scopes-layers-and-imports
title: Portées, couches et source de vérité unique
level: intermediate
estimatedMinutes: 15
objectives:
  - Distinguer les instructions personnelles, de projet et de niveau dossier
  - Utiliser des règles à portée de chemin pour des parties d’une base de code
  - Garder une source de vérité partagée unique entre plusieurs outils
prerequisites:
  - ai-coding-assistants-for-teams/02-writing-agents-md
---

## Key ideas
1. **Trois couches.** Les instructions **personnelles** vivent dans votre dossier personnel ou dans les
   paramètres de votre outil et s’appliquent à tous vos projets (votre langue, votre style d’explication
   préféré). Les instructions de **projet** vivent dans le dépôt et sont partagées avec l’équipe. Certains
   outils gèrent aussi des fichiers de projet **locaux** non committés, pour vos propres notes sur un
   projet. Les règles d’équipe vont dans la couche projet ; les goûts personnels restent personnels.
2. **Des règles pour une partie de la base de code.** Le frontend et le backend d’un monorepo ont besoin de
   règles différentes. Les outils gèrent cela avec des **fichiers imbriqués** (un `AGENTS.md` dans un
   sous-dossier, lu quand l’assistant y travaille) ou avec des **règles à portée de chemin** qui déclarent
   à quels fichiers elles s’appliquent (un motif comme `src/api/**`). Les règles à portée gardent le
   fichier racine court et ne chargent que ce qui est pertinent.
3. **Sachez ce qui l’emporte.** Quand les couches se contredisent, les outils laissent en général
   l’instruction la plus précise l’emporter (le dossier le plus proche plutôt que la racine, le projet
   plutôt que votre fichier personnel), mais l’ordre exact diffère selon les outils. Évitez les conflits
   plutôt que de compter sur l’ordre : une règle, un endroit.
4. **Une seule source de vérité.** Une équipe qui utilise plusieurs assistants ne devrait pas garder cinq
   copies des mêmes règles : elles divergent. Écrivez les règles partagées une seule fois, dans AGENTS.md,
   et faites-les lire par chaque outil : nativement, par une ligne d’**import** dans le fichier propre à
   l’outil, par un réglage qui change le nom de fichier que l’outil lit, ou par un lien symbolique. Ne
   gardez dans le fichier propre à l’outil que ce qui lui est spécifique.

## Teaching notes
- Exemple en direct : LessonFolk fait exactement l’idée 4. `AGENTS.md` contient les règles partagées, et
  `CLAUDE.md` commence par `@AGENTS.md` (la syntaxe d’import de Claude Code), puis ajoute une section en
  plus (lancer les tests sur les branches de code). Montrez les deux fichiers.
- Analogie qui fonctionne : **la politique de l’entreprise, le règlement du bureau et votre propre
  bureau**. Le règlement de l’entreprise s’applique partout, le laboratoire d’à côté a ses règles de
  sécurité en plus, et la façon dont vous rangez votre bureau ne regarde que vous ; si le règlement est
  copié dans chaque bureau, les copies finissent par se contredire.
- Comment les outils s’y prennent, fin 2026 (vérifiez la documentation avant d’énoncer des détails) :

  | Outil | Règles imbriquées / à portée | Réutiliser AGENTS.md |
  |---|---|---|
  | Claude Code | `CLAUDE.md` dans des sous-dossiers ; fichiers de règles dans `.claude/rules/` avec motifs de chemin | import `@AGENTS.md` dans `CLAUDE.md` |
  | OpenAI Codex | `AGENTS.md` imbriqués (le plus proche du fichier modifié l’emporte) | natif |
  | GitHub Copilot | `.github/instructions/*.instructions.md` avec motifs `applyTo` | lit `AGENTS.md` |
  | Cursor | fichiers `.cursor/rules/` avec motifs glob ou « toujours appliquer » | lit `AGENTS.md` |
  | Gemini CLI (comptes professionnels et clés d’API uniquement) | `GEMINI.md` dans des sous-dossiers | le réglage `contextFileName` peut pointer vers `AGENTS.md` |

- Idée reçue : « un lien symbolique règle tout ». Cela marche, mais les liens symboliques se comportent mal
  sur certains systèmes (surtout les copies de travail sous Windows) ; une ligne d’import ou un réglage est
  souvent plus robuste.
- Idée reçue : « les préférences personnelles vont dans le fichier du projet ». Écrire « réponds en
  français » ou « sois très bref » dans le fichier partagé impose le goût d’une personne à toute l’équipe.
- Pour les apprenants de petits projets à un seul outil, restez bref : personnel contre projet, et l’idée
  d’une source de vérité unique. Passez plus de temps sur les règles à portée avec les apprenants en
  monorepo.

## Check your understanding
1. Vous aimez que l’assistant explique ses changements en détail ; votre coéquipier préfère des réponses courtes. Où va chaque préférence ?
   Good answer: dans les instructions personnelles de chacun (dossier personnel ou paramètres de l’outil), pas dans le fichier de projet partagé.
2. Votre équipe utilise deux assistants différents et garde une copie des mêmes règles dans le fichier de chaque outil. Qu’est-ce qui ne va pas, et quelle est la solution ?
   Good answer: les copies divergent quand on met à jour l’une et qu’on oublie l’autre ; garder les règles partagées une seule fois dans AGENTS.md et faire lire ce fichier par chaque outil (nativement, par import, par réglage ou par lien), avec seulement les ajouts propres à l’outil dans son fichier.
3. Pourquoi utiliser une règle à portée pour le dossier `api/` plutôt que de l’ajouter au fichier racine ?
   Good answer: elle ne se charge que quand l’assistant travaille sur des fichiers correspondants, donc le fichier racine reste court et les autres tâches ne sont pas encombrées de règles sans rapport.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait expliquer où va une règle donnée (personnelle,
de projet, à portée) et comment partager un seul AGENTS.md entre plusieurs outils.

## Going further
- La documentation de votre assistant sur les portées de règles, les fichiers imbriqués et les imports.
