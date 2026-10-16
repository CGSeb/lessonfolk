---
id: ai-agents-and-tools/02-tool-and-function-calling
title: L’appel d’outils et de fonctions
level: intermediate
estimatedMinutes: 15
objectives:
  - Décrire une fonction pour qu’un modèle puisse demander à l’appeler
  - Expliquer comment le code exécute l’appel demandé et renvoie le résultat
  - Valider les arguments d’un outil comme n’importe quelle entrée non fiable
prerequisites:
  - ai-agents-and-tools/01-from-chatbot-to-agent
---

## Key ideas
1. **Vous décrivez les outils ; le modèle les choisit.** Une définition d’outil comporte un nom, une
   description de ce qu’il fait et de quand l’utiliser, et ses paramètres (sous forme de **JSON Schema**,
   une façon standard de décrire la forme de données JSON : les champs, leurs types et lesquels sont
   obligatoires). Vous envoyez ces définitions avec les messages, et le modèle peut répondre par un
   **appel d’outil** au lieu de texte : le nom de l’outil plus des arguments.
2. **Le modèle demande, votre code agit.** Le modèle n’exécute jamais rien. Votre code lit l’appel
   d’outil, exécute la fonction Python correspondante et renvoie le résultat sous forme de message avec le
   rôle `tool`. Le modèle utilise alors ce résultat pour continuer.
3. **Les descriptions sont des prompts.** Le modèle choisit les outils d’après leurs noms et descriptions.
   Des noms clairs, une phrase sur le moment où utiliser l’outil et des paramètres bien décrits comptent
   autant que le code qui se trouve derrière.
4. **Validez les arguments.** Les arguments viennent du modèle, traitez-les donc comme une entrée
   d’utilisateur : vérifiez les types et les valeurs autorisées, et refusez tout ce qui est inattendu avec
   un message d’erreur clair que le modèle peut lire et corriger.
5. **Appel d’outils natif, ou repli JSON.** De nombreuses API gèrent les outils nativement (un paramètre
   `tools` dans la requête). Certains modèles, surtout les petits modèles locaux, ne le font pas. Vous
   pouvez alors décrire les outils dans le prompt système et demander au modèle de répondre avec du JSON
   comme `{"tool": "check_stock", "arguments": {...}}`, que votre code analyse et valide comme dans
   Comment fonctionnent les applications d’IA.

## Teaching notes
- La leçon ne demande aucune installation. Si l’apprenant l’essaie en code et que son modèle ne gère pas
  l’appel d’outils natif, orientez-le vers le repli JSON de l’idée 5 plutôt que de passer la leçon sur la
  configuration.
- Quand vous montrez un exemple, suivez le format courant chat-completions pour les outils (`tools`,
  `tool_calls`, `role: "tool"` avec `tool_call_id`). Si l’API de l’apprenant diffère, dites-le ; le
  concept est identique.
- Analogie qui fonctionne : **un responsable et son assistant**. Le responsable (le modèle) dit « merci de
  vérifier le stock de mugs bleus » ; l’assistant (votre code) va à l’entrepôt et fait son rapport. Le
  responsable ne touche jamais aux étagères.
- Idée reçue : « le modèle exécute mes fonctions ». Il ne produit qu’une demande ; rien ne se passe si
  votre code ne l’exécute pas (et vous décidez de ce que votre code autorise).
- Idée reçue : « si le modèle a appelé l’outil, les arguments sont valides ». Les modèles peuvent inventer
  des arguments ou des valeurs ; la validation est nécessaire (lien avec la leçon 5).
- Gardez les outils des exemples inoffensifs et locaux (une recherche dans un dictionnaire), jamais de
  vrais e-mails ou paiements.

## Check your understanding
1. Que se passe-t-il, étape par étape, quand un modèle « appelle » un outil ?
   Good answer: le modèle renvoie un appel d’outil (nom et arguments) ; le code valide et exécute la fonction ; le code renvoie le résultat sous forme de message tool ; le modèle continue avec ce résultat.
2. Pourquoi les noms et descriptions des outils comptent-ils autant ?
   Good answer: le modèle choisit les outils et remplit les arguments d’après leurs noms, descriptions et schémas de paramètres ; des descriptions floues mènent à des appels erronés ou manqués.
3. Que pouvez-vous faire si votre modèle ne gère pas l’appel d’outils natif ?
   Good answer: décrire les outils dans le prompt système et demander une réponse JSON nommant l’outil et les arguments, puis l’analyser et la valider dans le code.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait parcourir un aller-retour d’appel d’outil (natif
ou repli JSON), y compris la validation des arguments.

## Going further
- Sujet : JSON Schema, utilisé pour décrire les paramètres des outils.
- Leçon suivante : la boucle d’agent.
