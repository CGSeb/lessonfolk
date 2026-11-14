---
id: evidence-based-ai-choice
title: Choisir un outil d’IA avec des preuves
level: intermediate
theme: using-ai
authors: [lessonfolk]
description: Comparez deux options d’IA pour une tâche que vous faites vraiment, sur un petit jeu de test réel noté selon des critères écrits, et faites un choix que vous savez expliquer.
estimatedHours: 2
buildsOn: [evaluating-ai-output, prompting-basics]
needs:
  - Deux applications de chat IA ou deux modèles à comparer, ou une application et deux versions d’un prompt (les offres gratuites suffisent)
  - Un tableur ou un document avec un tableau pour noter les résultats
  - Une tâche que vous faites avec l’IA, ou aimeriez faire, et qui revient souvent
---

## Brief
Vous avez un choix à faire pour une tâche que vous faites vraiment : deux applications de chat
IA, deux modèles dans la même application, ou votre prompt actuel et une nouvelle version. Au
lieu de prendre celle qui « avait l’air mieux » sur un essai, vous allez construire votre
propre petit test, y noter les deux options et prendre une décision que vous saurez expliquer
à quelqu’un d’autre.

C’est vous qui choisissez la tâche, les deux options, les critères et les cas de test. Votre
tuteur est votre coach : il vous pose des questions, signale ce qui pourrait rendre la
comparaison injuste et relit vos résultats avec vous, mais il n’écrira ni vos critères, ni vos
cas, ni votre conclusion.

Vos cas de test doivent venir d’un usage réel, mais ne collez jamais d’informations
personnelles ou confidentielles dans une application d’IA : retirez ou modifiez d’abord les
noms, les chiffres et tout ce qui est privé.

## Milestones
1. **Définir ce qu’est une bonne réponse.** Écrivez ce qu’un résultat doit avoir pour que vous
   l’utilisiez, sous forme de critères que quelqu’un d’autre pourrait vérifier.
   Done when: l’apprenant partage 3 à 5 critères pour sa tâche, chacun observable (il sait dire
   comment distinguer une réussite d’un manquement), et indique lesquels sont obligatoires et
   lesquels sont souhaitables.
2. **Construire le jeu de test.** Rassemblez de vrais cas pour la tâche, assez variés pour
   montrer où une option casse, et notez pour chacun ce qu’une bonne réponse doit contenir ou
   éviter.
   Done when: l’apprenant partage au moins 8 cas anonymisés, dont des cas typiques et au moins
   deux cas difficiles (confus, ambigus, très longs ou inhabituels), chacun avec une courte note
   sur ce qu’est une bonne réponse.
3. **Choisir comment noter.** Décidez, pour chaque critère, si vous le vérifiez avec une règle
   simple, en lisant vous-même ou avec une IA juge, et comment vous noterez le résultat.
   Done when: l’apprenant donne une méthode de notation pour chaque critère, avec une raison, et
   montre le tableau vide (les cas en lignes, les critères de chaque option en colonnes) qu’il
   va remplir.
4. **Lancer la comparaison.** Passez les deux options sur tous les cas dans les mêmes
   conditions, et remplissez le tableau.
   Done when: l’apprenant partage le tableau rempli pour les deux options sur tous les cas, dit
   ce qui est resté identique entre les deux passages, et liste les cas où une option rate un
   critère obligatoire.
5. **Décider et prévoir le prochain test.** Faites un choix appuyé sur les résultats, dites ce
   que le test ne peut pas vous apprendre, et décidez quand le relancer.
   Done when: l’apprenant annonce son choix (ou « pas de différence nette ») avec les résultats
   qui l’appuient, nomme au moins une limite de son test, et au moins un événement qui le ferait
   relancer.

## Coaching notes
- **Coachez, ne décidez pas.** N’écrivez jamais les critères, les cas ou la conclusion à la
  place de l’apprenant. Quand il bloque, montez une échelle d’aide : d’abord une question
  (« qu’est-ce qui vous ferait envoyer cette réponse sans la retoucher ? »), puis l’idée utile
  (vue dans Évaluer les réponses de l’IA), et seulement ensuite un court exemple sur une autre
  tâche que la sienne.
- **Une paire équitable.** À l’étape 1 ou avant, vérifiez quelles sont les deux options.
  Comparer deux prompts sur deux modèles différents change deux choses à la fois : proposez
  d’en garder une fixe (vu dans « Comparer des versions et repérer les régressions » d’Évaluer
  les réponses de l’IA).
- **Étape 1 : des critères flous.** « Clair », « bon ton » ou « exact » seuls ne se notent pas.
  Demandez comment il distinguerait une réussite d’un manquement, et poussez vers une
  formulation que n’importe qui pourrait appliquer. Un critère obligatoire est un critère dont
  le manquement rend la réponse inutilisable, aussi bonne soit-elle par ailleurs.
- **Étape 2 : des cas qui se ressemblent tous.** Des cas propres écrits pour le test flattent
  les deux options. Encouragez des cas tirés de l’usage réel, avec leur désordre, et au moins
  deux cas difficiles. Si l’apprenant améliore un prompt, proposez-lui de garder deux ou trois
  cas de côté, sur lesquels il n’ajuste jamais le prompt, pour vérifier la version finale.
- **Étape 3 : une confiance aveugle dans l’IA juge.** Si l’apprenant utilise une IA juge,
  demandez-lui de lui donner la grille, d’inverser l’ordre quand elle compare deux réponses, et
  de noter d’abord quelques cas lui-même pour voir si la juge est d’accord. Les biais connus des
  IA juges (préférer les réponses longues, la première ou la dernière réponse montrée, ou un
  style proche du leur) sont vus dans « Noter : vérifications, personnes et IA juges ». Une
  règle suffit pour le format, la longueur ou une mention obligatoire.
- **Étape 4 : un passage injuste.** Repérez les options passées à des jours différents avec des
  consignes différentes, une conversation qui contient déjà des messages précédents, ou des
  réglages changés d’un seul côté. Une nouvelle conversation pour chaque cas évite qu’une
  réponse influence la suivante.
- **Étape 5 : un gagnant né du hasard.** Avec une dizaine de cas, un écart d’un ou deux cas
  peut être de la chance, et les réponses varient d’un passage à l’autre. Si l’écart est faible,
  encouragez-le à relancer les cas les plus serrés, ou à conclure « pas de différence nette » et
  à choisir sur autre chose (coût, simplicité, confidentialité). Un seul échec sur un critère
  obligatoire peut peser plus que plusieurs petits gains.
- **Ce que le test ne dit pas.** Orientez la limite vers de vraies limites : seulement les
  situations auxquelles il a pensé, un petit jeu, un seul passage, le jugement d’une seule
  personne. Parmi les événements qui appellent un nouveau test : une mise à jour ou un
  changement de modèle, une modification du prompt, de nouveaux types d’entrées, ou des
  utilisateurs qui trouvent que les résultats ont changé.
- **Enjeux élevés.** Si la tâche touche à la santé, au droit, à l’argent ou à des décisions sur
  des personnes, dites que le test aide à choisir un outil mais ne remplace pas la vérification
  à la main des réponses importantes.
- **Confidentialité** (vu dans Utiliser l’IA en toute sécurité et avec discernement) : si
  l’apprenant colle des noms, des données clients ou quoi que ce soit de privé, arrêtez-vous et
  demandez-lui de l’anonymiser d’abord. Ne le répétez jamais.
- **Les apprenants qui n’ont pas suivi le cours** peuvent avoir besoin des idées clés en cours
  de route : une courte explication par étape, puis retour à leur tâche. **Les apprenants
  expérimentés** peuvent ajouter des cas, passer chaque option deux fois, ou comparer leurs
  notes avec celles d’une autre personne.
- **Rythme.** Le projet tient en une ou deux séances ; l’étape 4 est la plus longue.
  Enregistrez des notes après chaque étape pour que la séance suivante reparte de là. Vous ne
  voyez que ce que l’apprenant colle : demandez les critères, les cas et le tableau au lieu de
  supposer.

## Review
1. Les critères sont observables, adaptés à la tâche, et séparent l’obligatoire du souhaitable.
2. Le jeu de test vient de l’usage réel, est varié, contient des cas difficiles, et dit pour
   chaque cas ce qu’est une bonne réponse.
3. Chaque critère a une méthode de notation adaptée, et toute IA juge a été comparée aux notes
   de l’apprenant.
4. Les deux options ont été comparées équitablement : mêmes cas, mêmes critères et mêmes
   conditions, avec une seule chose qui change.
5. La décision découle des résultats, traite les petits écarts avec prudence, nomme une limite
   du test et dit quand le relancer.
6. Les cas de test ne contenaient aucune information personnelle ou confidentielle, ou elle a
   été anonymisée d’abord.

## Going further
- Gardez le jeu de test et le tableau, et relancez-les la prochaine fois que le modèle ou votre
  prompt change ; notez ce qui a bougé.
- Chaque fois qu’une option échoue en usage réel, ajoutez ce cas au jeu de test avec ce qu’est
  une bonne réponse.
- Demandez à un collègue de noter quelques réponses avec vos critères, et discutez de vos
  désaccords : ils montrent quel critère est encore flou.
