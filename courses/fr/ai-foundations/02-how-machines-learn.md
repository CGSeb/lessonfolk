---
id: ai-foundations/02-how-machines-learn
title: Comment les machines apprennent-elles ?
level: beginner
estimatedMinutes: 15
objectives:
  - Décrire l’apprentissage automatique comme un apprentissage à partir d’exemples
  - Expliquer les données d’entraînement, le modèle et la prédiction
  - Comprendre pourquoi la qualité des données compte
prerequisites:
  - ai-foundations/01-what-is-ai
---

## Key ideas
1. **Apprentissage automatique = apprendre à partir d’exemples.** Au lieu d’écrire des règles, on montre
   à l’ordinateur de nombreux exemples (des photos étiquetées « chat » ou « chien ») et il s’ajuste
   jusqu’à se tromper rarement.
2. **Trois mots à connaître** : les *données d’entraînement* (les exemples), le *modèle* (le résultat de
   l’entraînement — un grand ensemble de nombres ajustés), la *prédiction* (la réponse du modèle sur une
   nouvelle entrée).
3. **L’entraînement, c’est de l’essai-erreur à grande échelle** : le modèle devine, mesure à quel point il
   s’est trompé, ajuste un peu ses nombres pour se tromper un peu moins, et recommence — des millions de fois.
4. **Garbage in, garbage out** (des déchets en entrée, des déchets en sortie) : un modèle apprend toutes les
   régularités de ses données, y compris les erreurs et les biais. Si les exemples sont déséquilibrés ou
   faux, le modèle le sera aussi.
5. **Apprendre ≠ mémoriser** : le but est de bien réussir sur de *nouveaux* exemples qu’il n’a jamais vus.

## Teaching notes
- Analogie qui fonctionne bien : un enfant qui apprend à reconnaître les chiens à partir de nombreux exemples, sans que personne ne définisse « chien ».
- Demandez à l’apprenant d’imaginer qu’il apprend à un ordinateur à reconnaître des bananes mûres : quels exemples rassemblerait-il ?
- Exemple de biais à utiliser : un modèle de recrutement entraîné sur des décisions passées reproduit les injustices passées.
- Évitez les maths. « Ajuster des nombres » suffit à ce niveau ; ne parlez de « paramètres » que si l’apprenant est curieux.

## Check your understanding
1. Que sont les données d’entraînement ?
   Good answer: les exemples à partir desquels un modèle apprend.
2. Un modèle a été entraîné uniquement sur des photos de chiens prises dans des parcs ensoleillés. Qu’est-ce qui pourrait mal se passer ?
   Good answer: il peut échouer dans d’autres conditions (nuit, intérieur, neige) — les données ne les représentaient pas.
3. Pourquoi mémoriser les exemples d’entraînement ne suffit-il pas ?
   Good answer: le modèle doit fonctionner sur de nouveaux exemples qu’il n’a jamais vus.
4. Quelle est la différence entre un modèle et une prédiction ?
   Good answer: le modèle est le résultat de l’entraînement (les nombres ajustés) ; une prédiction est la réponse que le modèle donne sur une nouvelle entrée.

## Completion criteria
L’apprenant explique correctement ce que sont les données d’entraînement et une prédiction, et donne une réponse sensée à la question 2.
