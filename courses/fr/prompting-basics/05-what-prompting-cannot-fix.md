---
id: prompting-basics/05-what-prompting-cannot-fix
title: Ce que le prompting ne peut pas corriger
level: beginner
estimatedMinutes: 15
objectives:
  - Expliquer ce qu’un bon prompt peut et ne peut pas changer
  - Reconnaître les tâches où une réponse demande une vigilance supplémentaire
  - Repérer les mythes des « phrases magiques »
prerequisites:
  - prompting-basics/04-common-prompt-mistakes
---

## Key ideas
1. **Le prompting façonne la réponse ; il ne change pas le modèle.** Un bon prompt aide l’assistant à
   utiliser ce qu’il a déjà appris, sous la forme dont vous avez besoin. Il ne peut pas ajouter des
   connaissances que le modèle n’a jamais eues.
2. **Il ne peut pas connaître ce qu’on ne lui a pas donné.** Des événements récents postérieurs à son
   entraînement, vos fichiers privés, les règles internes de votre entreprise : à moins que vous ne les
   colliez, ou que l’outil soit connecté à la recherche ou à vos documents, l’assistant ne les a pas,
   quelle que soit la qualité de votre demande.
3. **Un excellent prompt peut quand même donner une mauvaise réponse.** Le modèle génère du texte
   vraisemblable, il peut donc se tromper avec assurance (une « hallucination », vue dans Les bases de
   l’IA). Pour tout ce qui compte — santé, argent, droit, faits que vous allez répéter — vérifiez la réponse
   auprès d’une source fiable.
4. **Certaines tâches conviennent mal sans outil.** Le comptage exact (lettres, mots), les calculs précis
   ou les longues listes de faits exacts peuvent mal tourner, car le modèle prédit du texte au lieu de
   calculer. Les assistants capables d’utiliser une calculatrice ou du code s’en sortent mieux ; sinon,
   revérifiez.
5. **Il n’y a pas de phrases magiques.** Les listes de « prompts secrets » ou d’« une phrase qui débloque le
   mode génie » promettent plus qu’elles ne tiennent. Ce qui marche, c’est ce que ce cours a enseigné :
   un contexte, un objectif et un public clairs, des exemples, un format et de bonnes relances.

## Teaching notes
- Analogie qui fonctionne : **une excellente question posée à un ami très cultivé**. La poser clairement
  vous vaut sa meilleure réponse, mais cela ne peut pas lui faire connaître les nouvelles d’hier ou un
  livre qu’il n’a jamais lu, et il peut quand même se tromper de mémoire.
- Vous êtes un LLM : soyez honnête sur vos propres limites ici, avec un exemple concret (vous ne
  connaissez peut-être pas des événements très récents ; vous pouvez faire des erreurs). Évitez d’indiquer
  votre date d’arrêt d’entraînement ou de comparer des modèles — cela vieillit vite.
- Gardez la vérification des réponses brève (idée 3). Dites que le cours Utiliser l’IA en toute sécurité
  et avec discernement explique comment vérifier les réponses ; n’enseignez pas ici les techniques de vérification.
- Idée reçue : « si la réponse est fausse, mon prompt était mauvais ». Parfois, mais pas toujours — la
  limite peut venir des connaissances ou de la fiabilité du modèle, pas de la formulation.
- Idée reçue : « dire à l’IA “ne fais pas d’erreurs” ou “sois exacte à 100 %” empêche les erreurs ». Cela
  peut sonner plus prudent, mais ne lui fait pas savoir plus de choses.
- Terminez le cours sur une note positive : le prompting est une vraie compétence du quotidien, et en
  connaître les limites fait partie de bien l’utiliser.

## Check your understanding
1. Quelqu’un écrit un prompt très détaillé pour demander les résultats de football locaux d’hier et reçoit une réponse assurée. Doit-il lui faire confiance ? Pourquoi ?
   Good answer: pas sans vérifier ; sauf si l’assistant a utilisé un outil de recherche, il ne connaît pas les événements récents, et un bon prompt ne peut pas ajouter cette connaissance — il a pu produire des résultats plausibles mais inventés.
2. Ajouter « sois exact à 100 % » à un prompt rend-il la réponse fiable ? Expliquez.
   Good answer: non ; cela peut changer le ton mais pas ce que le modèle sait ni la façon dont il génère le texte, donc il peut quand même se tromper et les réponses importantes demandent toujours une vérification.
3. Donnez un type de tâche où il faut revérifier la réponse d’un assistant, et pourquoi.
   Good answer: par ex. le comptage exact ou les calculs (il prédit du texte au lieu de calculer, sauf s’il utilise un outil), ou les questions de santé, d’argent ou de droit (enjeux élevés, il peut se tromper avec assurance).

## Completion criteria
L’apprenant répond correctement aux vérifications et sait expliquer, avec ses propres mots, la différence
entre ce qu’un meilleur prompt peut améliorer et ce qu’il ne peut pas.

## Going further
- Utiliser l’IA en toute sécurité et avec discernement : hallucinations, vérification des réponses, vie privée, biais et usage honnête.
- Comment fonctionnent les applications d’IA : les prompts système et l’usage des modèles par le code vont au-delà du prompting en chat.
