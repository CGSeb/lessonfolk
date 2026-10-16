---
id: how-ai-models-work/04-post-training
title: "Le post-entraînement : du prédicteur de texte à l’assistant"
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer comment un modèle de base devient un assistant utile
  - Décrire avec des mots simples l’apprentissage à partir de retours humains
  - Nommer des effets secondaires de cet entraînement, comme la flatterie et les refus excessifs
prerequisites:
  - how-ai-models-work/03-pre-training
---

## Key ideas
1. **Un modèle de base n’est pas encore un bon assistant.** Il prolonge du texte. Pour le
   rendre utile, il reçoit un entraînement supplémentaire, le *post-entraînement*, sur une
   quantité de matière bien plus petite et soigneusement choisie.
2. **Première étape : apprendre à partir d’exemples de bonnes conversations.** Des personnes
   écrivent (ou choisissent) de nombreuses demandes avec des réponses idéales, et le modèle est
   entraîné à les imiter. C’est ainsi qu’il apprend la forme d’une conversation : répondre à la
   question, suivre les consignes, rester dans le sujet.
3. **Seconde étape : apprendre à partir de préférences.** Le modèle produit plusieurs réponses
   à la même demande, des personnes (ou d’autres systèmes d’IA guidés par des principes écrits)
   disent laquelle elles préfèrent, et le modèle est ajusté pour produire davantage de réponses
   comme celles qui ont été préférées. Avec des juges humains, on parle d’*apprentissage par
   renforcement à partir de retours humains* (RLHF). Il est plus facile de dire « cette réponse
   est meilleure » que d’écrire la réponse parfaite.
4. **Le comportement de sécurité s’entraîne de la même façon.** Refuser les demandes clairement
   nuisibles, reconnaître son incertitude, garder un ton cohérent : tout cela s’enseigne par des
   exemples et des préférences, ce qui explique que les assistants de fournisseurs différents
   n’aient pas la même personnalité.
5. **Cet entraînement a des effets secondaires.** Si les juges préfèrent en général les réponses
   agréables, assurées et bien présentées, les modèles dérivent vers la flatterie (vous donner
   raison même quand vous avez tort), les réponses longues et le ton sûr de soi. Ils peuvent
   aussi refuser des demandes inoffensives qui ressemblent à des demandes risquées.
6. **Le post-entraînement n’est pas les consignes que vous donnez.** Un prompt système ou vos
   propres messages orientent le comportement au moment de l’usage ; le post-entraînement a
   modifié le modèle lui-même, en amont. Vous pouvez l’orienter dans le cadre de ses habitudes,
   pas les supprimer.

## Teaching notes
- Analogie : le pré-entraînement, c’est l’école (tout lire) ; le post-entraînement, c’est
  l’intégration en poste (comment se comporter avec les clients). Mêmes connaissances,
  comportement très différent.
- Démonstration : demandez à l’apprenant ce qu’un modèle de base pourrait répondre à « Quelle
  est la capitale de la France ? » (il pourrait ajouter d’autres questions de quiz). Montrez
  ensuite comment répond un assistant.
- Idée reçue : « le RLHF apprend des faits au modèle ». Il façonne surtout le style, l’utilité
  et les limites ; les faits viennent du pré-entraînement.
- Idée reçue : « l’IA est d’accord avec moi, j’ai donc raison ». La flatterie est un effet
  secondaire connu ; dites à l’apprenant de demander des contre-arguments ou de faire défendre
  le point de vue opposé.
- Ne dites pas quel fournisseur utilise quelle méthode, ni aucune date.
- Débutants : restez à « des exemples, puis des votes sur la meilleure réponse ». Les
  apprenants expérimentés peuvent évoquer en une phrase le détournement de la récompense (le
  modèle apprend ce qui obtient un bon score, ce qui n’est pas toujours le meilleur).
- Rythme : la flatterie (idée 5) est le point le plus utile en pratique, gardez-lui du temps.

## Check your understanding
1. Pourquoi le même modèle de base donne-t-il une impression très différente une fois
   post-entraîné ?
   Good answer: il a été entraîné sur des conversations d’exemple et sur des préférences, donc
   il répond et suit les consignes au lieu de simplement prolonger le texte.
2. Avec vos mots, comment fonctionne l’apprentissage à partir de retours humains ?
   Good answer: le modèle donne plusieurs réponses, des personnes (ou une IA guidée) choisissent
   les meilleures, et le modèle est ajusté pour produire davantage de réponses comme celles-là.
3. Vous partagez un business plan faible et l’assistant le trouve excellent. Donnez une cause
   probable et ce que vous feriez pour obtenir un avis plus juste.
   Good answer: l’entraînement vers des réponses agréables (flatterie) ; lui demander de chercher
   les faiblesses, de jouer un rôle critique ou de défendre le point de vue opposé ; ne pas
   prendre les compliments pour une preuve.

## Completion criteria
L’apprenant peut décrire simplement les deux étapes du post-entraînement, et expliquer la
flatterie ou les refus excessifs comme un effet secondaire de l’entraînement sur des préférences
(vérifications 1-3).

## Going further
- *Utiliser l’IA en toute sécurité et avec discernement* traite des biais et de la vérification
  des réponses.
- La leçon « Rôle, exemples et format de sortie » de *Les bases du prompting* montre comment
  orienter le modèle dans le cadre de ses habitudes.
