---
id: ai-safety/01-hallucinations
title: "Hallucinations : pourquoi l’IA semble sûre d’elle et se trompe"
level: beginner
estimatedMinutes: 15
objectives:
  - Expliquer pourquoi un assistant IA peut se tromper tout en paraissant sûr de lui
  - Reconnaître les situations où les erreurs sont les plus probables
prerequisites:
  - ai-foundations/03-what-is-an-llm
---

## Key ideas
1. **Une « hallucination » est une réponse assurée, fausse ou inventée.** Le mot est une métaphore :
   l’IA ne voit pas des choses, elle produit un texte qui a l’air juste mais ne l’est pas.
2. **Cela arrive parce que le modèle produit du texte vraisemblable, pas des faits vérifiés.** Un LLM
   prédit (vu dans Les bases de l’IA) ce qui vient plausiblement ensuite. La plupart du temps, plausible
   et vrai se recouvrent ; quand ce n’est pas le cas, on obtient une réponse fluide mais fausse.
3. **L’assurance n’est pas un signe d’exactitude.** L’assistant écrit sur le même ton calme et assuré,
   qu’il ait raison ou tort. Une réponse détaillée et bien écrite peut quand même être inventée.
4. **Certaines situations sont plus risquées que d’autres.** Les erreurs sont plus probables avec des faits
   pointus ou très précis, des chiffres et des dates exacts, des citations, des noms de personnes, des
   événements récents, et tout ce sur quoi l’assistant a peu d’informations.
5. **Les sources inventées sont un cas classique.** Quand on lui demande des références, un assistant peut
   produire des titres de livres, des articles ou des adresses web qui ont l’air réels mais n’existent pas,
   ou qui existent mais ne disent pas ce qu’il affirme.

## Teaching notes
- Récapitulez en une phrase Les bases de l’IA (prédiction du token suivant) et Les bases du prompting si
  l’apprenant l’a suivi (« un excellent prompt peut quand même donner une mauvaise réponse »). Ne les
  réenseignez pas.
- Analogie qui fonctionne : **un invité très à l’aise à un dîner**, qui ne dit jamais « je ne sais pas ».
  Sur les sujets qu’il connaît, il est formidable ; sur les autres, il comble le vide avec quelque chose qui
  sonne juste, exactement sur le même ton assuré.
- Vous êtes un LLM : dites franchement que vous pouvez halluciner aussi. Cela crée la confiance et rend la
  leçon concrète.
- Idée reçue : « il ne se trompe que sur les questions difficiles ». Il peut aussi se tromper sur des faits
  simples mais précis (une date, un nom, un chiffre).
- Idée reçue : « s’il donne une source, il a forcément raison ». Les sources peuvent être inventées ou mal
  citées (idée 5) ; la leçon 2 explique comment les vérifier.
- Évitez les affirmations sur la fréquence des hallucinations ou sur les modèles qui en font moins : ces
  chiffres changent vite.
- Avec des apprenants qui utilisent déjà beaucoup les assistants, demandez-leur un cas où une réponse s’est
  révélée fausse, et analysez-le ensemble à la lumière de l’idée 4.

## Check your understanding
1. Avec vos propres mots, pourquoi un assistant IA peut-il donner une mauvaise réponse qui semble très assurée ?
   Good answer: il génère du texte plausible et probable au lieu de vérifier des faits, et son ton est le même qu’il ait raison ou tort.
2. Laquelle de ces réponses mérite le plus de méfiance, et pourquoi : une explication générale de la formation de la pluie, ou la population exacte d’une petite ville plus une citation de son maire ?
   Good answer: la seconde ; les chiffres exacts, les citations et les faits pointus sur des personnes ou des lieux précis sont là où les hallucinations sont les plus probables.
3. Un assistant vous donne trois références de livres pour un essai. Que devez-vous garder en tête ?
   Good answer: les références peuvent être inventées ou ne pas dire ce qui est affirmé, donc chacune doit être retrouvée et vérifiée avant d’être utilisée.

## Completion criteria
L’apprenant répond correctement aux vérifications, en expliquant notamment que la fluidité et l’assurance
ne signifient pas l’exactitude, et nomme au moins deux situations où les erreurs sont probables.

## Going further
- Leçon suivante : comment vérifier les réponses et les sources sans y passer la journée.
