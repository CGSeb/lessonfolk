---
id: how-ai-apps-work/07-sharing-and-next-steps
title: Avant de partager une application d’IA
level: intermediate
estimatedMinutes: 15
objectives:
  - Savoir quoi vérifier avant de laisser d’autres utiliser une application d’IA
  - Choisir un moyen simple de la partager
  - Planifier ce qu’il faut apprendre ensuite
prerequisites:
  - how-ai-apps-work/06-design-a-small-chatbot
---

## Key ideas
1. **Les clés restent sur un serveur, jamais chez les utilisateurs.** Si votre application tourne dans un
   navigateur ou sur l’appareil de quelqu’un d’autre, toute clé qu’elle contient peut être extraite. Placez
   l’appel au modèle derrière un petit serveur (un backend) qui détient la clé, et faites parler
   l’application à votre serveur à la place.
2. **Fixez des limites avant de partager.** Utilisez les plafonds de dépense ou de consommation du
   fournisseur, et ajoutez les vôtres : une longueur maximale de message, un nombre maximal de messages par
   utilisateur, une limite de débit. Un bot partagé peut être utilisé bien plus que prévu, parfois exprès.
3. **Dites aux utilisateurs ce qu’il advient de leurs données.** Dites qu’ils parlent à une IA, qu’elle peut
   se tromper, ce que vous stockez (les conversations, le cas échéant) et pour combien de temps, et si des
   données partent chez un fournisseur de modèles. Stockez le moins possible.
4. **Commencez avec quelques vrais utilisateurs.** Partagez avec quelques personnes de confiance, observez
   comment elles l’utilisent et collectez les conversations qui ont mal tourné (avec leur permission). Les
   vrais utilisateurs trouvent des problèmes que vos tests n’ont pas trouvés.
5. **Des moyens simples de partager, et la suite.** Vous pouvez commencer par une application en terminal
   qu’un ami lance sur sa machine avec sa propre configuration, une petite page web devant votre backend,
   ou une offre d’hébergement gratuite pour petits projets. Ensuite, le cours Agents IA et outils montre
   comment laisser un modèle appeler des fonctions et agir.

## Teaching notes
- Ne nommez ni services d’hébergement, ni frameworks web, ni prix ; décrivez les options et laissez
  l’apprenant chercher les offres gratuites actuelles dans sa pile technique.
- Analogie qui fonctionne : **ouvrir un petit café**. Avant l’arrivée des premiers clients, vous fermez le
  coffre (les clés), fixez les heures d’ouverture (les limites), affichez un panneau sur les allergènes
  (les données et la mention de l’IA) et invitez des amis pour une ouverture en douceur (quelques vrais
  utilisateurs).
- Idée reçue : « cacher la clé dans le code du frontend, ça va si c’est minifié ». Tout ce qui est livré
  sur l’appareil de l’utilisateur peut être lu.
- Idée reçue : « c’est un petit projet, personne n’en abusera ». Les points d’accès publics sont trouvés et
  utilisés ; les limites protègent à la fois votre budget et vos utilisateurs.
- Ne donnez pas de conseils juridiques sur les règles de vie privée ; dites à l’apprenant que les règles
  diffèrent selon les pays et de les vérifier avant de collecter les données d’autres personnes.
- Concluez le cours : récapitulez le chemin d’un simple appel d’API à un chatbot conçu et testé, et suggérez des
  prochaines étapes adaptées à leurs objectifs (Agents IA et outils, évaluation plus poussée, récupération
  dans des documents comme sujets).

## Check your understanding
1. Pourquoi la clé d’API ne doit-elle pas figurer dans le code d’une page web qui appelle directement le modèle ?
   Good answer: tout ce qui est envoyé au navigateur de l’utilisateur peut être lu, donc la clé pourrait être volée et utilisée ; l’appel doit passer par un backend qui garde la clé secrète.
2. Citez deux limites que vous fixeriez avant de partager publiquement un chatbot, et pourquoi.
   Good answer: deux éléments parmi un plafond de dépense ou de consommation chez le fournisseur, des limites de messages ou de débit par utilisateur, une longueur maximale de message ; elles protègent le budget et préviennent les abus.
3. Que faut-il dire aux utilisateurs d’un chatbot ?
   Good answer: que c’est une IA et qu’elle peut se tromper, quelles données sont stockées et pour combien de temps, et si leurs messages sont envoyés à un fournisseur de modèles.

## Completion criteria
L’apprenant répond correctement aux vérifications et rédige un plan de partage qui couvre le stockage de la
clé, les limites, une information sur les données et ce qu’il faut apprendre ensuite.

## Going further
- Agents IA et outils : laisser les modèles appeler des fonctions et agir.
- Sujets : évaluer les applications d’IA avec des jeux de test, la récupération dans vos propres documents.
