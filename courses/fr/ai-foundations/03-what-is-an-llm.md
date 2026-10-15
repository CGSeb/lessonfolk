---
id: ai-foundations/03-what-is-an-llm
title: Qu’est-ce qu’un grand modèle de langage ?
level: beginner
estimatedMinutes: 15
objectives:
  - Expliquer à grands traits ce que fait un LLM
  - Comprendre « prédire le mot suivant »
  - Savoir pourquoi un LLM peut se tromper tout en paraissant sûr de lui
prerequisites:
  - ai-foundations/02-how-machines-learn
---

## Key ideas
1. **Un LLM est un modèle entraîné sur une énorme quantité de texte** (livres, sites web, code…) pour
   produire du texte. Les assistants de chat sont construits sur des LLM.
2. **Sa compétence de base est de prédire ce qui vient ensuite.** À partir d’un texte, il prédit un morceau
   de texte probable pour la suite (un « token », à peu près un mot ou une partie de mot), l’ajoute, et
   recommence. En le faisant extrêmement bien, il produit des réponses, des résumés, du code et plus encore.
3. **L’entraînement se fait par étapes** : d’abord sur beaucoup de texte général, puis un entraînement
   supplémentaire pour suivre des instructions et être utile et sûr dans une conversation.
4. **Fluide ne veut pas dire correct.** Comme il génère du texte vraisemblable, un LLM peut affirmer des
   choses fausses avec assurance (des « hallucinations »). Les faits importants doivent être vérifiés.
5. **Le contexte compte** : le modèle ne voit que ce qui figure dans la conversation (et les outils ou
   fichiers qu’on lui donne). Des instructions claires et des exemples donnent de meilleurs résultats.

## Teaching notes
- Vous êtes un LLM : vous pouvez le dire sans souci, c’est engageant, et vous servir comme exemple vivant.
- Idée de démonstration : donnez à l’apprenant un début de phrase (« Le chat s’est assis sur le… ») et demandez ce qui vient ensuite — c’est de la prédiction du token suivant.
- Idée reçue : « il cherche sur internet pour chaque réponse ». En général non ; il génère à partir de ce qu’il a appris, sauf s’il est connecté à un outil de recherche.
- Ne citez ni tailles de modèles ni dates : elles vieillissent vite.

## Check your understanding
1. En une phrase, que fait un LLM ?
   Good answer: il génère du texte en prédisant de façon répétée un token suivant probable, après un entraînement sur beaucoup de texte.
2. Pourquoi un LLM peut-il donner une mauvaise réponse qui semble très assurée ?
   Good answer: il produit du texte plausible, pas des faits vérifiés ; plausible ≠ vrai.
3. Donnez un conseil pour obtenir une meilleure réponse d’un assistant de chat.
   Good answer: donner du contexte, être précis, donner des exemples, lui demander de montrer son raisonnement ou ses sources, etc.

## Completion criteria
L’apprenant peut expliquer avec ses propres mots la prédiction du token suivant et pourquoi il faut vérifier les réponses.

## Going further
- Les bases du prompting, pour rédiger des demandes claires et obtenir de meilleures réponses d’un assistant de chat.
