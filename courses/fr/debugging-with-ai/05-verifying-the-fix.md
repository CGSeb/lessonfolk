---
id: debugging-with-ai/05-verifying-the-fix
title: Vérifier la correction
level: intermediate
estimatedMinutes: 15
objectives:
  - Reproduire un bug de façon fiable avant de le corriger
  - Transformer la reproduction en un test qui échoue avant la correction et passe après
  - Vérifier les régressions et la présence du même bug ailleurs avant de dire que c’est terminé
prerequisites:
  - debugging-with-ai/04-root-cause-or-symptom
---

## Key ideas
1. **Pas de reproduction, pas de preuve.** Si vous ne pouvez pas faire apparaître le bug à la demande, vous
   ne pouvez pas montrer qu’une correction l’a supprimé : il ne s’est peut-être simplement pas produit cette
   fois. Obtenez d’abord une reproduction fiable (la reproduction minimale de la leçon 1 est un bon début).
   Pour les bugs qui n’apparaissent que parfois, trouvez la condition qui les déclenche avant de corriger
   quoi que ce soit.
2. **Transformez la reproduction en un test qui échoue.** Écrivez un test qui reproduit le bug et échoue
   pour la bonne raison : la même valeur fausse ou la même erreur que vous avez vue. C’est un **test de
   régression** : une fois le bug corrigé, il garde contre son retour. L’assistant peut en rédiger un
   brouillon ; vous vérifiez qu’il reproduit bien votre bug.
3. **Voyez-le échouer, puis voyez-le passer.** Lancez le test avant la correction : il doit échouer.
   Appliquez la correction : il doit passer, sans que le test ait été modifié. Un test qui passait avant la
   correction ne prouve rien, car il n’a jamais attrapé le bug.
4. **Vérifiez autour de la correction.** Lancez toute la suite de tests, pas seulement le nouveau test,
   pour attraper les régressions (ce que la correction a cassé ailleurs). Demandez à l’assistant : « Où
   ailleurs dans ce code la même erreur pourrait-elle exister ? » La même mauvaise hypothèse apparaît
   souvent à plusieurs endroits.
5. **Nettoyez et expliquez.** Retirez les affichages, journaux et expériences temporaires de votre
   débogage. Puis expliquez le bug et la correction en une phrase ou deux, avec vos propres mots : la
   cause, pourquoi la correction la traite, comment le test le prouve. Si vous n’y arrivez pas, vous n’avez
   pas fini ; c’est aussi un bon message de commit.

## Teaching notes
- Analogie qui fonctionne : **un plombier qui répare une fuite**. Il fait d’abord apparaître la goutte
  (ouvre le robinet), répare le joint, puis relance l’eau et vérifie les autres joints le long du même
  tuyau. « Ça ne goutte pas en ce moment » n’est pas une preuve.
- Cette leçon prolonge les tests comme filet de sécurité de Les assistants de code IA en pratique ;
  rappelez-le en une phrase et concentrez-vous sur ce qui est propre à un bug : reproduire d’abord, un test
  qui échoue pour la bonne raison, le voir échouer puis passer.
- Idée reçue : « l’assistant a dit que c’est corrigé ». L’assistant n’a peut-être rien exécuté, et même les
  outils de type agent annoncent parfois un succès trop tôt. La preuve est un test que vous avez vu échouer
  puis passer.
- Idée reçue : « un bug trop petit pour un test ». Un test d’une ligne suffit en général, et c’est
  l’assurance la moins chère contre le retour du bug après un changement ultérieur.
- Pour les bugs difficiles à tester automatiquement (défauts visuels, problèmes de timing), acceptez une
  reproduction manuelle écrite avec les étapes exactes, jouée avant et après la correction.
- Apprenants qui n’écrivent pas encore de tests : commencez par un test pour une fonction dans l’outil de
  test que leur projet utilise déjà ; n’enseignez pas ici un framework de test.

## Check your understanding
1. Pourquoi faut-il voir le nouveau test échouer avant d’appliquer la correction ?
   Good answer: cela prouve que le test reproduit bien le bug ; un test qui passe déjà avant la correction passerait de toute façon et ne prouve rien sur la correction.
2. L’assistant a corrigé le bug et le nouveau test passe. Que vérifiez-vous encore avant de dire que c’est terminé ?
   Good answer: que toute la suite de tests passe toujours (pas de régressions), que le test n’a pas été modifié pour passer, que la même erreur n’existe pas ailleurs et que le code de débogage temporaire est retiré.
3. Un bug n’arrive que parfois. Pourquoi le corriger tout de suite est-il risqué ?
   Good answer: sans reproduction fiable, on ne peut pas dire si la correction a marché ou si le bug ne s’est simplement pas produit cette fois ; il faut d’abord trouver la condition qui le déclenche.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait décrire la boucle reproduire → test qui échoue →
correction → le test passe → suite complète → nettoyage → explication, y compris pourquoi le test doit
d’abord échouer.

## Going further
- Les tests de régression et le développement piloté par les tests (TDD), qui partagent l’habitude de « d’abord échouer ».
- Leçon suivante : que faire quand l’assistant est bloqué ou se trompe avec assurance.
