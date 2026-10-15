---
id: build-with-ai/02-system-prompts
title: Les prompts système et le comportement
level: intermediate
estimatedMinutes: 15
objectives:
  - Utiliser un prompt système pour fixer le rôle, les règles et le ton d’un modèle dans une application
  - Rédiger un prompt système et prévoir comment le tester
  - Savoir pourquoi un prompt système n’est pas une barrière de sécurité
prerequisites:
  - build-with-ai/01-how-an-api-call-works
---

## Key ideas
1. **Un prompt système est une instruction permanente pour toute la conversation.** C’est le premier
   message, avec le rôle `system`. Vos utilisateurs ne le voient pas, mais il façonne chaque réponse : qui
   est l’assistant, ce qu’il fait, comment il parle.
2. **C’est la personnalité et les règles de votre application.** Un bon prompt système énonce le rôle
   (« Tu es un assistant de cuisine pour débutants »), la tâche, le ton, le format des réponses et que faire
   dans les cas limites (« Si on te demande autre chose que la cuisine, dis que tu ne peux aider qu’en cuisine »).
3. **Tout ce qu’enseignent Les bases du prompting s’applique, écrit une seule fois.** Contexte, public,
   exemples et format de sortie vont désormais dans le prompt système, si bien que chaque utilisateur les
   obtient sans avoir à les saisir. Des règles courtes et claires marchent mieux que de longues listes de
   « jamais » et de « toujours ».
4. **Testez-le comme du code.** Essayez des questions typiques, floues, hors sujet et des tentatives de
   contourner les règles. Changez une chose à la fois et relancez les mêmes questions de test pour voir
   l’effet.
5. **Ce n’est pas un mur de sécurité.** Les utilisateurs peuvent parfois convaincre un modèle d’ignorer ses
   instructions ou de les révéler (« injection de prompt »). Ne mettez pas de secrets dans un prompt
   système, et faites respecter les règles importantes dans votre code, pas seulement dans le prompt.

## Teaching notes
- Faites le lien avec la leçon 2 de Les bases du prompting (donner un rôle) : le prompt système est la même
  idée, définie par le développeur au lieu d’être saisie par l’utilisateur.
- Analogie qui fonctionne : **briefer un nouvel employé le premier jour**. Le briefing fixe la façon dont
  il accueille les clients et ce qu’il a le droit de faire ; les clients ne le lisent jamais, mais ils le
  ressentent. Et un client déterminé peut parfois convaincre un employé de plier une règle.
- Démo en direct : vous pouvez montrer l’effet dans ce chat en jouant deux prompts système pour la même
  question d’utilisateur, puis demander à l’apprenant d’écrire le sien.
- Idée reçue : « le prompt système garantit le comportement ». Il l’influence fortement ; il ne le garantit
  pas (idée 5). Les modèles diffèrent aussi dans la fidélité avec laquelle ils le suivent.
- Idée reçue : « un prompt système plus long est meilleur ». Des instructions contradictoires ou gonflées
  rendent le comportement moins prévisible.
- Avec des apprenants ayant une formation en sécurité, approfondissez un peu l’injection de prompt : tout
  texte que le modèle lit (saisie de l’utilisateur, documents, pages web) peut contenir des instructions.

## Check your understanding
1. Qu’est-ce qu’un prompt système et en quoi diffère-t-il d’un message utilisateur ?
   Good answer: une instruction permanente avec le rôle system, définie par le développeur au départ, qui façonne toutes les réponses ; les utilisateurs ne la voient pas, alors que les messages utilisateur sont leurs demandes individuelles.
2. Écrivez un court prompt système pour un assistant de recettes qui ne parle que de cuisine.
   Good answer: énonce un rôle, la tâche, un ton ou un format, et que faire des demandes hors sujet.
3. Pourquoi ne faut-il pas mettre une clé d’API ou un code promo secret dans un prompt système ?
   Good answer: les utilisateurs peuvent parfois amener le modèle à révéler ou ignorer ses instructions (injection de prompt), donc le prompt système n’est pas un endroit sûr pour les secrets ; les règles se font respecter dans le code.

## Completion criteria
L’apprenant répond correctement aux vérifications, a rédigé un prompt système et dit comment il le testerait
avec au moins un message hors sujet ou qui enfreint les règles.

## Going further
- Sujet : l’injection de prompt et la façon dont les applications s’en défendent.
- Leçon suivante : obtenir une sortie structurée que votre code peut utiliser.
