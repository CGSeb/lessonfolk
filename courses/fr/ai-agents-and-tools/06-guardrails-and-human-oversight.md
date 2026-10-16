---
id: ai-agents-and-tools/06-guardrails-and-human-oversight
title: Garde-fous et supervision humaine
level: intermediate
estimatedMinutes: 15
objectives:
  - Limiter ce qu’un agent peut faire avec le moindre privilège et des budgets
  - Exiger une approbation humaine avant les actions risquées
  - Journaliser et tester un agent pour pouvoir lui faire de plus en plus confiance
prerequisites:
  - ai-agents-and-tools/05-where-agents-fail
---

## Key ideas
1. **Moindre privilège : ne donnez que les outils nécessaires.** Chaque outil est une capacité qui peut
   être mal utilisée par erreur ou par injection de prompt. Préférez les outils en lecture seule, les
   outils étroits (`get_order_status(order_id)` plutôt que « exécute n’importe quelle requête sur la base
   de données ») et les plus petites permissions et accès aux données qui font le travail.
2. **Faites respecter les règles dans le code, pas seulement dans le prompt.** Validez chaque argument,
   vérifiez que l’utilisateur a le droit d’agir sur ces données et limitez les étapes, le temps et les
   dépenses. Le prompt système guide le modèle ; votre code décide de ce qui est réellement autorisé.
3. **Un humain approuve les actions risquées.** Tout ce qui est irréversible ou tourné vers l’extérieur
   (envoyer un message, payer, supprimer, publier) doit faire une pause et montrer à une personne
   exactement ce qui va se passer, et ne s’exécuter qu’après son accord. Lire peut être automatique ; agir
   sur le monde doit être délibéré.
4. **Journalisez tout.** Gardez une trace de chaque étape : la demande, les appels d’outils, les arguments,
   les résultats et les approbations. Les journaux permettent de déboguer les échecs, d’expliquer ce qui
   s’est passé et de repérer les abus. Stockez-les avec le même soin que les autres données d’utilisateurs.
5. **Testez avant de faire confiance, puis élargissez lentement.** Construisez un petit jeu de tâches de
   test, y compris des tâches délicates et malveillantes de la leçon 5, et lancez-les après chaque
   changement. Commencez avec des limites strictes et une approbation humaine partout, et ne les assouplissez
   que là où l’agent a prouvé sa fiabilité.

## Teaching notes
- Concluez le cours et le parcours d’apprentissage : reliez les garde-fous au cours sur la sécurité
  (jugement humain, vérifier ce qui compte) et à Comment fonctionnent les applications d’IA (clés, limites, information sur les
  données). Les agents sont puissants quand ils sont bornés.
- Analogie qui fonctionne : **le badge d’accès d’un nouvel employé**. Le premier jour, il peut entrer dans
  le bâtiment mais pas dans la salle des serveurs ; les paiements demandent la signature d’un responsable ;
  tout est journalisé. L’accès grandit à mesure que la confiance se gagne.
- Si vous êtes un agent avec des outils dans ce chat, vous pouvez citer vos propres demandes d’approbation
  comme exemple réel de supervision humaine (seulement si c’est vrai dans l’outil de l’apprenant).
- Idée reçue : « un prompt système strict est un garde-fou suffisant ». Les prompts peuvent être
  contournés ; les limites et approbations au niveau du code ne peuvent pas l’être par la parole.
- Idée reçue : « demander l’approbation à chaque fois rend les agents inutiles ». N’approuvez que les
  actions risquées ; laissez les étapes en lecture seule s’exécuter librement.
- Ne donnez pas de conseils juridiques ou de conformité ; mentionnez que certains domaines ont des règles
  sur les décisions automatisées et les données, qui diffèrent selon les pays.

## Check your understanding
1. Vous construisez un agent qui aide des clients avec leurs commandes. Quels outils lui donneriez-vous, et lesquels demanderaient une approbation humaine ?
   Good answer: des outils étroits, surtout en lecture seule, comme la consultation du statut d’une commande ou du stock s’exécutent librement ; des actions comme remboursements, annulations ou envoi de messages demandent une approbation humaine explicite ; aucun outil large comme l’accès brut à la base de données.
2. Pourquoi les limites et la validation doivent-elles résider dans le code plutôt que seulement dans le prompt système ?
   Good answer: le modèle peut ignorer les instructions du prompt ou être manipulé pour s’en écarter (par ex. injection de prompt), alors que les contrôles du code sont appliqués à chaque fois.
3. Que doivent contenir les journaux d’un agent, et pourquoi les garder ?
   Good answer: la demande de chaque étape, les appels d’outils, les arguments, les résultats et les approbations ; pour déboguer les échecs, expliquer ce qui s’est passé et détecter les usages abusifs, en les stockant avec soin comme des données d’utilisateurs.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait décrire un agent avec au moins une action
soumise à approbation, une validation des arguments, une limite d’étapes et un journal.

## Going further
- Sujets : évaluer les agents avec des suites de tests, isoler les outils dans un bac à sable, systèmes de permissions.
- Demandez au tuteur de vous « interroger » sur le cours sur les agents, ou revoyez Utiliser l’IA en toute sécurité et avec discernement.
