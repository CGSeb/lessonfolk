---
id: connecting-ai-with-mcp/01-the-connection-problem
title: Le problème de la connexion
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer pourquoi un assistant a besoin de connexions à vos outils et à vos données
  - Expliquer pourquoi les intégrations sur mesure ne passent pas à l’échelle et ce qu’apporte un standard partagé
  - Nommer les trois rôles de MCP (hôte, client, serveur) et dire qui fait quoi
prerequisites: []
---

## Key ideas
1. **Seul, un assistant ne connaît que son entraînement et la conversation.** Pour aider dans un vrai
   travail, il doit lire vos fichiers, vos tickets, votre agenda ou votre base de données, et parfois agir :
   créer un ticket, envoyer un brouillon, lancer une requête. Sans connexion, c’est vous le coursier, qui
   copiez les informations à la main dans un sens et dans l’autre.
2. **Les connexions sur mesure se multiplient.** Si chaque assistant a besoin de son propre connecteur
   pour chaque outil, le travail croît comme assistants fois outils : trois assistants et cinq outils font
   quinze connecteurs, chacun à construire, sécuriser et maintenir séparément. Un connecteur fait pour un
   assistant ne sert à aucun autre.
3. **Un standard partagé transforme un produit en somme.** Le **Model Context Protocol (MCP)** est un
   standard ouvert qui décrit comment un assistant dialogue avec un outil ou une source de données. Il a
   été créé par une entreprise, il est aujourd’hui gouverné de façon ouverte sous l’égide de la Linux
   Foundation, et il a été adopté par de nombreux assistants et outils. Un outil est emballé
   une fois sous forme de serveur MCP, et tout assistant qui parle MCP peut l’utiliser : trois assistants
   et cinq outils demandent huit éléments au lieu de quinze. Pensez à une forme de prise commune dans
   laquelle tous les branchements s’emboîtent.
4. **Il y a trois rôles.** L’**hôte** est l’application que vous utilisez (une application de chat, un
   assistant de code). À l’intérieur, un **client** maintient la connexion avec un serveur. Le **serveur**
   est le programme qui propose un outil ou une source de données. Le modèle ne va pas lui-même chercher
   quoi que ce soit : comme dans l’appel d’outils (vu dans *Agents IA et outils*), le modèle demande, et
   l’hôte agit par l’intermédiaire du client.
5. **Un standard facilite la connexion, il ne la rend ni plus sûre ni plus intelligente.** MCP ne rend pas
   le modèle plus capable, et il ne décide pas de ce qu’il est sûr de connecter. Chaque serveur que vous
   ajoutez apporte son propre accès à vos données et ses propres risques (leçon 5). Ce n’est pas non plus
   la seule voie : une intégration native, un fichier que vous collez, ou votre propre code qui appelle un
   outil peuvent être plus simples.

## Teaching notes
- Analogie : avant qu’il existe une forme de prise commune, chaque appareil venait avec sa propre fiche et
  chaque pays avait sa propre prise murale. Une forme commune permet à n’importe quel appareil de
  fonctionner n’importe où. MCP joue ce rôle pour les assistants et les outils.
- Scénario à raisonner avec l’apprenant (rien à installer) : une équipe utilise deux assistants et veut
  qu’ils accèdent au gestionnaire de tickets, au wiki et à l’agenda. Demandez combien de connecteurs il
  faut si chaque assistant a le sien, et combien si les trois outils avaient chacun un serveur MCP.
- Idée reçue : « MCP est un modèle d’IA ou un produit ». C’est un protocole, un ensemble de règles
  convenues pour les messages, comme celles qui permettent à n’importe quel navigateur de parler à
  n’importe quel serveur web.
- Idée reçue : « le modèle se connecte directement au serveur ». C’est l’application hôte qui le fait, à la
  demande du modèle, et elle peut vous demander avant d’agir.
- Idée reçue : « MCP ne sert qu’aux assistants de code ». Ils ont été parmi les premiers à l’adopter, mais
  n’importe quel assistant ou application peut le parler.
- Ne nommez ni serveurs, ni assistants, ni fournisseurs, ni versions de la spécification : ils changent vite.
- Débutants dans le cours : idées 1 à 4 avec le scénario de décompte des connecteurs. Apprenants
  expérimentés : discutez des cas où MCP est le mauvais choix (idée 5).
- Rythme : l’idée 4 est celle à ancrer ; la leçon suivante s’appuie sur ces trois rôles.

## Check your understanding
1. Pourquoi les connexions sur mesure entre assistants et outils deviennent-elles difficiles à gérer quand on
   en ajoute ?
   Good answer: chaque assistant aurait besoin de son propre connecteur pour chaque outil, donc le nombre croît
   comme assistants fois outils, et chacun doit être construit, sécurisé et maintenu ; un connecteur pour un
   assistant ne sert pas à un autre.
2. Avec vos mots, qu’est-ce qu’un standard partagé comme MCP change ?
   Good answer: un outil est emballé une fois en serveur et tout assistant qui parle le standard peut
   l’utiliser, donc le travail croît comme assistants plus outils plutôt que comme leur produit.
3. Un assistant liste vos tickets ouverts dans le gestionnaire de tickets. Qui, de l’hôte, du client et du
   serveur, fait quelle part ?
   Good answer: le modèle demande l’outil, l’hôte (l’application) traite la demande par son client, et le
   serveur du gestionnaire de tickets récupère les tickets et les renvoie ; le modèle ne contacte pas
   lui-même le gestionnaire.
4. Un collègue dit : « avec MCP, l’assistant peut tout faire en sécurité avec nos outils ». Que répondez-vous ?
   Good answer: MCP ne fait que standardiser la connexion ; il ne rend ni le modèle plus capable ni l’accès
   sûr, et chaque serveur apporte ses propres droits et risques qu’il faut choisir et vérifier.

## Completion criteria
L’apprenant peut expliquer pourquoi les connexions sont nécessaires et pourquoi les connecteurs sur mesure ne
passent pas à l’échelle, décrire ce que change un standard partagé, nommer les rôles d’hôte, de client et de
serveur, et dire qu’un standard ne rend pas à lui seul les connexions sûres (vérifications 1-4).

## Going further
- La leçon « L’appel d’outils et de fonctions » d’*Agents IA et outils* explique le schéma sur lequel MCP
  s’appuie : le modèle demande, l’application agit.
- La documentation du Model Context Protocol, sur modelcontextprotocol.io, est la référence officielle.
