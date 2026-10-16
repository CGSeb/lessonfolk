---
id: evaluating-ai-output/04-scoring-methods
title: "Noter : vérifications, personnes et IA juges"
level: intermediate
estimatedMinutes: 15
objectives:
  - Comparer les vérifications automatiques, la relecture humaine et les IA juges, avec leurs forces et leurs limites
  - Nommer les biais connus des IA juges
  - Expliquer comment combiner les méthodes et décider jusqu’où faire confiance à un juge
prerequisites:
  - evaluating-ai-output/03-what-makes-a-good-test-set
---

## Key ideas
1. **Les vérifications automatiques conviennent à tout ce qui peut être une règle.** La réponse est-elle
   exactement la catégorie attendue ? Est-elle valide dans le format demandé ? Mentionne-t-elle le point
   obligatoire, ou évite-t-elle l’interdit ? Tient-elle dans la limite de longueur ? Ces vérifications sont
   rapides, peu coûteuses et parfaitement cohérentes, mais elles ne peuvent pas juger si un texte libre est
   réellement bon.
2. **Les personnes jugent la nuance, mais lentement et de façon inégale.** La relecture humaine est la
   référence pour la qualité, le ton et les erreurs subtiles. Elle est lente et coûteuse, et deux relecteurs
   peuvent ne pas être d’accord. Donnez-leur les critères écrits, faites noter un échantillon par deux
   d’entre eux, et discutez des désaccords : ils montrent où les critères manquent de clarté.
3. **Une IA peut servir de juge.** Vous donnez à un modèle le cas, la réponse et la grille, et vous lui
   demandez un verdict avec une courte justification. Cela passe à l’échelle de milliers de réponses.
   Mais le juge est un instrument de mesure qui peut se tromper, et il se vérifie comme n’importe quel instrument.
4. **Les IA juges ont des biais connus.** Elles ont tendance à préférer les réponses plus longues, à favoriser
   la réponse qui vient en premier (ou en dernier), à favoriser les textes écrits dans un style proche du
   leur, et à mal noter les tâches qui demandent un raisonnement soigné, comme les maths. Elles peuvent
   aussi partager les angles morts du modèle qu’elles jugent. Contre-mesures utiles : une grille claire,
   l’échange de l’ordre de deux réponses, et la comparaison du juge avec des notes humaines sur un échantillon.
5. **Combinez-les, et étalonnez.** Un schéma courant : des vérifications automatiques peu coûteuses pour tout
   ce qui peut être une règle, une IA juge pour le volume, et des personnes pour un échantillon et pour les cas
   difficiles ou à fort enjeu. Avant de vous fier à un juge, regardez à quelle fréquence il est d’accord avec
   des personnes sur les mêmes réponses ; s’il est souvent en désaccord, corrigez la grille ou ne l’utilisez
   pas. Quand une erreur coûte cher, ne laissez jamais une IA juge être la seule preuve.

## Teaching notes
- Analogie : une règle, un collègue et une balance automatique. Chacun mesure autre chose. La balance est
  exacte sur le poids et aveugle à la qualité ; le collègue remarque la qualité mais se fatigue ; une seconde
  balance non testée doit être vérifiée avec un poids connu avant qu’on lui fasse confiance.
- Scénario à raisonner avec l’apprenant (rien à lancer) : une équipe veut noter 2 000 réponses d’assistant par
  semaine. Demandez ce qu’elle vérifierait automatiquement, où elle utiliserait une IA juge et où elle voudrait
  encore une personne.
- Second scénario : une IA juge choisit la réponse la plus longue de deux dans 80 % des cas. Demandez ce que cela
  peut signifier et ce qu’ils vérifieraient avant de lui faire confiance. (Ne présentez pas ce pourcentage comme
  une vraie statistique ; c’est seulement un exemple.)
- Idée reçue : « une IA juge est objective parce que c’est une machine ». C’est un modèle avec des tendances, qui
  a besoin d’une grille et d’une comparaison avec des personnes.
- Idée reçue : « la relecture humaine est toujours la vérité ». Les gens ne sont pas toujours d’accord et se
  fatiguent ; l’accord entre relecteurs est un signal à utiliser.
- Débutants dans le cours : idées 1 à 3 et le scénario des 2 000 réponses. Apprenants expérimentés : discutez
  de l’étalonnage et des contre-mesures aux biais.
- Ne nommez ni outils de jugement, ni modèles, ni scores de benchmarks.
- Rythme : l’idée 4 est le cœur de la leçon ; gardez du temps pour le second scénario.

## Check your understanding
1. Nommez une chose que les vérifications automatiques font bien et une qu’elles ne peuvent pas faire.
   Good answer: elles vérifient des règles vite et de façon cohérente (format, contenu exigé ou interdit,
   catégorie exacte, longueur) ; elles ne peuvent pas juger la qualité d’un texte libre.
2. Nommez deux biais connus des IA juges et une façon d’en réduire l’effet.
   Good answer: deux parmi préférer les réponses plus longues, favoriser la première (ou la dernière) réponse
   présentée, favoriser leur propre style, mal noter les tâches de raisonnement ; les réduire avec une grille
   claire, en échangeant l’ordre, ou en comparant avec des notes humaines sur un échantillon.
3. Une équipe prévoit d’utiliser une IA juge comme seul contrôle des réponses sur des doses de médicaments.
   Quel est le problème, et que proposeriez-vous ?
   Good answer: l’enjeu est élevé et le juge peut se tromper ou partager les angles morts du modèle ; ajouter
   une relecture humaine des réponses, au moins sur un échantillon et sur tous les cas difficiles, et vérifier
   le juge auprès de personnes avant de lui faire confiance.

## Completion criteria
L’apprenant peut comparer les trois méthodes de notation, nommer des biais des IA juges avec une contre-mesure
et décrire comment combiner les méthodes et quand une personne doit rester impliquée (vérifications 1-3).

## Going further
- La leçon « Vérifier les réponses et les sources » d’*Utiliser l’IA en toute sécurité et avec discernement*
  montre des habitudes personnelles pour contrôler une réponse.
- Sujet à explorer : l’accord entre relecteurs comme mesure de la clarté d’une grille.
