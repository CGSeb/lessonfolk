---
id: adapting-models/01-the-adaptation-ladder
title: L’échelle de l’adaptation
level: advanced
estimatedMinutes: 20
objectives:
  - Distinguer un manque de connaissances, un problème de comportement et un problème de coût
  - Ordonner les façons d’adapter un modèle, de la moins coûteuse et la plus réversible à la plus coûteuse
  - Expliquer pourquoi les connaissances ont généralement leur place dans la recherche documentaire plutôt que dans les poids du modèle
  - Expliquer pourquoi toute adaptation commence par un jeu de test et une mesure de référence
prerequisites: []
---

## Key ideas
1. **Nommez le problème avant de choisir le remède.** « Le modèle n’est pas assez bon » cache trois
   problèmes différents. Un manque de *connaissances* : il ne connaît pas vos produits, vos règles
   ou l’actualité récente. Un problème de *comportement* : il en sait assez, mais ne répond pas
   comme il faut (format, ton, procédure précise, régularité sur des milliers de cas). Un problème
   de *coût* : les réponses sont bonnes, mais trop lentes ou trop chères pour votre volume. Chacun
   a un remède différent, et les confondre est la raison la plus fréquente des projets
   d’adaptation décevants.
2. **L’échelle : ne montez que si nécessaire.** De la plus économique et réversible à la plus
   coûteuse : (a) **le prompt** : des consignes claires, quelques bons exemples, un format de
   sortie imposé ; (b) **la recherche documentaire et les outils** : donner les faits au modèle
   au moment où il répond (le RAG, vu dans *Le RAG en profondeur*) ; (c) **le fine-tuning** :
   poursuivre l’entraînement du modèle sur vos propres exemples pour changer son comportement ;
   (d) **la distillation** : entraîner un modèle plus petit à reproduire les réponses d’un plus
   grand sur votre tâche, pour réduire le coût et le délai. Chaque barreau coûte plus de temps, de
   données et d’argent, et se défait moins facilement : un changement de prompt s’annule en une
   minute, un modèle entraîné devient quelque chose que vous possédez et entretenez.
3. **Les connaissances vont dans la recherche, pas dans les poids.** Des faits fournis au moment
   de répondre sont faciles à mettre à jour, peuvent être cités, et peuvent être filtrés selon ce
   que chaque utilisateur a le droit de voir. Des faits appris par entraînement n’ont aucune de
   ces qualités : on ne peut ni les retirer ni les corriger sans réentraîner, et la recherche
   suggère que le fine-tuning sur des faits que le modèle ne connaissait pas est appris lentement
   et peut le pousser à inventer davantage. Le fine-tuning brille sur le comportement ; la
   recherche documentaire brille sur les connaissances.
4. **Pas de montée sans jeu de test ni mesure de référence.** Avant de changer quoi que ce soit,
   rassemblez des exemples réels avec ce à quoi ressemble une bonne réponse, et notez l’option la
   moins coûteuse sur ces exemples (construire et noter un tel jeu est vu dans *Évaluer les
   réponses de l’IA*). Sans cette référence, impossible de savoir si un barreau a aidé, ni de
   remarquer qu’il a dégradé autre chose. Beaucoup de projets « il faut fine-tuner » s’arrêtent au
   barreau (a) dès que quelqu’un écrit de meilleurs exemples et mesure.
5. **Les barreaux se combinent.** Ce ne sont pas des alternatives : un modèle fine-tuné peut
   toujours lire des documents récupérés, un modèle distillé reçoit encore un court prompt. Une
   forme courante : la recherche pour les faits, un prompt pour les règles du moment et, seulement
   si nécessaire, un fine-tuning pour un comportement que le prompt n’a pas rendu fiable.

## Teaching notes
- Utilisez un exemple suivi dans tout le cours : **une équipe de support d’un éditeur de
  logiciel** qui veut un assistant pour rédiger des brouillons de réponses aux tickets clients,
  dans le style maison, à partir de la documentation produit, pour des dizaines de milliers de
  tickets par mois. Elle a les trois types de problème, ce qui en fait un bon cas pour chaque
  leçon.
- Analogie qui fonctionne : **une nouvelle recrue**. S’il lui manque des faits, vous lui donnez le
  manuel (elle peut y chercher, et vous le mettez à jour quand les choses changent). Si elle fait
  le travail de travers, vous la formez. Si elle coûte trop cher pour les tâches routinières, un
  junior formé par elle reprend la partie routinière. Vous n’enverriez pas quelqu’un en formation
  pour apprendre une liste de prix par cœur.
- Déroulez l’idée 1 avec l’équipe de support : « les réponses citent les tarifs de l’an dernier »
  (connaissances), « les réponses font trois paragraphes quand l’équipe en veut trois lignes »
  (comportement, et sans doute d’abord une correction du prompt), « cela coûte trop cher par
  ticket » (coût). Laissez l’apprenant les classer.
- Idée reçue : « le fine-tuning apprend nos documents au modèle ». Il change surtout la façon dont
  le modèle répond ; pour ce qu’il sait, la recherche documentaire est moins chère, plus à jour et
  traçable.
- Idée reçue : « le fine-tuning, c’est l’option des pros, le prompt, celle des amateurs ». Les
  équipes qui adaptent bien les modèles épuisent généralement le prompt et la recherche d’abord,
  et gardent les mesures qui le prouvent.
- Les apprenants expérimentés évoqueront peut-être les méthodes économes en paramètres ou les très
  grandes fenêtres de contexte : ces éléments changent les coûts, pas le raisonnement de
  l’échelle. La leçon 2 couvre les méthodes.
- Évitez les prix, les noms de modèles et les affirmations sur quel fournisseur propose quel type
  d’entraînement : cela change vite.
- Rythme : l’idée 1 et son exercice de classement, puis l’idée 4, sont ce que les apprenants
  utiliseront le plus.

## Check your understanding
1. Classez ces plaintes en manque de connaissances, problème de comportement ou problème de coût : « il se trompe sur notre politique de remboursement », « il répond en longs paragraphes au lieu de notre format en trois lignes », « il est trop lent pour le chat en direct ».
   Good answer: la politique de remboursement erronée est un manque de connaissances ; les longs paragraphes au lieu du format maison sont un problème de comportement ; trop lent pour le chat en direct est un problème de coût ou de latence.
2. Pourquoi les barreaux de l’échelle vont-ils du prompt à la distillation, et qu’est-ce qui change quand on monte ?
   Good answer: ils vont du moins cher, du plus rapide et du plus facile à annuler au plus coûteux et au plus difficile à défaire ; monter coûte plus de temps, de données et d’argent et laisse un modèle à posséder et entretenir, donc on ne monte que jusqu’où le problème l’exige.
3. Un responsable veut fine-tuner un modèle sur le catalogue produits de l’entreprise, qui change chaque semaine. Que recommanderiez-vous et pourquoi ?
   Good answer: mettre le catalogue dans la recherche documentaire plutôt que l’apprendre au modèle : les faits récupérés peuvent être mis à jour, cités et filtrés par utilisateur, alors que les faits appris vieillissent, ne se corrigent pas sans réentraînement et sont appris de façon peu fiable ; garder le fine-tuning pour le comportement s’il reste un problème.
4. Une équipe dit que le prompt « ne marche pas » et veut fine-tuner. Que demandez-vous d’abord ?
   Good answer: un jeu de test d’exemples réels avec ce à quoi ressemble une bonne réponse, et le score du prompt dessus comme référence ; puis si de meilleures consignes et de meilleurs exemples ont été essayés, car sans référence personne ne peut montrer que le fine-tuning a aidé.

## Completion criteria
L’apprenant répond correctement aux questions, classe des problèmes en connaissances,
comportement et coût, place chacun sur l’échelle, et exige un jeu de test et une référence
avant de monter (vérifications 1-4).

## Going further
- Sujets : le prompting few-shot, la génération augmentée par la recherche (RAG), les mesures de
  référence en évaluation.
- Leçon suivante : ce que le fine-tuning change réellement dans un modèle, et ce qu’il ne change pas.
