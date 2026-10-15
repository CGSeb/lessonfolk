---
id: prompting-basics/01-why-wording-matters
title: Pourquoi la formulation compte
level: beginner
estimatedMinutes: 15
objectives:
  - Expliquer ce qu’est un prompt
  - Transformer une demande vague en demande claire en ajoutant contexte, objectif et public
prerequisites:
  - ai-foundations/03-what-is-an-llm
---

## Key ideas
1. **Un prompt, c’est simplement le message que vous envoyez à un assistant IA.** Ce peut être une
   question, une consigne ou un texte sur lequel travailler. « Faire du prompting », c’est juste bien
   rédiger ce message.
2. **L’assistant ne sait que ce qui figure dans la conversation.** Il ne voit ni votre écran, ni votre
   situation, ni ce que vous avez en tête. Si une information compte pour la réponse et que vous ne
   l’avez pas donnée, l’assistant doit deviner — et il choisira le plus souvent l’option la plus générique.
3. **Donnez du contexte** : l’arrière-plan dont l’assistant a besoin. Qui vous êtes, dans quelle situation
   vous vous trouvez, ce que vous avez déjà essayé. « Écris un e-mail à mon propriétaire » devient
   « Écris un e-mail à mon propriétaire : le chauffage est en panne depuis une semaine et je l’ai signalé
   deux fois. »
4. **Dites votre objectif et votre public.** À quoi sert la réponse, et qui va la lire ? Un résumé pour
   votre patron, une explication pour un enfant de 10 ans et des notes pour vous-même sont trois réponses
   très différentes à la même demande.
5. **Précis vaut mieux que court.** Quelques phrases de plus de contexte, d’objectif et de public évitent
   en général plusieurs allers-retours. Un prompt clair n’a pas besoin de mots spéciaux, seulement des
   informations qu’une personne serviable vous demanderait.

## Teaching notes
- Rappelez brièvement, depuis Les bases de l’IA, que le modèle prédit un texte probable à partir de ce
  qu’on lui donne : un prompt vague donne une réponse « probable », moyenne. Une phrase suffit ; ne
  refaites pas la leçon.
- Analogie qui fonctionne : **briefer un nouveau collègue ou un inconnu** au téléphone. Il est intelligent
  mais ne sait rien de votre situation. Que devrait-il vous demander avant de vous aider ? Ces réponses
  ont leur place dans le prompt.
- Démo en direct : demandez à l’apprenant quelque chose dont il a besoin (un message, un plan, une
  explication). Répondez d’abord à une version volontairement vague, puis à une version avec contexte,
  objectif et public, et laissez-le comparer. Vous êtes l’assistant, vous pouvez donc le faire
  directement dans le chat.
- Idée reçue : « les bons prompts utilisent des mots-clés secrets ou une formule spéciale ». Non — un
  langage simple et clair fonctionne le mieux. (La leçon 5 revient sur les « phrases magiques ».)
- Idée reçue : « l’IA me connaît / se souvient de ce que je voulais dire ». Elle n’a que la conversation
  en cours (et la mémoire ou les fichiers qu’un outil donné fournit explicitement).
- Avec des apprenants qui utilisent déjà beaucoup les assistants de chat, allez plus vite et concentrez-vous
  sur l’objectif et le public, qu’ils oublient le plus souvent.
- Restez léger et pratique ; l’essentiel de la leçon doit être l’apprenant qui réécrit des prompts.

## Check your understanding
1. Pourquoi une demande vague reçoit-elle souvent une réponse générique ?
   Good answer: l’assistant ne sait que ce qui est dans la conversation, il doit donc deviner les détails manquants et retombe sur la réponse la plus courante, moyenne.
2. Réécrivez ce prompt pour le rendre plus clair : « Donne-moi des idées pour le dîner. »
   Good answer: ajoute au moins deux éléments parmi le contexte (ex. ingrédients disponibles, régime, temps), l’objectif (ex. repas rapide en semaine) et le public (ex. deux enfants qui n’aiment pas le piquant).
3. Nommez les trois éléments que cette leçon suggère d’ajouter à un prompt, et dites pourquoi le public compte.
   Good answer: contexte, objectif et public ; le public change le vocabulaire, le niveau de détail et le ton de la bonne réponse.

## Completion criteria
L’apprenant répond correctement aux vérifications et, en particulier, réécrit un prompt vague en
ajoutant au moins deux éléments parmi le contexte, l’objectif et le public.

## Going further
- Leçon suivante : donner un rôle, des exemples et un format de sortie.
