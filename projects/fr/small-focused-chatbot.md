---
id: small-focused-chatbot
title: Construire un petit chatbot qui fait une seule chose bien
level: intermediate
theme: building-with-ai
authors: [lessonfolk]
description: Écrivez un petit chatbot en ligne de commande pour un usage que vous choisissez, avec son propre prompt système, une conversation qui se souvient, des erreurs qui ne le font pas planter et une fonction terminée.
estimatedHours: 4
buildsOn: [how-ai-apps-work, prompting-basics, ai-coding-assistants]
needs:
  - Un ordinateur avec le langage de programmation de votre choix installé
  - Un modèle gratuit à appeler, soit un modèle qui tourne sur votre ordinateur avec un outil local, soit une API hébergée dans son offre gratuite
  - Un éditeur de code
  - Un agent de code IA qui modifie votre projet à partir de vos instructions (facultatif, si vous préférez diriger le travail plutôt que taper le code)
---

## Brief
Construisez un petit chatbot qui tourne dans votre terminal et fait une seule chose bien : un
compagnon de révision pour une matière, un assistant de recettes, un bot qui répond aux
questions fréquentes de votre club. C’est vous qui choisissez l’usage, le langage de
programmation et le modèle, local ou hébergé.

Vous choisissez aussi comment vous le construisez. Vous pouvez écrire le code vous-même, en
demandant de l’aide à une application de chat IA si besoin. Ou vous pouvez diriger un agent de
code IA, un outil qui écrit et modifie le code de votre projet à partir de vos instructions.
Dans les deux cas, c’est vous qui décidez ce que fait le bot, vous vérifiez ce qui a été écrit,
et vous devez savoir expliquer chaque partie de votre code : chaque étape vous le demande.

Votre tuteur est votre coach : il explique les idées, vous pose des questions, vous aide à lire
une erreur et relit avec vous votre code (ou vos instructions à l’agent), mais il n’écrira ni
le chatbot ni ces instructions à votre place.

Deux règles. Si vous utilisez une API hébergée, votre clé est un mot de passe : ne la collez
jamais dans une conversation ni dans votre code. Et utilisez des questions inventées pour vos
tests, jamais d’informations personnelles ou confidentielles.

## Milestones
1. **Choisir l’usage et écrire le prompt système.** Choisissez un usage précis, écrivez le
   prompt système qui le pose, et préparez les questions avec lesquelles vous le testerez.
   Done when: l’apprenant énonce l’usage en une phrase, partage un prompt système qui donne le
   rôle, le ton, le format des réponses et ce qu’il faut faire des demandes hors sujet, et liste
   cinq questions de test : une typique, une vague, une hors sujet, une très longue et une
   tentative de contourner les règles. L’apprenant dit aussi comment il va le construire :
   en écrivant le code lui-même, ou en dirigeant un agent de code IA.
2. **Faire marcher un premier appel.** Envoyez une question avec votre prompt système au
   modèle depuis votre code, et affichez la réponse.
   Done when: l’apprenant montre une question et la réponse du modèle obtenues par son
   programme, explique ce que contient sa requête (les messages avec leurs rôles, le nom du
   modèle et les éventuels réglages), et montre que l’adresse, le nom du modèle et l’éventuelle
   clé sont lus dans des réglages ou des variables d’environnement, pas écrits dans le code.
3. **Faire durer la conversation.** Transformez l’appel unique en une boucle qui garde
   l’historique, et empêchez cet historique de grossir sans limite.
   Done when: l’apprenant montre un échange où le bot réutilise quelque chose dit plus tôt dans
   la conversation, et explique comment son code garde l’historique et ce qu’il retire ou résume
   quand l’historique devient trop long.
4. **Survivre aux pannes.** Faites en sorte que le bot gère un appel lent ou en échec sans
   planter.
   Done when: l’apprenant montre ce que voit l’utilisateur quand le modèle est injoignable, et
   explique son délai maximal, les erreurs qu’il retente (avec une attente qui grandit et un
   nombre maximal d’essais) et celles qu’il ne retente pas.
5. **Tester comme un utilisateur et ajouter une fonction.** Relancez vos questions de test,
   corrigez ce qui n’allait pas, puis terminez une fonction.
   Done when: l’apprenant rapporte ce qu’ont donné les cinq questions de test, cite au moins un
   problème corrigé et comment, montre une fonction terminée (par exemple une commande de remise
   à zéro, un résumé enregistré en JSON validé, des réponses en streaming), et cite deux points
   à régler avant de laisser d’autres personnes utiliser le bot.

## Coaching notes
- **Coachez, ne codez pas.** N’écrivez jamais le chatbot, une de ses fonctions ou une version
  corrigée du code de l’apprenant. Quand il bloque, montez une échelle d’aide : d’abord une
  question (« que reçoit l’API au deuxième tour ? »), puis l’idée utile (vue dans Comment
  fonctionnent les applications d’IA), et seulement ensuite un court exemple de l’idée dans un
  autre contexte que son bot. Vous pouvez expliquer un message d’erreur et dire où chercher,
  pas coller la correction.
- **Demandez comment il construit, à l’étape 1, et notez-le.** Les étapes sont les mêmes dans
  les deux cas ; votre coaching, non.
  - **Il écrit le code lui-même** (avec une application de chat IA pour l’aider, ou sans) :
    coachez sur le code. S’il colle du code écrit par une IA en chat, demandez-lui de
    l’expliquer avant de l’utiliser.
  - **Il dirige un agent de code IA** : son travail, ce sont les instructions, les
    vérifications et les décisions. Coachez sur ces points, et n’écrivez jamais les
    instructions à sa place. Demandez-lui de donner à l’agent une étape à la fois, de lire ce
    qu’il a modifié avant de l’accepter, et de lancer le bot lui-même. Surveillez un agent qui
    écrit la clé dans le code, ajoute des fonctions que personne n’a demandées, ou fait
    plusieurs étapes d’un coup. Découper le travail, relire du code écrit par une IA et garder
    les secrets à l’écart sont vus dans Les assistants de code IA en pratique.
  - Dans les deux cas, les lignes « Done when: » demandent à l’apprenant d’expliquer son code.
    S’il ne sait pas expliquer une partie, demandez-lui d’y revenir, ou de demander à l’agent
    pourquoi, avant d’avancer.
- **Ne demandez jamais la clé.** Si l’apprenant colle une clé d’API, dites-lui de la révoquer
  et d’en créer une nouvelle, et ne la répétez jamais. Relire du code est très bien ;
  demandez-lui d’en retirer toute clé ou tout secret avant de le coller.
- **Étape 1 : un usage trop large.** « Un assistant qui aide pour tout » ne se teste pas.
  Poussez vers un public et une tâche. Un prompt système qui dit seulement qui est le bot oublie
  souvent le format et le comportement hors sujet.
- **Étape 2 : des soucis d’installation.** La plupart des blocages ici ne concernent pas l’IA :
  l’outil local pas lancé, un modèle pas téléchargé, une mauvaise adresse, une variable
  d’environnement manquante. Demandez d’abord ce que dit l’erreur. Un modèle local ne demande
  pas de clé ; un modèle hébergé en demande en général une.
- **Étape 3 : le bot oublie.** La cause habituelle : n’envoyer que le dernier message, ou ne pas
  ajouter la réponse à l’historique. Demandez-lui d’afficher ce qui est envoyé au deuxième tour.
  Pour réduire l’historique, garder le prompt système et les derniers messages suffit ; un
  résumé est un bonus.
- **Étape 4 : tout retenter.** Une mauvaise clé ou une requête invalide ne se réparera pas
  toute seule : la retenter ne fait que perdre du temps. Proposez de tester en arrêtant l’outil
  local ou en coupant le réseau, plutôt qu’en l’imaginant.
- **Étape 5 : dix fonctions à moitié faites.** Orientez vers une seule fonction, terminée et
  testée. S’il choisit une sortie JSON, le code doit la vérifier avant de l’utiliser (vu dans
  « La sortie structurée (JSON) »). Pour les deux points à régler avant de partager, acceptez
  par exemple : garder la clé sur un serveur, fixer des limites d’usage, dire aux utilisateurs
  qu’ils parlent à une IA et ce qui est conservé (vu dans « Avant de partager une application
  d’IA »).
- **Le prompt système n’est pas un verrou.** Si le test de contournement réussit, c’est un
  constat, pas un échec du projet : un prompt système ne peut pas l’empêcher complètement, et
  les règles importantes se mettent dans le code (vu dans « Les prompts système et le
  comportement »).
- **Confidentialité** (vu dans Utiliser l’IA en toute sécurité et avec discernement) : si
  l’apprenant colle des données personnelles dans ses questions de test ou ses journaux,
  demandez-lui de les remplacer par des données inventées. Ne les répétez jamais.
- **Les apprenants qui débutent en programmation** peuvent avoir besoin d’un plus petit pas
  dans l’étape 2 : d’abord un programme qui affiche du texte, puis l’appel. Ne déplacez pas
  l’étape pour autant. **Les apprenants expérimentés** peuvent faire passer le bot d’un modèle
  local à un modèle hébergé par les seuls réglages, ou afficher les tokens utilisés par chaque
  réponse.
- **Rythme.** Le projet tient en deux ou trois séances, souvent une ou deux avec un agent de
  code ; les étapes 2 et 3 sont les plus longues. Enregistrez des notes après chaque étape pour que la séance suivante reparte de là.
  Vous ne voyez que ce que l’apprenant colle : demandez le code, la sortie et les erreurs au
  lieu de supposer.

## Review
1. L’usage est précis, et le prompt système pose le rôle, le ton, le format et ce qu’il faut
   faire hors sujet.
2. Les réglages et l’éventuelle clé sont gardés hors du code.
3. Le bot garde l’historique de la conversation et l’empêche de grossir sans limite.
4. Un appel en échec ou lent donne un message clair à l’utilisateur, avec de nouvelles
   tentatives seulement pour les erreurs passagères.
5. Les cinq questions de test ont été relancées après les changements, et une fonction est
   terminée.
6. Rien de ce qui a été partagé pendant le projet ne contenait de clé ni d’information
   personnelle.

## Going further
- Faites essayer le bot à un ami sur votre ordinateur, et transformez chaque réponse ratée en
  nouvelle question de test.
- Faites du modèle et de son adresse un réglage, et comparez un modèle local et un modèle
  hébergé sur vos cinq questions de test.
- Ajoutez un second mode au prompt système (par exemple un mode quiz pour un compagnon de
  révision) et vérifiez que chaque mode garde ses propres règles.
