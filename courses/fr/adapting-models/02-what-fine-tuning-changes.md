---
id: adapting-models/02-what-fine-tuning-changes
title: Ce que le fine-tuning change vraiment
level: advanced
estimatedMinutes: 20
objectives:
  - Expliquer ce que le fine-tuning supervisé fait à un modèle
  - Juger à quels problèmes le fine-tuning convient et à quels problèmes il ne convient pas
  - Nommer les effets secondaires à tester après un fine-tuning, dont l’affaiblissement du comportement de sécurité
  - Distinguer fine-tuning complet, adaptateurs et réglage par préférences
prerequisites:
  - adapting-models/01-the-adaptation-ladder
---

## Key ideas
1. **Le fine-tuning poursuit l’entraînement sur vos exemples.** Vous fournissez des paires d’une
   entrée et de la sortie idéale, et les nombres du modèle sont ajustés pour qu’il produise des
   sorties qui ressemblent davantage aux vôtres. C’est le même mécanisme que la première étape du
   post-entraînement (vue dans *Comment fonctionnent vraiment les modèles d’IA*), appliqué à votre
   tâche précise. Le résultat est une nouvelle version du modèle, que vous appelez à la place de
   l’original.
2. **Il est bon pour le comportement.** Un format, un ton ou un style réguliers sur de nombreux
   cas ; une tâche précise faite toujours de la même façon (trier, extraire des champs, suivre une
   procédure maison) ; un comportement qu’il faudrait des pages de consignes pour décrire ; et des
   prompts plus courts, puisque les consignes et les exemples sont désormais intégrés, ce qui
   économise du coût et du temps à chaque appel.
3. **Il est mauvais pour les connaissances et a des effets secondaires.** Les faits appris par
   entraînement le sont de façon peu fiable et vieillissent (leçon 1). Un modèle très spécialisé
   sur une tâche peut se dégrader sur d’autres qu’il faisait bien, un problème appelé *oubli
   catastrophique*. Et le fine-tuning peut affaiblir le comportement de sécurité entraîné par le
   fournisseur : la recherche a montré qu’entraîner sur des jeux de données ordinaires et
   inoffensifs peut rendre un modèle un peu plus enclin à répondre à des demandes nuisibles, et
   qu’une poignée d’exemples nuisibles peut défaire une grande partie de ce comportement. Après tout
   fine-tuning, relancez vos tests de sécurité et vos tests généraux, pas seulement le test de la
   tâche.
4. **Fine-tuning complet ou petit module ajouté.** Le fine-tuning *complet* ajuste tous les
   nombres du modèle : coûteux et lourd à stocker. Les méthodes *économes en paramètres*, comme les
   adaptateurs de rang faible (LoRA), figent le modèle et entraînent un petit ensemble de nombres
   supplémentaires par-dessus ; elles sont bien moins chères, peuvent être interchangées par tâche
   sur le même modèle de base, et égalent souvent le fine-tuning complet en qualité. Avec un modèle
   fermé, c’est le service du fournisseur qui fait l’entraînement, et vous obtenez un modèle que
   vous pouvez appeler, pas télécharger.
5. **Le réglage par préférences, quand juger est plus facile qu’écrire.** Pour certaines
   qualités (un ton serviable, la bonne longueur, refuser seulement ce qui doit l’être), il est plus
   facile de dire laquelle de deux réponses est meilleure que d’écrire la réponse parfaite. Le
   réglage par préférences s’entraîne sur de telles paires, comme la seconde étape du
   post-entraînement. Le modèle apprend tout ce que les préférences récompensent, y compris leurs
   biais, et peut apprendre à plaire au juge plutôt qu’à avoir raison : le jeu de test compte
   encore plus.

## Teaching notes
- Analogie qui fonctionne : **coacher un professionnel compétent**. Le coaching change bien plus
  facilement sa façon de travailler (style, habitudes, procédure) qu’il ne lui apporte de nouveaux
  faits fiables ; trop de coaching sur une tâche, et il peut se rouiller sur d’autres.
- Cas suivi : l’équipe de support. Son prompt respecte le format maison en trois lignes environ
  quatre fois sur cinq, et le ton des brouillons dérive parfois. C’est un problème de comportement
  auquel le fine-tuning peut convenir, une fois un meilleur prompt essayé et mesuré. Les faits sur
  les produits restent dans la recherche documentaire.
- Pour l’idée 3, gardez le point sur la sécurité concret et calme : c’est un effet connu, pas une
  raison de ne jamais fine-tuner ; la réponse est de tester la sécurité après l’entraînement, pas
  de supposer qu’elle a survécu.
- Idée reçue : « le fine-tuning rend le modèle plus intelligent ». Il le rend plus spécialisé ;
  la capacité générale n’augmente pas et peut baisser.
- Idée reçue : « les adaptateurs sont une imitation au rabais ». Pour beaucoup de tâches
  précises, c’est le choix normal ; la qualité doit être mesurée dans tous les cas.
- Les apprenants expérimentés demanderont peut-être des méthodes de préférences précises : des
  méthodes qui apprennent directement à partir de paires de préférences, sans modèle de
  récompense séparé, existent et sont très utilisées. Nommez l’idée, pas un classement des
  méthodes.
- Ne citez ni coûts, ni tailles minimales de jeux de données, ni quels fournisseurs proposent
  quel type d’entraînement.
- Rythme : les idées 2 et 3 comptent le plus pour décider ; l’idée 4 peut aller vite pour des
  apprenants qui ne lanceront pas d’entraînement eux-mêmes.

## Check your understanding
1. Avec vos mots, que change le fine-tuning supervisé dans un modèle, et qu’obtient-on à la fin ?
   Good answer: il poursuit l’entraînement sur des paires entrée et sortie idéale, en ajustant les nombres du modèle pour que ses sorties ressemblent davantage aux exemples ; le résultat est une nouvelle version du modèle que l’on appelle à la place de l’original.
2. Le prompt de l’équipe de support respecte le format maison quatre fois sur cinq, et elle a déjà amélioré le prompt et mesuré. Le fine-tuning convient-il ? Que garderiez-vous en dehors ?
   Good answer: oui, un format et un ton réguliers sont un problème de comportement que le fine-tuning traite bien, et il peut raccourcir le prompt ; garder les faits sur les produits hors de l’entraînement, dans la recherche documentaire.
3. Pourquoi relancer des tests de sécurité et des tests généraux après avoir fine-tuné un modèle sur des réponses de support inoffensives ?
   Good answer: le fine-tuning peut affaiblir le comportement de sécurité entraîné par le fournisseur, même avec des données inoffensives, et peut dégrader d’autres capacités (oubli catastrophique) ; le score de la tâche seul ne le montrera pas.
4. Une entreprise veut cinq assistants aux styles différents pour cinq produits, sur le même modèle de base. Pourquoi des adaptateurs pourraient-ils mieux lui convenir que cinq fine-tunings complets ?
   Good answer: les adaptateurs entraînent un petit module par tâche sur une base figée, donc ils sont bien moins chers à entraîner et à stocker, s’interchangent par produit sur un seul modèle partagé, et atteignent souvent une qualité similaire ; il faut quand même la mesurer.

## Completion criteria
L’apprenant répond correctement aux questions, explique ce que change le fine-tuning, le réserve
aux problèmes de comportement plutôt qu’aux manques de connaissances, et nomme les effets
secondaires à tester (vérifications 1-4).

## Going further
- Sujets : l’oubli catastrophique, l’adaptation de rang faible (LoRA), l’optimisation par
  préférences, l’effet du fine-tuning sur l’entraînement de sécurité.
- Leçon suivante : ce qui fait de bonnes données d’entraînement.
