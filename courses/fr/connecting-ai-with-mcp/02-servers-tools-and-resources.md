---
id: connecting-ai-with-mcp/02-servers-tools-and-resources
title: Serveurs, outils et ressources
level: intermediate
estimatedMinutes: 15
objectives:
  - Distinguer les trois choses qu’un serveur MCP peut proposer et qui contrôle chacune
  - Suivre, étape par étape, ce qui se passe quand un assistant utilise un serveur
  - Expliquer pourquoi les descriptions d’outils et leurs résultats comptent
prerequisites:
  - connecting-ai-with-mcp/01-the-connection-problem
---

## Key ideas
1. **Un serveur peut proposer trois sortes de choses.** Les *outils* sont des actions que le modèle peut
   demander : chercher des tickets, créer un événement d’agenda, lancer une requête. Les *ressources* sont des
   données qui peuvent être lues et fournies au modèle comme contexte : un fichier, une fiche, une page. Les
   *prompts* sont des modèles prêts à l’emploi qu’une personne peut lancer, comme « résume les tickets de la
   semaine ». Un serveur peut proposer n’importe quel mélange des trois.
2. **Chaque sorte a un contrôleur différent.** Le modèle décide quand appeler un outil (et l’application peut
   vous demander de l’approuver). L’application ou la personne choisit la ressource à joindre. La personne
   choisit un prompt. Savoir qui contrôle quoi indique où placer une protection.
3. **L’assistant apprend ce qu’un serveur propose en le demandant.** Quand un client se connecte, il demande au
   serveur ce qu’il a, et le serveur répond par une liste : pour chaque outil, son nom, une description et la
   forme des entrées attendues. L’hôte transmet ces descriptions d’outils au modèle, comme dans l’appel d’outils.
   C’est pourquoi on peut ajouter un nouveau serveur sans modifier l’assistant.
4. **Un appel passe par l’hôte, jamais directement par le modèle.** Vous posez une question ; le modèle choisit un
   outil et des arguments ; l’hôte envoie la demande au serveur par son client ; le serveur fait le travail avec
   son propre accès au système réel et renvoie un résultat ; l’hôte donne le résultat au modèle, qui rédige la
   réponse. Le modèle ne touche jamais lui-même à vos systèmes.
5. **Les descriptions et les résultats sont du texte qui oriente le modèle.** Le modèle choisit les outils d’après
   leurs noms et leurs descriptions (vu dans *Agents IA et outils*) ; des descriptions vagues ou trompeuses
   mènent donc à de mauvais choix. Et ce qu’un outil renvoie entre dans la conversation, où cela occupe de la
   place dans la fenêtre de contexte et peut influencer la suite. Les deux viennent du serveur, c’est pourquoi
   il faut faire confiance au serveur (leçon 5).

## Teaching notes
- Analogie : un restaurant. La carte, c’est la liste des outils et de leurs descriptions. Le serveur de salle (l’hôte)
  porte votre commande en cuisine (le serveur MCP) et rapporte le plat. Le client (le modèle) n’entre jamais en
  cuisine. Les ressources sont comme la corbeille de pain posée sur la table, et les prompts comme le menu du jour
  que vous commandez par son nom.
- Scénario à raisonner avec l’apprenant (rien à installer) : un assistant est connecté à un serveur d’agenda qui
  propose « lister les événements », « créer un événement » et « supprimer un événement ». Demandez lequel des trois
  demanderait d’abord votre approbation, qui décide de l’appeler, et ce que le modèle voit ensuite.
- Idée reçue : « les ressources et les outils, c’est pareil ». Les ressources se lisent et sont choisies par
  l’application ou la personne ; les outils sont des actions que le modèle demande.
- Idée reçue : « le serveur est l’endroit où l’IA tourne ». Le serveur n’est qu’un connecteur vers le système ; le
  modèle tourne dans le service de l’hôte, où que l’assistant soit hébergé.
- Ne nommez aucun serveur et ne donnez pas de formats de messages du protocole : l’idée compte, pas la syntaxe.
- Débutants dans le cours : idées 1, 3 et 4 avec le scénario de l’agenda. Apprenants expérimentés : discutez de qui
  contrôle chaque sorte et de l’endroit où placer l’approbation.
- Rythme : l’idée 4 est le fil rouge de tout le cours ; assurez-vous qu’elle est claire avant de passer à la suite.

## Check your understanding
1. Nommez les trois choses qu’un serveur MCP peut proposer et donnez un exemple de chacune.
   Good answer: des outils (des actions comme créer un événement d’agenda), des ressources (des données à lire comme
   un fichier ou une fiche) et des prompts (des modèles qu’une personne lance, comme un résumé hebdomadaire).
2. Qui décide quand un outil est appelé, et qui choisit la ressource jointe ?
   Good answer: le modèle décide d’appeler un outil (l’application pouvant demander une approbation) ;
   l’application ou la personne choisit une ressource.
3. Décrivez ce qui se passe quand vous demandez à un assistant « qu’y a-t-il dans mon agenda demain ? » avec un
   serveur d’agenda connecté.
   Good answer: le modèle choisit l’outil « lister les événements » et ses arguments ; l’hôte envoie la demande par
   le client ; le serveur lit l’agenda et renvoie les événements ; l’hôte les donne au modèle, qui rédige la réponse ;
   le modèle ne touche jamais lui-même à l’agenda.
4. Pourquoi une description d’outil vague peut-elle poser problème ?
   Good answer: le modèle choisit les outils d’après leurs noms et descriptions, donc une description vague ou
   trompeuse peut l’amener à choisir le mauvais outil ou à mal l’utiliser.

## Completion criteria
L’apprenant peut nommer les trois propositions et qui contrôle chacune, décrire le trajet d’un appel à travers
l’hôte, le client et le serveur, et expliquer pourquoi les descriptions et les résultats comptent (vérifications 1-4).

## Going further
- La leçon « L’appel d’outils et de fonctions » d’*Agents IA et outils* montre le même schéma du côté de l’application.
- Sujet à explorer : comment la liste des outils d’un serveur est présentée au modèle à côté de vos messages.
