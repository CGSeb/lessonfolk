---
id: ai-coding-assistants-for-teams/05-permissions-and-hooks
title: "Garde-fous : permissions et hooks"
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer pourquoi les instructions seules ne peuvent pas garantir qu’une règle est suivie
  - Utiliser les permissions pour limiter ce qu’un assistant peut faire
  - Utiliser les hooks et la CI pour faire respecter les règles automatiquement
prerequisites:
  - ai-coding-assistants-for-teams/04-commands-skills-and-plugins
---

## Key ideas
1. **Les instructions guident, la configuration impose.** « Ne modifie jamais `.env` » dans AGENTS.md est
   une demande que le modèle suivra en général, et manquera parfois. Pour les règles qui doivent tenir à
   chaque fois, utilisez quelque chose que l’outil ou la chaîne de livraison vérifie, et qui ne dépend pas
   de l’attention du modèle.
2. **Les permissions décident de ce que l’assistant peut faire.** Les outils de type agent demandent avant
   les actions risquées, et vous laissent fixer des règles : les commandes qu’il peut lancer sans demander
   (`npm test`), les actions toujours refusées (lire des fichiers secrets, `git push`, supprimer des
   dossiers), les dossiers qu’il peut modifier. Beaucoup exécutent aussi les commandes dans un **bac à
   sable** qui limite l’accès aux fichiers et au réseau. Moins de demandes pour les actions sûres et des
   limites fermes pour les dangereuses valent mieux que cliquer sur « autoriser » pour tout.
3. **Les hooks lancent vos scripts à des moments fixes.** Un **hook** est une commande que l’outil lance
   automatiquement à un moment donné : avant l’utilisation d’un outil, après la modification d’un fichier,
   à la fin d’une tâche. Usages typiques : formater un fichier après chaque modification, bloquer les
   modifications de chemins protégés, lancer les tests rapides avant que l’assistant annonce « terminé »,
   envoyer une notification. Un hook ne repose pas sur la mémoire du modèle.
4. **Réglages partagés et réglages personnels.** La plupart des outils ont un fichier de réglages que vous
   pouvez committer pour que toute l’équipe ait les mêmes permissions et hooks, et un fichier personnel ou
   local pour les préférences individuelles. Les garde-fous d’équipe vont dans le fichier committé et sont
   relus comme du code.
5. **La CI est la dernière barrière.** Quoi qu’il se passe sur un ordinateur portable, la chaîne
   d’intégration continue (tests, analyseur, détection de secrets, relectures obligatoires) vérifie chaque
   changement avant sa fusion, quel que soit celui ou ce qui l’a écrit. Les garde-fous locaux attrapent
   les problèmes tôt ; la CI garantit qu’aucun ne passe.

## Teaching notes
- Analogie qui fonctionne : **un panneau contre une serrure**. « Réservé au personnel » sur une porte est
  une instruction que la plupart des gens respectent ; un lecteur de badge est une contrainte. Utilisez des
  panneaux pour les préférences, des serrures pour ce qui ne doit jamais arriver.
- Exemple en direct : dans le dépôt LessonFolk, `CLAUDE.md` demande à l’assistant de lancer `npm test`
  avant de committer. C’est une instruction, pas une contrainte. Montrez-le, puis demandez à l’apprenant
  ce qui le rendrait fiable (un hook qui lance les tests avant la fin de la tâche, un workflow de CI sur
  chaque pull request) et auquel il ferait le plus confiance. Vérifiez d’abord `.github/` : n’affirmez pas
  que le dépôt a une CI sans voir un workflow.
- Si vous tournez dans un outil avec des demandes de permission, signalez celles que l’apprenant a vues
  pendant cette session : c’est l’idée 2 en action.
- Comment les outils s’y prennent, fin 2026 (vérifiez la documentation avant d’énoncer des détails) :

  | Outil | Permissions et bac à sable | Hooks |
  |---|---|---|
  | Claude Code | règles allow / ask / deny dans `.claude/settings.json` (partagé) et un fichier de réglages local ; mode bac à sable | hooks dans les réglages (avant et après l’usage d’un outil, à l’arrêt…), aussi fournis par les plugins |
  | OpenAI Codex | modes d’approbation et réglages de bac à sable dans `config.toml` | voir la doc |
  | GitHub Copilot | approbations d’outils dans l’éditeur ; l’agent cloud tourne dans un environnement restreint | voir la doc |
  | Cursor | liste d’autorisations et réglages d’exécution automatique pour les commandes de terminal | `hooks.json` |
  | Gemini CLI | dossiers de confiance, réglages d’autorisation / d’exclusion d’outils, bac à sable | voir la doc |

- Idée reçue : « l’assistant demande avant tout, donc c’est sûr ». La fatigue des permissions est réelle :
  on clique sur « autoriser » sans lire. Autorisez explicitement les actions sûres et fréquentes pour que
  les demandes restantes soient rares et prises au sérieux.
- Idée reçue : « les hooks remplacent la CI ». Les hooks tournent sur la machine d’une personne et peuvent
  être désactivés ; la CI tourne pour tout le monde. Utilisez les deux.
- Les hooks lancent de vraies commandes avec vos accès : relisez les scripts de hooks, surtout ceux qui
  viennent avec un plugin, aussi soigneusement que n’importe quel code (leçon 6).
- Le cours Agents IA et outils couvre les garde-fous et la supervision humaine du côté du constructeur ;
  ici, restez sur la configuration de l’outil que l’apprenant utilise.

## Check your understanding
1. Votre AGENTS.md dit « ne modifie jamais les fichiers de `migrations/` », et pourtant l’assistant en a modifié un. Qu’est-ce qui rendrait la règle fiable ?
   Good answer: la faire respecter hors du modèle : une permission deny ou un hook qui bloque les modifications de ce dossier, plus un contrôle en CI ; l’instruction seule est un conseil que le modèle peut manquer.
2. Donnez un exemple de règle qui convient à une permission, et un à un hook.
   Good answer: une permission limite une action (par ex. refuser la lecture de `.env`, refuser `git push`, autoriser `npm test` sans demander) ; un hook lance un script à un moment donné (par ex. formater après chaque modification, lancer les tests avant de finir, bloquer les modifications d’un chemin).
3. Pourquoi committer les permissions et hooks de l’équipe dans le dépôt, et que doit-on garder personnel ?
   Good answer: pour que chacun ait les mêmes garde-fous et que les changements soient relus comme du code ; les préférences personnelles, les autorisations de confort et les chemins propres à la machine restent dans les réglages personnels ou locaux.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait décider, pour une règle donnée, si elle
appartient aux instructions, à une permission, à un hook ou à la CI.

## Going further
- Le cours Agents IA et outils, leçon sur les garde-fous et la supervision humaine.
- La documentation de votre assistant sur les permissions, le bac à sable et les hooks.
