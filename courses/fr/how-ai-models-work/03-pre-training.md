---
id: how-ai-models-work/03-pre-training
title: "Le pré-entraînement : apprendre à partir d’une montagne de texte"
level: intermediate
estimatedMinutes: 15
objectives:
  - Décrire comment fonctionne le pré-entraînement et ce que le modèle finit par savoir
  - Expliquer la date limite des connaissances et pourquoi les hallucinations découlent de la façon dont le savoir est stocké
  - Dire pourquoi l’échelle compte et pourquoi l’entraînement se fait rarement
prerequisites:
  - how-ai-models-work/02-embeddings-meaning-as-numbers
---

## Key ideas
1. **Le pré-entraînement est un immense jeu de texte à trous.** On montre au modèle un texte
   dont le token suivant est caché, et on lui demande de le deviner. Au début, il devine très
   mal. À chaque essai, les nombreux nombres ajustables qu’il contient (ses *paramètres*) sont
   légèrement modifiés pour que la bonne réponse devienne plus probable. On répète sur une
   quantité énorme de texte : livres, sites web, code et plus encore.
2. **Personne n’écrit le savoir dedans.** La grammaire, les faits, les styles et les habitudes
   de raisonnement sont tous des sous-produits du fait de mieux jouer à ce seul jeu. Pour
   prédire la fin d’une phrase sur une capitale, il est utile d’avoir retenu quelle ville
   est la capitale.
3. **Ce qui est appris est compressé et flou, ce n’est pas une base de données.** Le modèle
   garde des régularités, pas une copie de ses sources. Les faits très présents dans les
   textes sont en général fiables, les faits rares ou obscurs sont flous. Quand le modèle comble
   un trou avec quelque chose de plausible au lieu de dire « je ne sais pas », vous obtenez une
   hallucination (traité dans *Utiliser l’IA en toute sécurité et avec discernement*).
4. **L’entraînement s’arrête à une date.** Tout ce qui suit la *date limite des connaissances*
   est inconnu du modèle, sauf si un outil comme la recherche web ou un document collé le lui
   fournit. Le modèle ne sait d’ailleurs souvent pas précisément où se situe sa propre date limite.
5. **L’échelle compte.** En général, plus de paramètres, plus de texte de meilleure qualité et
   plus de puissance de calcul donnent un modèle plus capable, jusqu’à un certain point. Le
   pré-entraînement demande énormément de calcul : il est donc rare et réservé à peu
   d’organisations. Tous les autres réutilisent le résultat.
6. **Le résultat est un modèle de base, pas un assistant.** Il prolonge n’importe quel texte,
   comme une très bonne saisie semi-automatique : donnez-lui une question, il peut continuer
   avec d’autres questions. En faire quelque chose avec qui on discute est l’objet de la leçon suivante.

## Teaching notes
- Analogie : quelqu’un qui a lu une bibliothèque géante une seule fois, vite, et en a gardé
  l’essentiel mais pas les numéros de page. Demandez-lui un fait célèbre, il répond bien ;
  demandez-lui une citation exacte de la page 212, il peut en inventer une qui sonne juste.
- Idée reçue : « le modèle stocke tout internet et va y chercher ». Il ne sait pas citer la
  plupart de ses sources, et le modèle est bien plus petit que le texte qu’il a vu.
- Idée reçue : « il apprend de mes conversations pendant qu’on discute ». Le pré-entraînement
  est terminé ; pendant une conversation, les nombres du modèle ne changent pas. Savoir si un
  fournisseur réutilise les conversations pour un entraînement ultérieur est une autre question,
  de vie privée (voir *Utiliser l’IA en toute sécurité et avec discernement*).
- N’avancez ni tailles, ni volumes de données, ni coûts, ni dates : ils vieillissent vite.
- Débutants : restez sur les idées 1, 3 et 4. Les apprenants expérimentés peuvent discuter de
  pourquoi l’échelle aide et du rôle de la qualité des données.
- Rythme : l’idée 3 rejoint les hallucinations que l’apprenant a déjà rencontrées ; appuyez-vous
  sur son expérience s’il en a une.

## Check your understanding
1. Quelle tâche un modèle pratique-t-il pendant le pré-entraînement, et comment s’améliore-t-il ?
   Good answer: il devine des tokens suivants cachés dans beaucoup de texte et ses paramètres
   sont légèrement ajustés après chaque essai pour rendre la bonne réponse plus probable.
2. Pourquoi est-ce une mauvaise idée d’attendre une citation exacte ou un chiffre précis de
   la seule mémoire du modèle ?
   Good answer: le savoir est stocké sous forme de régularités compressées, pas comme une copie
   des sources, donc les détails peuvent être flous et comblés par du texte plausible mais faux.
3. Vous interrogez un assistant sans accès au web sur « la dernière » version d’un outil et il
   en décrit une avec assurance. Que se passe-t-il peut-être, et que feriez-vous ?
   Good answer: la date limite des connaissances : il ne connaît le monde que jusqu’à son
   entraînement ; il peut présenter une version ancienne ou inventée ; vérifier une source à jour
   ou lui fournir l’information.

## Completion criteria
L’apprenant peut expliquer le pré-entraînement comme un apprentissage par la devinette du token
suivant, et relier le stockage flou du savoir et la date limite à des réponses fausses ou
dépassées (vérifications 1-3).

## Going further
- Sujet à explorer : pourquoi la qualité des données, et pas seulement la quantité, compte dans
  l’entraînement.
- La leçon « Ce que le prompting ne peut pas corriger » de *Les bases du prompting* montre le
  côté pratique de ces limites.
