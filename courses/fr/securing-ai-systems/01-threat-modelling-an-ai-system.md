---
id: securing-ai-systems/01-threat-modelling-an-ai-system
title: Modéliser les menaces d’un système d’IA
level: advanced
estimatedMinutes: 20
objectives:
  - Identifier ce qu’un système d’IA doit protéger et qui pourrait l’attaquer
  - Repérer chaque endroit où du texte non fiable entre dans le contexte du modèle
  - Évaluer le pire cas d’un modèle trompé à partir de ce qu’il peut lire et faire
  - Classer les menaces et choisir une réponse pour chacune
prerequisites: []
---

## Key ideas
1. **Partez de ce que vous protégez, et contre qui.** Une modélisation des menaces répond à
   quatre questions : sur quoi travaillons-nous, qu’est-ce qui peut mal tourner, qu’allons-nous
   faire pour l’éviter, et avons-nous fait du bon travail. Pour un système d’IA, ce qu’il faut
   protéger, ce sont les données qu’il peut lire, les actions qu’il peut mener, l’argent (y
   compris la facture des appels au modèle), la disponibilité du service et la confiance dans le
   produit. Les attaquants ne sont pas seulement des inconnus : un utilisateur de l’application,
   quelqu’un qui ne fait que lui envoyer du contenu (un e-mail, une page web, un document), un
   outil ou un serveur compromis, et des collègues négligents comptent tous.
2. **Chaque endroit où du texte entre dans le contexte est un point d’entrée.** Dessinez le
   parcours des données dans le système et marquez où elles passent du non fiable au fiable.
   Dans un système d’IA, les points d’entrée sont nombreux : les messages de l’utilisateur, les
   documents récupérés, les résultats d’outils, les pages web, les e-mails, les fichiers
   déposés, la mémoire enregistrée, et les descriptions d’outils elles-mêmes. Le modèle les lit
   tous comme un seul flux de texte, donc chacun est un moyen de lui donner des instructions
   (l’injection de prompt, vue dans *Agents IA et outils* et *Connecter l’IA à vos outils avec
   MCP*).
3. **Le modèle est un mandataire qu’on peut abuser.** Le système confie au modèle ses propres
   accès : outils, identifiants, données. Quiconque parvient à écrire un texte que le modèle lit
   peut tenter d’emprunter ces accès. Les spécialistes de la sécurité appellent cela le problème
   du *confused deputy* (le mandataire abusé). La bonne question n’est donc pas « le modèle
   peut-il être trompé ? » (partez du principe que oui), mais « si un attaquant contrôle cette
   entrée, quel est le pire qu’il puisse faire faire au système avec tout ce qui est à portée ? ».
   Le pire cas, c’est en gros tout ce que le modèle peut lire combiné à tout ce qu’il peut faire.
4. **L’IA ajoute des menaces aux menaces classiques ; elle ne les remplace pas.** Au-delà de
   l’injection, surveillez : la fuite de données privées par les réponses ou les actions du
   modèle ; la sortie du modèle transmise sans contrôle à d’autres programmes (dans une requête
   de base de données, une page web ou une commande), ce qui transforme une injection en attaque
   classique ; un agent doté de plus d’outils ou de droits que sa tâche n’en demande ; les abus
   qui font grimper la facture ou épuisent les quotas ; et les entrées empoisonnées en amont,
   comme des modèles, des plugins ou des jeux de données altérés. L’OWASP Top 10 for LLM
   Applications est une liste de contrôle très utilisée pour ces risques. L’authentification,
   les secrets et les mises à jour comptent toujours autant.
5. **Classez, puis décidez une réponse par menace.** Notez chaque menace selon sa probabilité et
   sa gravité, et traitez le haut de la liste. Pour chacune, choisissez : *supprimer* la capacité
   (pas d’outil d’envoi du tout), la *contenir* (limites, isolement, approbation), la *détecter*
   (journaux et alertes), ou l’*accepter* en connaissance de cause en notant pourquoi. Une
   modélisation des menaces n’est jamais finie : reprenez-la chaque fois que vous ajoutez un
   outil, une source de données, un nouveau groupe d’utilisateurs ou un nouveau modèle.

## Teaching notes
- Utilisez un exemple suivi dans tout le cours : **un agent de support pour une boutique en
  ligne**. Il lit les e-mails des clients, consulte les commandes et les comptes clients, peut
  rembourser jusqu’à une certaine limite, et rédige et envoie des réponses. Il a des données
  privées, du contenu non fiable et des moyens d’agir, ce qui en fait un bon cas pour chaque
  leçon.
- Analogie qui fonctionne : **un guichetier de banque qui suit des notes écrites**. Il a accès au
  coffre et peut faire des virements. Quiconque glisse une note dans la pile sur le comptoir peut
  tenter de le faire agir pour lui. La modélisation des menaces, c’est la liste des piles, de ce
  que le guichetier peut atteindre, et des actions qui demandent la signature d’un responsable.
- Déroulez l’idée 2 avec l’agent de la boutique : demandez à l’apprenant de lister chaque point
  d’entrée. Il trouvera l’e-mail du client ; aidez-le à trouver les notes de commande écrites
  par d’autres clients, les pièces jointes, les pages produits qu’il peut consulter, sa mémoire
  enregistrée et les descriptions de ses outils.
- Puis l’idée 3 : « un e-mail de client contient des instructions cachées. Quel est le pire qui
  puisse arriver ? » Lire les données des autres clients plus envoyer des e-mails, c’est une
  fuite de données possible ; les remboursements, c’est de l’argent qui peut sortir. Cela donne
  le classement de l’idée 5.
- Idée reçue : « notre prompt système dit au modèle d’ignorer les instructions dans les e-mails,
  donc nous sommes protégés ». La leçon 2 montre pourquoi ce n’est pas une barrière. Dans une
  modélisation des menaces, une règle de prompt réduit au mieux la probabilité ; elle ne supprime
  jamais une capacité.
- Idée reçue : « la sécurité de l’IA est un domaine nouveau, la sécurité classique ne s’applique
  pas ». La plupart des incidents réels passent encore par des faiblesses classiques (clés qui
  fuient, contrôles d’accès manquants) ; l’IA ajoute un nouveau moyen de les atteindre.
- Les apprenants expérimentés connaissent peut-être STRIDE ou d’autres méthodes : n’importe
  laquelle convient, tant que les entrées du modèle sont traitées comme des points d’entrée et
  ses actions comme des capacités.
- Ne citez pas de statistiques d’incidents et ne nommez pas de fournisseurs. Ne décrivez pas de
  texte d’attaque opérationnel.
- Rythme : les idées 1 et 4 peuvent aller vite. Passez le temps sur l’agent de la boutique pour
  les idées 2, 3 et 5.

## Check your understanding
1. Listez les points d’entrée de l’agent de support de la boutique par lesquels du texte non fiable peut atteindre le modèle.
   Good answer: plusieurs parmi : les e-mails des clients et leurs pièces jointes, les notes ou messages de commande écrits par des clients, les pages web ou produits consultées, les documents récupérés, la mémoire enregistrée, les résultats d’outils et les descriptions d’outils elles-mêmes ; et la raison pour laquelle ils comptent : le modèle les lit tous comme un texte qu’il pourrait suivre.
2. Pourquoi « le modèle peut-il être trompé ? » est-elle la mauvaise question pour une modélisation des menaces, et que faut-il demander à la place ?
   Good answer: il faut partir du principe qu’il peut l’être ; la question utile est ce qu’un attaquant qui contrôle une entrée pourrait faire faire au système avec tout ce que le modèle peut lire et toutes les actions qu’il peut mener (le mandataire abusé).
3. Les réponses de l’agent sont insérées dans une page web sans aucun échappement. Pourquoi est-ce un problème de sécurité alors que le modèle « ne fait qu’écrire du texte » ?
   Good answer: la sortie du modèle peut être orientée par un attaquant, donc l’insérer sans contrôle dans une page (ou une requête, ou une commande) transforme une injection en attaque classique comme l’injection de script ; la sortie du modèle doit être traitée comme non fiable, validée ou échappée.
4. Pour la menace « un e-mail piégé fait envoyer par l’agent les données d’autres clients à une adresse extérieure », donnez un moyen de la supprimer, un de la contenir et un de la détecter.
   Good answer: supprimer, par exemple pas d’outil d’envoi libre, ou réponses uniquement à l’adresse de l’expéditeur ; contenir, par exemple l’agent ne lit que les données du client en cours, ou l’envoi demande une approbation, ou les destinataires sont restreints ; détecter, par exemple journaliser et alerter sur des destinataires ou des volumes inhabituels.

## Completion criteria
L’apprenant répond correctement aux questions, sait lister les points d’entrée d’un système
donné, énonce le pire cas à partir de ce que le modèle peut lire et faire, et attribue à une
menace une réponse parmi supprimer, contenir, détecter ou accepter (vérifications 1-4).

## Going further
- Sujets : l’OWASP Top 10 for LLM Applications, STRIDE, le problème du confused deputy.
- Leçon suivante : pourquoi l’injection de prompt n’a pas de remède complet, et ce que cela
  implique pour la conception.
