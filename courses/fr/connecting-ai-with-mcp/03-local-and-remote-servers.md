---
id: connecting-ai-with-mcp/03-local-and-remote-servers
title: Serveurs locaux et serveurs distants
level: intermediate
estimatedMinutes: 15
objectives:
  - Comparer un serveur qui tourne sur votre machine à un serveur distant
  - Expliquer ce que chaque choix implique pour vos données et pour la confiance que vous accordez
  - Décrire comment la connexion et les autorisations limitent ce qu’un branchement peut faire
prerequisites:
  - connecting-ai-with-mcp/02-servers-tools-and-resources
---

## Key ideas
1. **Un serveur local tourne sur votre propre ordinateur.** L’application d’assistant le démarre et lui parle sur la
   même machine. Il peut atteindre tout ce que votre compte utilisateur peut atteindre : vos fichiers, vos programmes
   et vos identifiants enregistrés. C’est utile pour travailler avec des fichiers et des outils locaux, et cela veut
   dire que le code du serveur s’exécute avec vos accès.
2. **Un serveur distant tourne ailleurs.** Vous vous y connectez par une adresse sur internet, en général en vous
   identifiant auprès du service qu’il représente. Le fournisseur l’exploite et peut le mettre à jour à tout moment.
   Il convient aux services en ligne comme les agendas, les gestionnaires de tickets ou les bases de données, et vos
   requêtes ainsi que les données qu’elles touchent voyagent jusqu’à ce fournisseur.
3. **Aucun des deux n’est automatiquement plus sûr.** Avec un serveur local, vous faites confiance au code que vous
   avez installé et à sa provenance. Avec un serveur distant, vous faites confiance à l’exploitant : sa façon de
   traiter vos données, sa sécurité et les changements qu’il fait. Demandez ce que chaque serveur peut voir, ce
   qu’il peut modifier, et qui peut modifier le serveur.
4. **La connexion et les autorisations fixent les limites.** Un branchement distant vous demande normalement
   d’approuver l’accès à votre compte, souvent avec un choix de ce qui est permis (par exemple lecture seule). Le
   branchement agit avec *vos* droits : tout ce que vous pouvez lire, l’assistant peut le lire par son
   intermédiaire. Choisissez l’autorisation la plus étroite qui fait le travail, préférez un compte séparé ou en
   lecture seule pour les essais, et sachez comment révoquer l’accès. Gardez clés et jetons hors des fichiers qui
   sont partagés ou versionnés.
5. **Au travail, les règles ne vous appartiennent pas forcément.** Les entreprises limitent souvent les serveurs
   utilisables et les personnes qui peuvent les utiliser, car un branchement peut faire sortir des données de
   l’entreprise. Vérifiez la politique avant de connecter un compte professionnel, et considérez que ce que
   l’assistant peut atteindre est ce que la personne connectée peut atteindre.

## Teaching notes
- Analogie : un serveur local, c’est engager un assistant qui travaille chez vous, avec les clés que vous lui
  remettez. Un serveur distant, c’est utiliser un service dans ses propres bureaux : vous y apportez vos papiers, et
  leur sort dépend de ce bureau.
- Scénario à raisonner avec l’apprenant (rien à installer) : un indépendant veut qu’un assistant range des fichiers
  dans un dossier, et lise aussi le tableau de suivi de projet partagé d’un client. Demandez ce qui conviendrait à un
  serveur local et ce qui conviendrait à un serveur distant, et ce que chacun pourrait voir.
- Second scénario : un salarié connecte un serveur distant à son compte professionnel pour « gagner du temps ».
  Demandez ce qui pourrait être touché et à qui il faudrait demander d’abord.
- Idée reçue : « local veut dire privé ». Un serveur local peut quand même envoyer des données à l’extérieur si son
  code le fait.
- Idée reçue : « distant veut dire dangereux ». Un service bien exploité avec des autorisations étroites peut être plus
  sûr qu’un code inconnu ayant tous les accès à votre ordinateur.
- Ne nommez ni transports, ni fournisseurs, ni produits, et évitez les détails du protocole.
- Débutants dans le cours : idées 1 à 4 avec le scénario de l’indépendant. Apprenants expérimentés : discutez de la
  politique de l’entreprise et de la révocation des accès.
- Rythme : l’idée 4 est la plus utile en pratique : gardez-lui du temps.

## Check your understanding
1. Quelle est la principale différence entre un serveur local et un serveur distant quant à la destination de vos données ?
   Good answer: un serveur local tourne sur votre machine avec vos accès et les données y restent sauf si le code les
   envoie ; un serveur distant tourne sur le service de quelqu’un d’autre, donc les requêtes et les données voyagent
   jusqu’à lui.
2. Donnez une question de confiance pour un serveur local et une pour un serveur distant.
   Good answer: local : d’où vient le code et que peut-il faire de mes fichiers et de mes identifiants ? distant :
   comment l’exploitant traite-t-il et conserve-t-il mes données, et quels changements peut-il faire ?
3. Vous connectez un serveur de gestionnaire de tickets avec votre compte administrateur complet. Pourquoi est-ce
   un souci, et que feriez-vous à la place ?
   Good answer: le branchement agit avec vos droits, il pourrait donc lire ou modifier tout ce qu’un administrateur
   peut ; utiliser un compte ou une autorisation plus étroits ou en lecture seule, et savoir comment la révoquer.

## Completion criteria
L’apprenant peut opposer serveurs locaux et distants, dire ce que chacun implique pour les données et la confiance, et
expliquer comment des autorisations étroites et une connexion révocable limitent un branchement (vérifications 1-3).

## Going further
- La leçon « Vie privée : ce qu’il ne faut pas coller dans un chat » d’*Utiliser l’IA en toute sécurité et avec
  discernement* traite des données qui ne doivent pas quitter vos mains.
- La leçon « La configuration IA de votre équipe » d’*Assistants de code IA pour les équipes* applique la même
  prudence aux plugins et aux serveurs à l’échelle d’une équipe.
