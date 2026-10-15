---
id: debugging-with-ai/06-when-the-ai-is-stuck
title: Quand l’IA est bloquée ou se trompe avec assurance
level: intermediate
estimatedMinutes: 20
objectives:
  - Reconnaître les signes qu’un assistant est bloqué ou se trompe avec assurance
  - Se débloquer en réinitialisant la conversation, en ajoutant des preuves ou en restreignant le problème
  - Décider quand déboguer soi-même ou demander à une personne
prerequisites:
  - debugging-with-ai/05-verifying-the-fix
---

## Key ideas
1. **Connaissez les signes.** L’assistant est bloqué quand il **tourne en boucle** (propose une correction
   que vous avez déjà essayée), **fait des allers-retours** (annule son dernier changement, puis le
   refait), produit des changements de plus en plus gros pour un petit bug, ou accuse des choses qu’il ne
   peut pas voir (« probablement un problème de cache ») sans moyen de vérifier. Il se trompe avec assurance
   quand il invente une fonction, une option ou un réglage qui n’existe pas (des API inventées, vues dans
   Les assistants de code IA en pratique) ou affirme qu’une correction fonctionne alors que votre test dit
   le contraire.
2. **Les longues conversations s’encrassent.** Après de nombreuses tentatives ratées, le contexte est plein
   de mauvaises idées, de code écarté et d’impasses, et le modèle continue de s’en servir. Ouvrez une
   nouvelle conversation avec un résumé propre : le brief du bug, ce que vous avez écarté et les preuves
   que vous avez. Un nouveau départ vaut souvent mieux que la dixième tentative dans le même fil.
3. **Changez l’entrée, pas le volume.** Redemander plus fermement aide rarement. Donnez plutôt de nouvelles
   preuves (un journal des vraies valeurs, la version exacte de la bibliothèque, la page de documentation
   de la fonction concernée), restreignez le problème (une reproduction plus petite, une hypothèse à la
   fois) ou posez une autre question (« qu’est-ce qui devrait être vrai pour que cette sortie se
   produise ? »).
4. **Allez à la source de vérité.** Quand l’assistant et le programme ne sont pas d’accord, le programme
   gagne. Lisez la documentation officielle, le code source de la bibliothèque ou son suivi de tickets, et
   vérifiez que chaque fonction et option que l’assistant utilise existe vraiment dans votre version.
5. **Prenez le volant ou demandez à une personne.** Fixez-vous une limite, comme trois tentatives ratées ou
   une durée donnée, puis changez d’approche : déboguez vous-même avec des affichages et un débogueur,
   expliquez le problème à voix haute, ou demandez à un collègue ou à une communauté avec votre brief de
   bug. L’assistant est un partenaire ; le jugement et la décision restent les vôtres.

## Teaching notes
- Analogie qui fonctionne : **un GPS coincé dans une boucle de recalcul**. Répéter l’adresse plus fort
  n’aide pas ; vous regardez les vrais panneaux, consultez une carte ou demandez à quelqu’un du coin.
- **Le débogage du canard en plastique** : expliquer le problème pas à pas, même à un objet, révèle souvent
  la cause. Rédiger un résumé propre pour une nouvelle conversation (idée 2) a le même effet, et beaucoup
  d’apprenants trouvent le bug en l’écrivant.
- Idée reçue : « un meilleur modèle ou un plus gros y arriverait ». Parfois, mais en général la pièce
  manquante est la preuve, pas l’intelligence : aucun modèle ne peut voir une valeur que votre programme n’a
  jamais affichée.
- Idée reçue : « si je dois déboguer moi-même, l’IA m’a laissé tomber ». Les assistants ont de vrais angles
  morts (votre environnement d’exécution, vos données, votre environnement) ; savoir quand reprendre la main
  fait partie de bien les utiliser.
- Ne réenseignez pas les API hallucinées : une phrase rappelant que les assistants inventent des fonctions
  et options plausibles, puis concentrez-vous sur la façon dont cela se manifeste en débogage (une
  correction qui ne peut pas s’exécuter, un réglage qui ne fait rien). Si l’apprenant n’a pas suivi Les
  assistants de code IA en pratique, nommez ce cours comme l’endroit où approfondir.
- C’est la dernière leçon : récapitulez la méthode du cours (brief → explication → hypothèses → cause
  racine → vérification, et savoir quand reprendre la main) et célébrez. Suggérez la suite : Assistants de
  code IA pour les équipes : règles, skills et plugins (partager ces habitudes avec une équipe) et
  Construire avec l’IA (construire leurs propres fonctionnalités d’IA).

## Check your understanding
1. Donnez deux signes qu’un assistant est bloqué sur un bug.
   Good answer: deux éléments parmi répéter une correction déjà essayée, annuler puis refaire le même changement, changements de plus en plus gros pour un petit bug, accusations vagues sur des choses qu’il ne voit pas, fonctions ou réglages inventés, affirmer qu’une correction marche alors que le test échoue.
2. Après une douzaine de tentatives ratées dans une même conversation, que faites-vous, et pourquoi ?
   Good answer: ouvrir une nouvelle conversation avec un résumé propre (brief du bug, ce qui a été écarté, preuves), car le long contexte est plein de mauvaises idées et d’impasses dont le modèle continue de se servir.
3. L’assistant dit de définir une option `strict_dates=True` dans un appel de bibliothèque, mais rien ne change. Que vérifiez-vous ?
   Good answer: si cette option existe vraiment dans la version de la bibliothèque utilisée, dans la documentation officielle ou le code source ; elle peut être inventée.
4. Quand faut-il arrêter de demander à l’assistant et changer d’approche ?
   Good answer: après une limite fixée (quelques tentatives ratées ou une durée donnée), ou quand il tourne en boucle ou invente des choses ; alors déboguer soi-même, expliquer au canard en plastique, ou demander à une personne avec le brief du bug.

## Completion criteria
L’apprenant répond correctement aux vérifications, sait nommer les signes d’un assistant bloqué ou qui se
trompe avec assurance, et dispose d’une règle concrète pour savoir quand et comment changer d’approche.

## Going further
- Le débogage du canard en plastique, une technique ancienne des programmeurs.
- Assistants de code IA pour les équipes : règles, skills et plugins, pour partager les habitudes de débogage et les garde-fous avec toute votre équipe.
- Construire avec l’IA : votre première application d’IA, pour ajouter des fonctionnalités d’IA à vos propres projets.
