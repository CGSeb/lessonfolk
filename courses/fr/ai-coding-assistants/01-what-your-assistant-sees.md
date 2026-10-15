---
id: ai-coding-assistants/01-what-your-assistant-sees
title: Ce que voit votre assistant de code
level: intermediate
estimatedMinutes: 20
objectives:
  - Décrire les principaux types d’assistants de code IA
  - Expliquer ce qui entre dans le contexte de l’assistant et ce qui n’y entre jamais
  - Donner à un assistant le contexte dont il a besoin pour une tâche de code
prerequisites:
  - prompting-basics/05-what-prompting-cannot-fix
  - ai-safety/05-copyright-and-honest-use
---

## Key ideas
1. **Les assistants de code existent sous quelques formes.** La **complétion en ligne** suggère les lignes
   suivantes pendant que vous tapez. Le **chat dans l’éditeur** répond aux questions et propose des
   modifications du code que vous lui désignez. Les **assistants de type agent** peuvent lire des fichiers,
   chercher dans le projet, lancer des commandes (tests, builds) et modifier plusieurs fichiers seuls, en
   boucle, jusqu’à ce qu’ils estiment la tâche terminée. Tous reposent sur un grand modèle de langage, le
   type de modèle derrière les assistants de chat (vu dans Les bases de l’IA).
2. **Le modèle ne voit que son contexte.** Tout ce qu’il sait de votre tâche vient de ce que l’outil envoie
   avec votre demande : votre message, le fichier ou la sélection en cours, les fichiers que l’outil a
   choisis ou que vous avez joints, la sortie des commandes qu’il a lancées et d’éventuelles instructions
   de projet. Tout le reste n’existe tout simplement pas pour lui, même si c’est évident pour vous.
3. **Ce qu’il ne voit jamais, sauf si vous le dites.** Vos intentions et le « pourquoi » de la
   fonctionnalité, les décisions prises en réunion, le comportement de l’application en production, les
   vraies données des utilisateurs, le rapport de bug lu ce matin et les parties du code que l’outil n’a
   pas ouvertes. Quand un assistant « ignore » une convention évidente, c’est en général qu’il ne l’a
   jamais vue.
4. **Le contexte a des limites.** Le modèle ne peut absorber qu’une quantité limitée de texte à la fois
   (sa **fenêtre de contexte**), et les contextes très longs le rendent moins précis. Les outils de type
   agent choisissent les fichiers à lire ; ils peuvent manquer celui qui compte. Plus de contexte n’est pas
   toujours mieux : les bons fichiers valent mieux que tout le dépôt.
5. **Donnez-lui ce dont un nouveau coéquipier aurait besoin.** L’objectif, les fichiers concernés, les
   contraintes (framework et version, style, ce qui ne doit pas changer), un exemple de code similaire
   dans le projet et comment savoir que la tâche est terminée. C’est Les bases du prompting appliqué au code.

## Teaching notes
- Analogie qui fonctionne : **un prestataire compétent parachuté sur votre projet pour une seule tâche**.
  Il code bien, mais il n’a pas assisté à vos réunions, ne connaît pas vos utilisateurs et ne lit que les
  fichiers que vous lui remettez ou qu’il pense à ouvrir. Un bon brief change tout.
- Idée reçue : « l’assistant connaît tout mon projet ». La plupart des outils n’en voient qu’une partie à
  la fois ; certains indexent le projet pour la recherche, mais le modèle travaille quand même à partir des
  morceaux qui se retrouvent dans son contexte pour cette demande.
- Idée reçue : « il connaît la dernière version de mon framework ». Il a appris à partir de code jusqu’à sa
  date d’entraînement et peut utiliser par défaut d’anciens motifs, sauf si les fichiers du projet ou votre
  message montrent la version que vous utilisez.
- Mentionnez en une ligne que beaucoup d’outils lisent automatiquement un fichier d’instructions de projet
  (conventions d’équipe, commandes à lancer). Ne l’enseignez pas ici : le cours Assistants de code IA pour
  les équipes : règles, skills et plugins le couvre.
- Restez indépendant des outils : ne classez jamais les outils ni ne désignez « le meilleur ». Si
  l’apprenant utilise un outil précis, servez-vous-en comme exemple, et laissez-le consulter sa
  documentation pour savoir ce qu’il inclut dans le contexte.
- Pour les apprenants qui n’ont utilisé que la complétion en ligne, passez plus de temps sur l’idée 1 et
  sur ce que les outils de type agent peuvent faire (et donc rater). Pour ceux qui utilisent déjà des
  agents, allez plus vite sur l’idée 1 et creusez l’idée 4 (comment leur outil choisit les fichiers).
- La boucle de l’agent elle-même est enseignée dans le cours Agents IA et outils ; nommez seulement l’idée ici.

## Check your understanding
1. Votre assistant écrit une nouvelle route d’API qui ignore le schéma de gestion d’erreurs utilisé partout ailleurs dans votre projet. Quelle en est la raison la plus probable ?
   Good answer: les fichiers montrant ce schéma n’étaient pas dans son contexte (il ne les a jamais vus), il est donc retombé sur du code générique ; la solution est de lui indiquer un exemple existant ou de décrire le schéma.
2. Citez trois choses qu’un assistant de code ne peut pas savoir si vous ne les lui dites pas.
   Good answer: trois éléments parmi l’objectif ou la raison du changement, les décisions d’équipe, le comportement en production ou les vraies données, le rapport de bug, des contraintes comme ce qui ne doit pas changer, les fichiers qu’il n’a pas ouverts, la version du framework si elle n’est pas visible.
3. Pourquoi « ajouter tout le dépôt au contexte » n’est-il pas toujours une bonne idée ?
   Good answer: la fenêtre de contexte est limitée et les longs contextes rendent le modèle moins précis ; les bons fichiers pertinents fonctionnent mieux que tout.
4. Que peut faire un assistant de type agent que la complétion en ligne ne peut pas faire ?
   Good answer: lire et chercher dans des fichiers, lancer des commandes comme les tests et modifier plusieurs fichiers en boucle jusqu’à estimer la tâche terminée ; la complétion en ligne ne fait que suggérer les lignes suivantes pendant la frappe.

## Completion criteria
L’apprenant sait expliquer ce qui entre dans le contexte d’un assistant et ce qui n’y entre pas, répond
correctement aux vérifications et peut lister ce que contient un bon brief pour une tâche de code.

## Going further
- Le cours Agents IA et outils, pour voir comment les assistants de type agent exécutent leur boucle de
  lecture, d’action et de vérification.
- Assistants de code IA pour les équipes : règles, skills et plugins, pour les fichiers d’instructions de
  projet et les conventions d’équipe que votre assistant lit automatiquement.
- La documentation de votre assistant sur la façon dont il choisit les fichiers à inclure.
