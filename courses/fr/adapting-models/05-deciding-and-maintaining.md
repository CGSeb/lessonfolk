---
id: adapting-models/05-deciding-and-maintaining
title: "Est-ce que ça vaut le coup ? Décider et entretenir"
level: advanced
estimatedMinutes: 20
objectives:
  - Prouver le gain d’un modèle adapté face à la meilleure option moins coûteuse
  - Compter le coût complet de l’adaptation d’un modèle, au-delà de l’entraînement
  - Prévoir l’entretien dont un modèle adapté a besoin
  - Décider, chiffres à l’appui, quand ne pas adapter ou redescendre l’échelle
prerequisites:
  - adapting-models/04-distillation-and-smaller-models
---

## Key ideas
1. **Prouvez le gain face à la meilleure option moins coûteuse.** Comparez le modèle adapté avec
   la meilleure version du barreau inférieur (le prompt amélioré avec recherche documentaire, pas
   le premier brouillon), sur le même jeu de test mis à part, en jugeant sur chaque critère qui
   compte : qualité, sécurité, cas difficiles, coût et délai. Regardez ce qui s’est dégradé, pas
   seulement la moyenne, et traitez les petits écarts comme du bruit tant qu’ils ne se répètent
   pas (comparer des versions est vu dans *Évaluer les réponses de l’IA*).
2. **Comptez le coût complet.** L’entraînement lui-même est souvent la plus petite part. Ajoutez
   la collecte, le nettoyage et la vérification des données, le temps des personnes, les
   évaluations, l’hébergement (un modèle dédié peut coûter même quand il ne sert pas), et chaque
   réentraînement futur. Mettez cela en regard de l’économie par appel multipliée par le volume,
   et de la valeur de la qualité gagnée.
3. **Un modèle adapté s’entretient.** Il est lié à son modèle de base : quand le fournisseur retire
   cette base ou qu’une meilleure apparaît, vous réentraînez et retestez. Vos produits, vos
   politiques et vos clients changent, donc les données d’entraînement vieillissent. Gardez toute
   la recette reproductible : la version des données, les réglages d’entraînement, les résultats
   des tests et la décision.
4. **Revérifiez régulièrement les barreaux moins coûteux.** Les nouveaux modèles de base suivent
   de mieux en mieux les consignes. Un modèle qui avait besoin d’un fine-tuning l’an dernier peut
   être égalé aujourd’hui par un modèle plus récent avec un bon prompt, sans l’entretien.
   Relancez la mesure de référence quand de nouveaux modèles sortent, et soyez prêts à redescendre
   l’échelle.
5. **« Ça ne vaut pas le coup » est un résultat valable.** Si le gain est faible, instable ou payé
   par une perte ailleurs, la bonne décision est d’arrêter, et de noter les chiffres pour que la
   question ne soit pas rouverte de zéro dans six mois.

## Teaching notes
- Analogie qui fonctionne : **acheter une machine ou la louer**. La posséder peut revenir moins
  cher à l’usage, mais vous payez l’entretien, les réparations, le stockage et le jour où elle
  devient obsolète ; la location reste souple.
- Cas suivi : le modèle fine-tuné de l’équipe de support obtient en moyenne un score un peu plus
  élevé que le prompt amélioré, mais plus faible sur les cas d’escalade, et il demande un
  hébergement dédié. Demandez à l’apprenant s’il faut le mettre en service. Ensuite : un an plus
  tard, le fournisseur annonce le retrait du modèle de base, et un modèle plus récent avec l’ancien
  prompt égale le fine-tuning. Demandez ce que fait l’équipe.
- Idée reçue : « on y a passé des mois, donc il faut s’en servir ». Le coût déjà engagé n’est pas
  une raison ; ce sont les chiffres du jeu de test qui décident.
- Idée reçue : « une fois entraîné, c’est terminé ». Les données, les produits et les modèles de
  base bougent tous.
- Apprenants expérimentés : discutez de la façon de fixer une règle d’arrêt avant de commencer
  (par exemple un gain minimal sur les cas critiques à atteindre pour que le projet continue).
- Ne citez ni prix ni calendriers de retrait des fournisseurs.
- Cette leçon clôt le cours : reliez-la à l’échelle de la leçon 1 en une phrase.
- Rythme : le cas suivi en deux temps est le cœur de la leçon.

## Check your understanding
1. Le modèle fine-tuné obtient en moyenne un score un peu plus élevé que le prompt amélioré, mais plus faible sur les cas d’escalade. Le mettriez-vous en service ? Expliquez.
   Good answer: probablement pas en l’état : un petit gain moyen peut être du bruit, et une régression sur des cas importants comme les escalades peut l’emporter ; examiner et corriger d’abord les cas d’escalade, ou garder le prompt.
2. Nommez quatre coûts d’un modèle fine-tuné en plus de l’entraînement lui-même.
   Good answer: quatre parmi : collecte, nettoyage et vérification des données, temps des personnes, évaluations, hébergement y compris quand il ne sert pas, réentraînement quand le modèle de base ou les données changent, maintien d’une recette reproductible.
3. Le fournisseur annonce le retrait du modèle de base de votre fine-tuning. Que faites-vous ?
   Good answer: relancer d’abord la mesure de référence avec des modèles plus récents et le prompt actuel ; si un fine-tuning reste nécessaire, réentraîner sur la nouvelle base avec les données et les réglages versionnés, et retester qualité et sécurité avant de basculer.
4. Un an plus tard, un modèle plus récent avec un bon prompt égale votre modèle fine-tuné. Que doit faire l’équipe et pourquoi ?
   Good answer: envisager de redescendre l’échelle vers l’option à base de prompt, qui donne la même qualité sans les coûts d’entraînement, d’hébergement et d’entretien ; le confirmer sur tout le jeu de test, cas difficiles et sécurité compris, puis basculer et noter la décision.

## Completion criteria
L’apprenant répond correctement aux questions, compare avec la meilleure option moins coûteuse
sur tous les critères, compte le coût complet et l’entretien, et accepte de redescendre ou
d’arrêter quand les chiffres le disent (vérifications 1-4).

## Going further
- Sujets : le coût total de possession des modèles d’IA, le versionnement et le retrait des
  modèles, les mesures de référence en évaluation.
- Demandez au tuteur de « m’interroger » sur ce cours pour revoir l’échelle et les règles sur les
  données.
