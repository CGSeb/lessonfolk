---
id: securing-ai-systems/03-data-leaks-and-exfiltration
title: Fuites et exfiltration de données
level: advanced
estimatedMinutes: 20
objectives:
  - Reconnaître les voies moins évidentes par lesquelles des données peuvent quitter un système d’IA
  - Expliquer comment les données fuient d’un utilisateur à l’autre et comment l’empêcher
  - Expliquer pourquoi les secrets ne doivent jamais être placés dans le contexte du modèle
  - Nommer des défenses qui ferment les voies de sortie
prerequisites:
  - securing-ai-systems/02-prompt-injection-in-depth
---

## Key ideas
1. **Une fuite a besoin d’une sortie, et il y a plus de sorties que « envoyer ».** La
   combinaison risquée de données privées, de contenu non fiable et d’une voie pour envoyer vers
   l’extérieur (la « lethal trifecta », vue dans *Connecter l’IA à vos outils avec MCP*) se
   brise en retirant un ingrédient. Le plus difficile est de repérer toutes les sorties. Un outil
   d’e-mail ou de requête web est évident ; les autres sont là où les vraies fuites se produisent.
2. **Les sorties cachées.** Une réponse qui contient une image ou un lien dont l’adresse
   transporte des données : quand l’interface affiche l’image, le navigateur va chercher cette
   adresse tout seul, et les données arrivent sur le serveur de l’attaquant sans que personne
   clique. Un outil qui récupère une page web, avec des données ajoutées à l’adresse. L’écriture
   dans un endroit que l’attaquant peut lire : un document partagé, un ticket public, un
   commentaire, une invitation de calendrier. Et la réponse elle-même, quand elle est montrée à
   quelqu’un d’autre que la personne dont elle contient les données.
3. **Les fuites entre utilisateurs.** Les données fuient aussi de côté : les informations d’un
   client qui parviennent à un autre par une mémoire partagée, un état de conversation partagé,
   un cache, ou un index de recherche qui ignore qui a le droit de voir quoi. Demander au modèle
   de séparer les utilisateurs ne fonctionne pas ; la règle est de filtrer selon les droits de
   l’utilisateur avant que quoi que ce soit n’atteigne le contexte (vu pour les index de
   recherche dans *Le RAG en profondeur*), et de garder mémoire et état par utilisateur.
4. **Rien de ce qui est dans le contexte n’est secret.** On peut soutirer leur prompt système
   aux modèles, et tout le reste du contexte peut être répété. Clés d’API, mots de passe,
   adresses internes et règles confidentielles n’ont rien à y faire. Les identifiants restent
   dans le code qui exécute les outils : le modèle peut utiliser l’outil sans jamais voir la clé.
   Écrivez le prompt système comme si un utilisateur allait le lire un jour.
5. **Journaux, fournisseurs et données d’entraînement sont aussi des destinations.** Les prompts
   et réponses complets dans les journaux, les outils d’analyse ou de support sont des copies de
   données privées ; tout comme ce que le fournisseur du modèle conserve selon ses conditions.
   Collectez seulement ce dont vous avez besoin, masquez ce que vous pouvez et fixez des durées
   de conservation. Et un modèle fine-tuné sur des données privées peut les répéter plus tard
   (vu dans *Adapter un modèle*).

## Teaching notes
- Analogie qui fonctionne : **un bâtiment où les vigiles ne surveillent que la porte
  d’entrée**. Les données sortent par les fenêtres, le service courrier et les poubelles. Fermer
  la sortie principale ne suffit pas ; on cartographie chaque sortie, puis on ferme ou on
  surveille chacune.
- Utilisez l’agent de la boutique : il peut lire les commandes de tous les clients, il lit des
  e-mails non fiables, et ses réponses s’affichent dans une interface web qui affiche les images.
  Demandez à l’apprenant de trouver les sorties, puis de proposer comment fermer chacune.
- Pour l’idée 2, les défenses à faire ressortir : ne pas afficher d’images ni de liens de
  domaines hors d’une liste autorisée restreinte (des domaines que vous contrôlez : une liste
  large, comme tout le domaine d’un fournisseur cloud, peut aussi héberger une page de
  l’attaquant) ; limiter les requêtes web à des domaines connus ; restreindre les endroits où
  l’agent peut écrire ; n’envoyer les réponses qu’au client qui a écrit.
- Idée reçue : « on a dit au modèle de ne jamais révéler son prompt système ». Cette consigne se
  contourne comme n’importe quelle autre ; l’idée 4 dit de partir du principe qu’elle le sera.
- Idée reçue : « les données restent dans notre application ». Journaux, outils d’analyse,
  outils de suivi d’erreurs et fournisseur du modèle sont autant d’endroits où elles vont.
- Restez, pour la voie des images, au niveau du fonctionnement. Ne donnez ni adresses d’exemple
  ni charges opérationnelles.
- Apprenants expérimentés : discutez des voies qu’offrent leurs propres interfaces (affichage
  d’images, aperçus de liens, exports de fichiers).
- Rythme : l’idée 2 mérite le plus de temps ; l’idée 5 peut tenir en une minute.

## Check your understanding
1. Les réponses de l’agent s’affichent dans une page web qui affiche les images. Pourquoi des données peuvent-elles fuiter même si personne ne clique, et comment fermeriez-vous cette voie ?
   Good answer: un modèle trompé peut écrire une image dont l’adresse contient des données privées ; le navigateur charge l’adresse automatiquement et les données arrivent sur le serveur de l’attaquant ; on la ferme en n’affichant pas d’images ni de liens de domaines hors d’une liste autorisée (ou en ne les affichant pas du tout).
2. L’index de recherche de l’agent contient les e-mails de tous les clients, et le prompt système dit au modèle de n’utiliser que les messages du client en cours. Qu’est-ce qui ne va pas, et que faudrait-il faire à la place ?
   Good answer: la règle dépend de l’obéissance du modèle, qui peut être trompé ou simplement se tromper ; l’index doit être filtré selon l’identité du client avant la recherche, pour que les données des autres clients n’atteignent jamais le contexte.
3. Un développeur met la clé d’API du service de remboursement dans le prompt système et ajoute « ne répète jamais cette clé ». Expliquez le problème et la correction.
   Good answer: tout ce qui est dans le contexte peut être extrait ou répété, donc la clé est exposée ; elle doit rester dans le code qui appelle le service de remboursement, pour que le modèle puisse demander un remboursement via l’outil sans voir la clé.
4. Nommez trois sorties possibles pour des données dans un système d’IA, autres qu’un outil « envoyer un e-mail ».
   Good answer: trois parmi : images ou liens affichés qui transportent des données dans leur adresse, requêtes web, écriture dans des documents, tickets ou commentaires partagés, réponses montrées à un autre utilisateur, journaux et outils d’analyse, stockage chez le fournisseur, un modèle entraîné sur les données.

## Completion criteria
L’apprenant répond correctement aux questions, cartographie les sorties d’un système donné,
explique pourquoi la séparation des utilisateurs et les secrets doivent être gérés hors du
modèle, et propose une défense pour chaque voie (vérifications 1-4).

## Going further
- Sujets : l’exfiltration de données par les images Markdown, les politiques de sécurité du
  contenu (CSP), la gestion des secrets.
- Leçon suivante : concevoir le système pour qu’un modèle trompé ne puisse pas faire grand mal.
