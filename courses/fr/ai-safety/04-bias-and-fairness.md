---
id: ai-safety/04-bias-and-fairness
title: Biais et équité
level: beginner
estimatedMinutes: 15
objectives:
  - Expliquer d’où vient le biais dans l’IA
  - Reconnaître le biais dans les réponses de l’IA
  - En réduire l’effet quand on utilise l’IA
prerequisites:
  - ai-safety/03-privacy
---

## Key ideas
1. **Le biais désigne ici une pente systématique.** Une IA est biaisée quand ses réponses penchent
   injustement du même côté, encore et encore : favoriser certains groupes, opinions ou lieux plutôt que
   d’autres, ou reprendre des stéréotypes.
2. **Il vient des données et des choix qui sont derrière le modèle.** Les modèles apprennent à partir de
   textes et d’images créés par des personnes, et ces données contiennent des stéréotypes, des déséquilibres
   et des lacunes (certaines langues, pays et groupes sont beaucoup moins représentés). Les personnes qui
   construisent le modèle font aussi des choix qui façonnent son comportement. Le modèle capte des
   régularités, y compris injustes.
3. **Il se cache souvent dans les hypothèses par défaut.** Demandez une histoire avec un médecin et une
   infirmière, et observez qui est supposé être un homme ou une femme. Demandez « une famille typique » ou
   « une tenue professionnelle » et observez quelle culture sert de référence. Personne n’a demandé un
   stéréotype ; le modèle a comblé le vide avec le motif le plus courant.
4. **Il compte surtout quand des décisions touchent des personnes.** Une suggestion de vacances biaisée est
   mineure. Utiliser l’IA pour trier des candidatures, juger des prêts ou évaluer des personnes peut
   transformer le biais en tort réel, à grande échelle. Ces usages demandent un jugement humain et une
   vérification soigneuse.
5. **Vous pouvez en réduire l’effet.** Repérez les valeurs par défaut, demandez d’autres points de vue
   (« à quoi cela ressemblerait-il dans un autre pays / pour un autre groupe ? »), donnez les détails que
   vous voulez vraiment au lieu de laisser le modèle supposer, et gardez un humain aux commandes des
   décisions concernant des personnes.

## Teaching notes
- Analogie qui fonctionne : **un miroir déformant qui exagère**. Le modèle reflète les données dont il a
  appris, avec leurs déséquilibres, et peut faire paraître les motifs les plus courants encore plus
  « normaux » qu’ils ne le sont.
- Démo : générez dans le chat une courte scène avec quelques professionnels sans nom et examinez ensemble
  les hypothèses. Vous pouvez écrire une réponse équilibrée ; dans ce cas, discutez de la raison pour
  laquelle les modèles peuvent quand même s’appuyer sur des valeurs par défaut, et du fait que les
  développeurs cherchent à réduire le biais sans pouvoir l’éliminer complètement.
- Restez factuel et apolitique : la leçon porte sur le repérage de motifs et l’équité envers les personnes,
  pas sur la prise de position dans des débats.
- Idée reçue : « les ordinateurs sont neutres, donc l’IA est objective ». L’IA apprend à partir de données
  et de choix humains ; elle n’est pas neutre automatiquement.
- Idée reçue : « le biais a été corrigé ». Les développeurs travaillent à le réduire, mais il peut encore
  apparaître, de façon évidente ou subtile. N’affirmez pas qu’un modèle est ou n’est pas biaisé.
- Avec des apprenants expérimentés, discutez du problème des lacunes (idée 2) : les langues ou régions
  moins représentées reçoivent souvent des réponses plus faibles ou plus génériques.
- Rythme : les idées 3 et 5 forment le cœur pratique ; prenez le temps de donner des exemples concrets.

## Check your understanding
1. D’où vient le biais dans un modèle d’IA ?
   Good answer: principalement des données créées par des humains dont il a appris (stéréotypes, déséquilibres, lacunes), plus les choix faits par les personnes qui le construisent.
2. Donnez un exemple de la façon dont le biais peut apparaître dans une réponse d’IA même si personne ne l’a demandé.
   Good answer: une hypothèse par défaut, par ex. attribuer des genres à des métiers, prendre une culture ou un pays pour « la norme », ou donner de moins bonnes réponses pour des langues ou groupes moins représentés.
3. Une entreprise veut utiliser l’IA pour rejeter automatiquement des candidatures. Quelle inquiétude soulèveriez-vous, et que suggéreriez-vous ?
   Good answer: l’IA peut reproduire les biais de ses données et rejeter injustement certains groupes, à grande échelle ; les décisions concernant des personnes demandent une relecture humaine et la recherche de schémas injustes.

## Completion criteria
L’apprenant répond correctement aux vérifications, en expliquant notamment que le biais vient des données
et des choix humains et que les décisions concernant des personnes demandent une supervision humaine.

## Going further
- Leçon suivante : droit d’auteur, attribution et usage honnête du contenu créé par l’IA.
