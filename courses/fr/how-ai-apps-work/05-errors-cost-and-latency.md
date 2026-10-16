---
id: how-ai-apps-work/05-errors-cost-and-latency
title: Gérer les erreurs, le coût et la latence
level: intermediate
estimatedMinutes: 20
objectives:
  - Expliquer comment les délais d’attente et les nouvelles tentatives gèrent les erreurs d’API courantes
  - Expliquer ce qui détermine le coût et le temps de réponse
  - Garder le contrôle des clés d’API et de la consommation
prerequisites:
  - how-ai-apps-work/04-conversation-memory
---

## Key ideas
1. **Les appels échouent, prévoyez-le.** Les réseaux coupent, les serveurs sont occupés, les offres
   gratuites atteignent des **limites de débit** (un plafond de requêtes ou de tokens par minute ou par
   jour), et les modèles locaux peuvent manquer de mémoire. Fixez toujours un délai d’attente, interceptez
   les erreurs et montrez à l’utilisateur un message clair au lieu de planter.
2. **Réessayez les bonnes erreurs, en attendant.** Les erreurs temporaires (délais dépassés, limites de
   débit, erreurs de serveur) valent la peine d’être retentées après une pause qui s’allonge à chaque fois
   (**backoff exponentiel** : attendre 1 s, puis 2 s, puis 4 s…), avec un nombre maximal d’essais. Les
   erreurs de votre requête (mauvaise clé, paramètres invalides) ne se règlent pas toutes seules : ne les
   réessayez pas.
3. **Les tokens déterminent le coût et le temps.** Les API hébergées facturent en général au token en
   entrée et en sortie, et chaque token prend du temps à traiter ou à générer. Les longs prompts système,
   les longs historiques et les longues réponses s’additionnent. Limitez la longueur de la réponse, réduisez
   l’historique et surveillez les chiffres de consommation que renvoie l’API.
4. **Le streaming rend l’attente plus courte.** Au lieu d’attendre la réponse complète, une API peut
   l’envoyer morceau par morceau à mesure qu’elle est générée, si bien que l’utilisateur commence à lire
   aussitôt. Le temps total est similaire ; l’expérience est bien meilleure pour les longues réponses.
5. **Protégez votre clé et votre budget.** Gardez les clés dans des variables d’environnement, jamais dans
   le code, les captures d’écran ou les dépôts ; si une clé fuit, révoquez-la et créez-en une nouvelle.
   Utilisez les plafonds de dépense ou de consommation que votre fournisseur propose, pour qu’un bug ou une
   fuite ne puisse pas faire grimper la facture.

## Teaching notes
- Ne citez jamais de prix, de limites d’offre gratuite ou de chiffres de limite de débit : ils changent
  souvent et diffèrent selon les fournisseurs. Renvoyez l’apprenant à la documentation et à la page de
  consommation de son fournisseur.
- Avec un modèle local, il n’y a pas de facture, mais les mêmes idées s’appliquent sous forme de limites
  de temps et de matériel : les longs prompts sont lents et la machine peut manquer de mémoire.
- Analogie qui fonctionne : **appeler un restaurant très demandé pour réserver une table**. Si la ligne est
  occupée, vous attendez un peu et rappelez, en attendant plus longtemps à chaque fois ; s’ils disent qu’ils
  sont fermés ce jour-là, rappeler n’aidera pas.
- Idée reçue : « réessayer immédiatement et sans cesse est le moyen le plus rapide ». Cela aggrave les
  limites de débit ; le backoff est la méthode polie et efficace.
- Idée reçue : « le streaming rend le modèle plus rapide ». Il améliore la vitesse perçue, pas la vitesse
  de génération.
- Décrivez le streaming comme un concept seulement ; la façon de le faire varie selon l’outil.
- Pour les apprenants qui ont déjà construit des services web, reliez à ce qu’ils connaissent : délais
  d’attente, nouvelles tentatives, idempotence, gestion des secrets.

## Check your understanding
1. Votre application reçoit une erreur « trop de requêtes ». Que doit-elle faire ?
   Good answer: attendre et réessayer avec un backoff exponentiel et un nombre maximal d’essais, et afficher un message clair si cela échoue encore ; ne pas réessayer immédiatement en boucle.
2. Quelles erreurs ne faut-il pas réessayer, et pourquoi ?
   Good answer: les erreurs dues à la requête elle-même, comme une clé invalide ou de mauvais paramètres, car renvoyer la même requête échouera de la même façon.
3. Citez deux moyens de réduire le coût ou le temps de réponse d’une fonctionnalité d’IA.
   Good answer: deux éléments parmi des prompts système plus courts, réduire ou résumer l’historique, limiter la longueur de la réponse, choisir un modèle plus petit, le streaming pour la vitesse perçue (temps seulement), mettre en cache les réponses répétées.
4. Vous remarquez votre clé d’API sur une capture d’écran que vous avez publiée dans un chat public. Que faites-vous, et qu’est-ce qui aurait limité les dégâts ?
   Good answer: révoquer la clé et en créer une nouvelle aussitôt ; un plafond de dépense ou de consommation chez le fournisseur limite ce qu’une clé qui fuit ou un bug peut coûter.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait décrire un appel de modèle avec un délai d’attente,
des nouvelles tentatives avec backoff pour les erreurs temporaires et un message d’erreur clair.

## Going further
- La documentation de votre fournisseur sur les limites de débit, la consommation et les plafonds de dépense.
- Leçon suivante : construire un petit chatbot.
