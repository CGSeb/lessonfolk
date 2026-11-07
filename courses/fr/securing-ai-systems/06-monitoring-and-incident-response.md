---
id: securing-ai-systems/06-monitoring-and-incident-response
title: Surveillance et réponse aux incidents
level: advanced
estimatedMinutes: 15
objectives:
  - Choisir quoi journaliser et quels signaux surveiller dans un système d’IA
  - Préparer les commandes d’urgence avant d’en avoir besoin
  - Ordonner les étapes de la réponse quand un incident se produit
prerequisites:
  - securing-ai-systems/05-red-teaming-your-own-system
---

## Key ideas
1. **Journalisez ce qu’il faut pour reconstituer un incident.** Pour chaque exécution : qui elle
   servait, d’où venait chaque contenu, chaque appel d’outil avec ses arguments et son résultat,
   les approbations, et les versions du modèle, du prompt et des outils. Les journaux des
   garde-fous d’*Agents IA et outils* deviennent ici vos preuves. Ils contiennent des données
   privées : protégez-les, limitez qui les lit et supprimez-les selon un calendrier.
2. **Surveillez des motifs, pas seulement des erreurs.** Signaux utiles : des enchaînements
   d’actions inhabituels (lire beaucoup de fiches, puis envoyer quelque chose à l’extérieur) ; un
   nouveau destinataire ou domaine ; des pics d’appels, de tokens ou de coût ; des actions
   bloquées ou des injections signalées à répétition depuis une même source ; et des valeurs
   *canari* (des fiches fictives uniques ou des marqueurs placés dans les données) qui ne
   devraient jamais apparaître dans une sortie. Un signal isolé prouve rarement quelque chose ;
   les combinaisons méritent une alerte.
3. **Préparez les commandes d’urgence à l’avance.** Pendant un incident, vous n’aurez pas le temps
   de les construire. Prévoyez un interrupteur pour désactiver un outil ou l’agent entier, un
   mode lecture seule, un moyen de révoquer et de renouveler les identifiants qu’il utilise, et un
   moyen de revenir à une version précédente du prompt, du modèle ou de la configuration (ce qui
   suppose de les versionner).
4. **Quand cela arrive : contenir, préserver, évaluer, corriger, apprendre.** D’abord arrêter les
   dégâts (désactiver l’outil, révoquer les accès). Conserver les preuves avant tout nettoyage.
   Établir quelles données et quelles actions sont touchées, et qui est concerné. Respecter vos
   obligations légales et contractuelles d’information, qui varient selon le pays et le secteur.
   Corriger la cause profonde dans la conception, ajouter l’attaque aux tests de régression et
   mettre à jour la modélisation des menaces. Puis écrire ce qui s’est passé, sans chercher de
   coupable, pour que le prochain incident soit traité plus vite.

## Teaching notes
- Analogie qui fonctionne : **l’alarme et les procédures incendie d’un magasin**. Les caméras
  enregistrent (journaux), les capteurs guettent les situations anormales (signaux), les
  extincteurs sont près de la porte avant tout incendie (commandes d’urgence), et chacun connaît
  l’ordre : faire sortir les gens, appeler les secours, puis enquêter.
- Demandez à l’apprenant de préparer la trousse d’urgence de l’agent de la boutique : quels
  interrupteurs, quels identifiants renouveler, quels signaux réveilleraient quelqu’un la nuit.
- Scénario pour l’idée 4 : un client signale avoir reçu les détails de commande d’un autre
  client. Parcourez les étapes avec l’apprenant, dans l’ordre.
- Idée reçue : « tout journaliser est toujours plus sûr ». Les journaux sont des copies de
  données privées et une cible en eux-mêmes ; journalisez ce dont vous avez besoin, protégez-le
  et supprimez-le à temps.
- Idée reçue : « si aucune alerte ne s’est déclenchée, il ne s’est rien passé ». La surveillance
  attrape ce à quoi vous avez pensé ; le red teaming (leçon 5) et les signalements des
  utilisateurs trouvent le reste.
- Ne donnez pas de conseil juridique sur les obligations de notification : dites qu’elles
  existent, qu’elles dépendent du pays et du secteur, et qu’elles se vérifient avec les
  personnes responsables.
- Cette leçon clôt le cours : reliez les étapes à la modélisation des menaces (1), au
  confinement (4) et aux tests de régression (5) en une phrase.
- Rythme : leçon courte ; gardez du temps pour le scénario.

## Check your understanding
1. Quelle combinaison de signaux suggérerait que la lethal trifecta est en train d’être exploitée dans l’agent de la boutique ?
   Good answer: quelque chose comme un e-mail non fiable suivi de lectures de nombreuses fiches clients ou de fiches sans rapport, puis une action sortante vers un nouveau destinataire ou domaine ; ou une fiche canari qui apparaît dans une sortie.
2. Nommez trois commandes d’urgence que vous prépareriez pour l’agent de la boutique avant le lancement.
   Good answer: trois parmi : un interrupteur pour désactiver l’outil d’envoi ou de remboursement, un interrupteur pour arrêter l’agent, un mode lecture seule, la révocation et le renouvellement de ses identifiants, le retour à une version précédente du prompt, du modèle ou de la configuration.
3. Un client signale avoir reçu les détails de commande d’un autre client. Mettez les étapes de la réponse dans l’ordre.
   Good answer: contenir d’abord (désactiver l’envoi ou l’agent), préserver les journaux et les preuves, évaluer quelles données et quels clients sont touchés, respecter les obligations d’information, corriger la cause profonde dans la conception, ajouter un test de régression et mettre à jour la modélisation des menaces, puis analyser ce qui s’est passé.

## Completion criteria
L’apprenant répond correctement aux questions, nomme des signaux utiles et des commandes
d’urgence pour un système donné, et ordonne les étapes d’une réponse à incident en commençant
par contenir (vérifications 1-3).

## Going further
- Sujets : les canary tokens, les procédures de réponse aux incidents, les analyses
  post-incident sans recherche de coupable.
- Demandez au tuteur de « m’interroger » sur ce cours pour revoir la modélisation des menaces et
  le confinement.
