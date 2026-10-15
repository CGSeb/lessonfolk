---
id: build-with-ai/04-conversation-memory
title: La mémoire de conversation et les limites de contexte
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer pourquoi une API de modèle ne garde aucune mémoire entre les appels
  - Expliquer comment l’envoi de l’historique entretient une conversation
  - Nommer des moyens de rester dans la limite de la fenêtre de contexte
prerequisites:
  - build-with-ai/03-structured-output
---

## Key ideas
1. **L’API ne se souvient pas de vous.** Chaque appel est indépendant : le modèle ne voit que les messages
   de cette requête. Une application de chat donne l’impression de se souvenir parce qu’elle renvoie la
   conversation à chaque fois.
2. **Votre code garde l’historique.** Stockez la liste des messages : le prompt système, puis chaque
   message utilisateur et chaque réponse de l’assistant dans l’ordre. Ajoutez le nouveau message
   utilisateur, envoyez toute la liste, puis ajoutez la réponse.
3. **La fenêtre de contexte est la limite.** Un modèle ne peut prendre qu’un certain nombre de tokens par
   requête (sa **fenêtre de contexte**), partagé entre l’historique que vous envoyez et la réponse qu’il
   écrit. Les longues conversations finissent par ne plus tenir, et chaque token renvoyé ajoute du temps
   et, pour les modèles hébergés, du coût.
4. **Réduisez ou résumez l’historique.** Stratégies courantes : garder le prompt système plus seulement les
   N derniers messages ; ou demander au modèle de résumer les anciens messages et les remplacer par le
   résumé. Chacune perd un peu de détail, choisissez donc ce que votre application peut se permettre d’oublier.
5. **La mémoire entre sessions n’est que de la donnée que vous stockez.** Pour se souvenir d’un utilisateur
   la semaine prochaine, votre application doit enregistrer quelque chose (l’historique, un résumé, des
   préférences) et le renvoyer plus tard. Ce sont des données d’utilisateur : ne stockez que ce dont vous avez
   besoin et informez les utilisateurs.

## Teaching notes
- Analogie qui fonctionne : **un ami sans mémoire à court terme qui lit un carnet**. Avant chaque réponse,
  il relit tout le carnet de votre conversation. Vous écrivez dans le carnet ; quand il devient trop épais,
  vous arrachez les vieilles pages ou écrivez une page de résumé.
- Cela explique l’idée de Les bases de l’IA « le modèle ne voit que ce qui est dans la conversation » :
  maintenant, c’est l’apprenant qui construit la conversation.
- Ne donnez pas de tailles de fenêtre de contexte pour des modèles précis ; elles varient beaucoup et changent.
- Idée reçue : « le modèle apprend de mes conversations pendant que je lui parle ». Pendant une conversation,
  rien ne change dans le modèle ; seuls les messages envoyés changent.
- Idée reçue : « plus d’historique, c’est toujours mieux ». Les contextes très longs sont plus lents, coûtent
  plus cher et peuvent faire perdre au modèle le fil des détails.
- Avec des apprenants expérimentés, mentionnez que les applications peuvent aussi aller chercher uniquement
  les informations passées pertinentes au moment voulu (la récupération, vue dans le cours Agents IA et
  outils), sans approfondir ici.

## Check your understanding
1. Si l’API ne garde aucune mémoire, comment un chatbot se souvient-il de ce que vous avez dit trois messages plus tôt ?
   Good answer: l’application stocke la conversation et envoie l’historique complet (ou une version réduite ou résumée) à chaque requête.
2. Que se passe-t-il quand une conversation ne cesse de grandir, et pourquoi est-ce un problème ?
   Good answer: l’historique consomme plus de tokens à chaque tour, donc les requêtes deviennent plus lentes et plus coûteuses et finissent par dépasser la fenêtre de contexte.
3. Décrivez une stratégie pour garder une longue conversation dans les limites, et son inconvénient.
   Good answer: garder seulement les N derniers messages (oublie les premiers détails) ou résumer les anciens messages (perd du détail, coûte un appel de plus) ; le prompt système est toujours conservé.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait décrire une boucle qui envoie l’historique et le
garde dans une limite.

## Going further
- Sujet : les tokenizers, pour voir comment le texte est découpé en tokens.
- Leçon suivante : erreurs, coût et latence.
