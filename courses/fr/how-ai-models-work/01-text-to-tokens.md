---
id: how-ai-models-work/01-text-to-tokens
title: Du texte aux tokens
level: intermediate
estimatedMinutes: 15
objectives:
  - Expliquer ce qu’est un token et pourquoi un modèle lit des tokens, pas des lettres ni des mots
  - Utiliser les tokens pour expliquer des comportements étranges, comme se tromper en comptant des lettres
  - Relier les tokens à la fenêtre de contexte et à la taille d’une requête
prerequisites:
  - ai-foundations/03-what-is-an-llm
---

## Key ideas
1. **Un modèle ne voit jamais votre texte comme des lettres ou des mots. Il voit des tokens.**
   Un token est un morceau de texte pris dans une liste fixe, définie à la construction du
   modèle. Les mots courants sont souvent un seul token (« maison »), les mots plus rares
   sont découpés en plusieurs (« incroyablement » pourrait donner « in », « croy », « ablement »),
   et les espaces, la ponctuation et les émojis comptent aussi.
2. **Pour le modèle, chaque token n’est qu’un nombre.** Avant que le modèle ne fasse quoi que
   ce soit, un programme simple (le *tokenizer*) transforme votre texte en une liste de
   numéros de tokens. Le modèle prédit le numéro suivant, et le tokenizer retransforme la
   réponse en texte. Le modèle ne « lit » pas au sens humain.
3. **Cela explique certaines bizarreries célèbres.** Si vous lui demandez combien de fois une
   lettre apparaît dans un mot, un modèle peut se tromper : le mot lui est arrivé en un ou
   deux tokens, avec les lettres cachées à l’intérieur. Il en va de même pour inverser des
   mots, trouver des rimes ou compter exactement des caractères, et pour les longs nombres,
   souvent coupés en morceaux inégaux.
4. **Les tokens sont l’unité de taille.** En anglais, une règle approximative veut qu’un token
   fasse environ les trois quarts d’un mot. Le même texte dans d’autres langues demande
   en général plus de tokens, car les listes de tokens sont construites surtout à partir des
   langues qui dominent le texte d’entraînement. Le code et les mises en forme inhabituelles
   en coûtent aussi davantage.
5. **La fenêtre de contexte se compte en tokens.** La quantité de texte qu’un modèle peut
   traiter d’un coup (vos messages, ses réponses, les documents collés) est limitée en tokens,
   pas en pages. Les services facturent d’ailleurs généralement à l’usage en tokens. C’est
   pourquoi une longue conversation peut « oublier » son début, et pourquoi une courte
   question dans une langue peut coûter plus cher que dans une autre.

## Teaching notes
- Analogie : les tokens sont des briques de Lego prises dans une boîte fixe. Les formes
  courantes viennent en une grosse brique, les choses inhabituelles se construisent avec de
  petites. Le modèle ne manipule que des briques, jamais le « dessin » des lettres dessus.
- Démonstration : demandez à l’apprenant de compter à voix haute les lettres d’un mot long,
  puis demandez-lui comment un modèle qui ne voit que deux briques-nombres pourrait le faire.
  Si l’apprenant a accès à une page de démonstration de tokenizer d’un fournisseur de modèles,
  il peut y coller une phrase et voir les morceaux ; ne l’exigez pas.
- Idée reçue : « le modèle ne sait pas compter les lettres, il doit donc être bête ». C’est une
  limite de la forme de l’entrée, pas de sa capacité générale. Les assistants récents réussissent
  souvent ces tâches en épelant le mot étape par étape ou en utilisant un outil, ce qui est
  déjà une bonne leçon.
- Idée reçue : tokens égale mots. Gardez le chiffre « environ les trois quarts d’un mot »
  clairement présenté comme une moyenne approximative pour l’anglais.
- Ne donnez pas de nombres exacts de tokens pour tel ou tel modèle ni de prix exacts : ils changent.
- Un apprenant arrivé ici après le test de niveau peut avoir oublié la prédiction du token
  suivant : rappelez-la en une phrase (traitée dans Les bases de l’IA) avant de commencer.
- Rythme : les idées 1-2 vont vite ; consacrez le temps à la 3 (c’est le moment « ah ! ») et à
  l’application des idées 4-5.

## Check your understanding
1. Avec vos mots, qu’est-ce qu’un token, et pourquoi un modèle travaille-t-il avec des tokens
   plutôt qu’avec des lettres ?
   Good answer: un token est un morceau de texte (un mot, une partie de mot, de la ponctuation)
   pris dans une liste fixe et transformé en nombre ; les modèles travaillent sur ces nombres,
   donc les lettres à l’intérieur d’un token ne leur sont pas directement visibles.
2. Un ami dit : « Cette IA n’est même pas capable de compter les r de “strawberry”, elle n’est
   donc pas intelligente. » Que lui répondriez-vous ?
   Good answer: le modèle voit quelques tokens, pas des lettres isolées, donc compter des lettres
   est délicat pour lui ; c’est une limite de la façon dont le texte est fourni, pas une preuve
   sur sa capacité générale, et lui demander d’épeler le mot aide.
3. Vous collez un long rapport dans votre langue et l’assistant dit qu’il n’a plus de place,
   alors que le texte vous paraît court. Donnez deux raisons possibles.
   Good answer: la fenêtre de contexte se compte en tokens, pas en pages ; certaines langues,
   le code ou une mise en forme inhabituelle utilisent plus de tokens par mot ; la conversation
   déjà écrite et la réponse prennent aussi de la place.

## Completion criteria
L’apprenant peut expliquer ce qu’est un token, s’en servir pour expliquer pourquoi un modèle se
trompe en comptant des lettres, et dire pourquoi les limites de contexte et les coûts se
mesurent en tokens (vérifications 1-3).

## Going further
- La leçon « La mémoire de conversation et les limites de contexte » de *Construire avec l’IA*
  montre comment les développeurs gèrent le budget de tokens.
- Cherchez une page de démonstration de « tokenizer » chez un fournisseur de modèles pour voir
  votre propre texte découpé en tokens.
