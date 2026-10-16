---
id: how-ai-apps-work/03-structured-output
title: La sortie structurée (JSON)
level: intermediate
estimatedMinutes: 15
objectives:
  - Demander à un modèle du JSON avec une forme claire
  - Expliquer comment le code analyse et valide la sortie
  - Dire ce que le code doit faire d’une sortie invalide
prerequisites:
  - how-ai-apps-work/02-system-prompts
---

## Key ideas
1. **Les applications ont besoin de données, pas de prose.** Pour utiliser la réponse d’un modèle dans du
   code (la stocker, l’afficher dans un formulaire, prendre une décision), il faut une structure
   prévisible. Le **JSON** (un format texte courant pour les données, avec des clés et des valeurs) est
   le choix habituel.
2. **Décrivez la forme et montrez un exemple.** Dites exactement quels champs vous voulez, leurs types et
   les valeurs autorisées, et donnez un exemple de réponse valide. Demandez du JSON seul, sans explication
   autour.
3. **Analysez et validez toujours.** Le modèle génère du texte qui correspond en général, pas des données
   garanties. Analysez-le avec une bibliothèque JSON, puis vérifiez que les champs obligatoires existent et
   que les valeurs ont du sens avant de les utiliser.
4. **Prévoyez l’échec.** Si l’analyse ou la validation échoue, réessayez une fois avec le message d’erreur
   (« Ta réponse n’était pas du JSON valide : … Réponds à nouveau avec du JSON seul »), et si cela échoue
   encore, repliez-vous sur quelque chose de sûr (un message d’erreur, une valeur par défaut, un humain).
5. **Certaines API peuvent imposer la structure.** De nombreux fournisseurs et outils locaux proposent un
   mode JSON ou permettent de passer un schéma que la sortie doit respecter. Cela réduit beaucoup les
   erreurs, mais continuez à valider : la structure peut être bonne alors que le contenu reste faux.

## Teaching notes
- Analogie qui fonctionne : **un formulaire plutôt qu’une lettre**. Demandez à quelqu’un de vous écrire une
  lettre sur ses vacances et chaque lettre est différente ; donnez-lui un formulaire avec des cases et vous
  pouvez mettre les réponses directement dans un tableur.
- Démo : dans ce chat, produisez une réponse JSON pour une petite tâche d’extraction (ex. extraire nom, date
  et montant d’une phrase de facture), puis montrez une version légèrement abîmée (du texte avant le JSON,
  un champ manquant) et demandez à l’apprenant comment son code devrait réagir.
- Ne nommez pas de paramètres propres à un fournisseur pour le JSON ou les modes à schéma ; dites à
  l’apprenant de chercher « mode JSON » ou « sortie structurée » dans la documentation de son outil.
- Idée reçue : « si je demande du JSON, j’obtiens du JSON ». En général, pas toujours ; les petits modèles
  locaux surtout peuvent ajouter du texte ou casser le format. La validation n’est pas facultative.
- Idée reçue : « un JSON valide veut dire une réponse correcte ». Le format peut être parfait alors qu’une
  valeur est inventée ou fausse (faites le lien avec les hallucinations).
- Pour les développeurs expérimentés, mentionnez les bibliothèques de validation (ex. validateurs de
  schémas) comme sujets, sans en promouvoir une en particulier.

## Check your understanding
1. Pourquoi les applications ont-elles généralement besoin d’une sortie structurée d’un modèle ?
   Good answer: le code a besoin de données prévisibles (champs et valeurs) à stocker, afficher ou exploiter, ce que la prose libre ne fournit pas.
2. Votre code demande du JSON et le modèle renvoie « Voici le JSON : {...} ». Que doit faire votre code ?
   Good answer: échouer proprement à l’analyse (ou extraire la partie JSON), puis réessayer avec une consigne claire ou se replier, plutôt que de planter ou de lui faire une confiance aveugle.
3. Un mode JSON garantit du JSON valide. Les données sont-elles alors fiables ?
   Good answer: non ; la structure est valide mais les valeurs peuvent rester fausses ou inventées, donc le contenu doit encore être validé et vérifié là où cela compte.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait décrire comment le code analyse et valide la
sortie d’un modèle, avec une nouvelle tentative ou un repli pour les réponses invalides.

## Going further
- Sujet : JSON Schema, une façon standard de décrire la forme de données JSON.
- Leçon suivante : la mémoire de conversation et les limites de contexte.
