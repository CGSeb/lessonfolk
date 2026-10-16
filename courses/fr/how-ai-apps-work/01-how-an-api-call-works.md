---
id: how-ai-apps-work/01-how-an-api-call-works
title: Comment fonctionne un appel d’API d’IA
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer ce qu’est une API et ce que contient un appel d’API à un modèle
  - Lire une requête envoyée à un modèle et sa réponse, partie par partie
  - Expliquer pourquoi une clé d’API doit rester secrète
prerequisites:
  - prompting-basics/05-what-prompting-cannot-fix
---

## Key ideas
1. **Une API permet à votre code de parler à un modèle.** Une API (interface de programmation) est une
   façon définie pour un programme d’en demander quelque chose à un autre. Une API de modèle reçoit vos
   messages par le réseau (ou depuis votre propre machine) et renvoie la réponse du modèle. Un assistant de
   chat est lui-même une application construite sur une telle API.
2. **Une requête est une liste de messages plus des réglages.** Chaque message a un `role` (`system`,
   `user` ou `assistant`) et un `content` (le texte). Vous indiquez aussi le `model` et pouvez régler des
   options comme `temperature` (la variété des réponses) et une longueur maximale pour la réponse. De
   nombreux fournisseurs et outils de modèles locaux acceptent ce même format de messages de chat.
3. **La réponse contient le message et la consommation.** La réponse est le message du modèle. La
   consommation (usage) indique combien de **tokens** (morceaux de texte, à peu près des parties de mots)
   sont entrés et sortis, ce qui détermine la vitesse et, pour les modèles hébergés, le coût.
4. **Les modèles locaux et hébergés fonctionnent de la même façon.** Un outil de modèles locaux sert un
   modèle sur votre propre ordinateur : gratuit, privé, sans compte, mais limité par votre matériel. Un
   fournisseur hébergé fait tourner des modèles plus grands sur ses serveurs, en général derrière un
   compte, une clé d’API et une offre gratuite limitée. Un code qui lit l’adresse, le nom du modèle et la
   clé dans des réglages peut passer de l’un à l’autre sans modification.
5. **Une clé d’API est un mot de passe.** Les API hébergées vous identifient avec une clé secrète. Gardez-la
   dans une variable d’environnement, jamais dans votre code ni dans un dépôt git ; quiconque a la clé peut
   utiliser votre compte.

## Teaching notes
- Profil de l’apprenant : intermédiaire, à l’aise avec les idées techniques mais sans obligation de savoir
  coder. C’est une leçon de concepts : l’apprenant n’installe rien, n’écrit aucun code et n’a besoin
  d’aucun compte. Ne lui demandez jamais de lancer un appel.
- Pour montrer une requête, écrivez-la dans le chat sous forme de petit exemple annoté (modèle, liste de
  messages avec rôles, un ou deux réglages), puis la réponse et sa consommation, et expliquez chaque partie en
  mots simples. Utilisez le style « chat completions », largement répandu. Si le fournisseur de l’apprenant
  utilise un autre format, dites-le ; les concepts ne changent pas.
- Ne nommez ni outils, ni fournisseurs, ni modèles, ni prix, ni limites précis, car ils changent vite. Si
  l’apprenant demande quoi utiliser, décrivez ce qu’il faut rechercher (gratuit, compatible avec le format de
  messages de chat, documenté) et soyez honnête sur le fait que vous ne connaissez peut-être pas les derniers
  détails.
- Si l’apprenant veut essayer un appel pour de vrai, dites-lui que la pratique se trouve dans la section
  projets du site LessonFolk, pas dans cette leçon.
- Analogie qui fonctionne : **commander par correspondance**. Vous remplissez un formulaire (modèle,
  messages, réglages), vous l’envoyez et vous recevez un colis (la réponse) avec un reçu (la consommation).
- Idée reçue : « le modèle est dans mon application ». Avec une API hébergée, votre application ne fait
  qu’envoyer et recevoir du texte ; le modèle tourne ailleurs.
- Idée reçue : « une température de 0 rend les réponses correctes ». Elle les rend plus reproductibles, pas
  plus exactes.
- Mentionnez que les SDK des fournisseurs (bibliothèques prêtes à l’emploi) enveloppent la même requête
  brute, pour que l’apprenant la reconnaisse quel que soit l’outil utilisé par une application.

## Check your understanding
1. Que contient une requête d’API de chat, et que renvoie-t-elle ?
   Good answer: un nom de modèle, une liste de messages avec rôles et contenu, et des réglages facultatifs comme la température ou la longueur maximale ; la réponse contient le message du modèle et la consommation de tokens.
2. Pourquoi les applications lisent-elles l’adresse, le modèle et la clé dans des réglages (variables d’environnement) au lieu de les écrire dans le code ?
   Good answer: pour garder la clé secrète hors du code et du dépôt, et pour passer d’un modèle local à un fournisseur hébergé sans changer le code.
3. Quels sont les compromis entre un modèle local et un modèle hébergé ?
   Good answer: le local est gratuit, privé et sans compte mais dépend du matériel et est en général plus petit ; l’hébergé donne des modèles plus grands sur n’importe quel ordinateur mais demande un compte et une clé, a des limites d’offre gratuite et envoie les données au fournisseur.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait expliquer chaque partie d’une requête à un modèle
et de sa réponse.

## Going further
- La documentation officielle de l’API de l’outil local ou du fournisseur que vous avez choisi.
- Leçon suivante : les prompts système.
