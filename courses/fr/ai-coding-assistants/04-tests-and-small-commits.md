---
id: ai-coding-assistants/04-tests-and-small-commits
title: Tests et petits commits comme filet de sécurité
level: intermediate
estimatedMinutes: 15
objectives:
  - Utiliser des tests pour vérifier automatiquement les modifications de l’IA
  - Utiliser de petits commits et des diffs pour que chaque modification de l’IA soit facile à relire et à annuler
  - Repérer quand un assistant « corrige » un test qui échoue au lieu du code
prerequisites:
  - ai-coding-assistants/03-reviewing-ai-code
---

## Key ideas
1. **Les tests transforment « a l’air juste » en « est vérifié ».** Relire à l’œil laisse passer des
   choses ; une suite de tests vérifie le comportement à chaque fois. Avec un assistant qui produit du code
   vite, les tests permettent d’accepter les changements en confiance. Les outils de type agent peuvent
   aussi lancer les tests eux-mêmes et corriger ce qui échoue, ce qui les rend bien plus fiables.
2. **Écrivez ou convenez des tests d’abord quand vous le pouvez.** Décrivez le comportement sous forme de
   tests (ou demandez des tests à l’assistant, puis relisez-les avant toute implémentation). Les tests
   deviennent les critères de terminé de la leçon 2, écrits en code. Le travail de l’assistant est alors
   clair : les faire passer sans les modifier.
3. **Méfiez-vous du test qui est « corrigé ».** Quand un test échoue, un assistant peut modifier le test
   au lieu du code : assouplir une assertion, sauter le test ou mettre à jour la valeur attendue pour
   qu’elle corresponde à ce que renvoie le code. Vérifiez toujours si un diff touche aux tests, et pourquoi.
4. **Committez avant, committez petit.** Commencez chaque tâche à partir d’un état propre (tout est
   committé), pour que la modification de l’assistant soit exactement ce que montre le diff. Committez
   chaque étape qui fonctionne avant la suivante. Si une étape tourne mal, vous pouvez l’écarter en
   quelques secondes au lieu de la démêler.
5. **Le diff est votre surface de relecture.** Regardez le diff de chaque modification de l’IA avant de la
   committer, comme vous le feriez pour une pull request. Les diffs petits et ciblés se relisent vite ; un
   énorme diff est le signe que la tâche était trop grosse (leçon 2), et il vaut souvent mieux le jeter et
   découper la tâche.

## Teaching notes
- Analogie qui fonctionne : **grimper avec une corde et des points d’ancrage**. Les tests sont la corde,
  les commits sont les ancrages : si vous glissez, vous retombez au dernier ancrage, pas au sol. Grimper
  vite (avec un assistant) rend les ancrages plus importants, pas moins.
- Idée reçue : « l’IA rend les tests moins nécessaires parce qu’elle écrit du code correct ». C’est
  l’inverse : plus de code, écrit plus vite, demande plus de vérification automatique.
- Idée reçue : « l’assistant a écrit les tests, donc le code est testé ». Des tests écrits à partir de la
  même incompréhension que le code confirmeront l’erreur. Relisez ce que les tests vérifient et ajoutez les
  cas qui comptent pour vous.
- Jeter une mauvaise tentative est normal et peu coûteux avec un état git propre ; encouragez-le plutôt que
  des allers-retours sans fin sur un changement cassé.
- Apprenants qui n’écrivent pas encore de tests : partez d’un test simple pour une fonction, dans l’outil
  de test que leur projet utilise déjà. N’enseignez pas ici un framework de test.
- Apprenants nouveaux avec git : le minimum est « committer avant de demander, regarder le diff, écarter si
  mauvais ». Ne nommez les commandes de leur outil que s’ils le demandent.

## Check your understanding
1. Après un changement, l’assistant annonce « tous les tests passent ». Son diff comprend des modifications dans deux fichiers de test. Que vérifiez-vous ?
   Good answer: si les modifications des tests sont légitimes (nouveau comportement demandé) ou affaiblissent les tests (assertions assouplies, tests sautés, valeurs attendues changées pour correspondre au code) ; un test modifié juste pour passer cache un bug.
2. Pourquoi commencer chaque tâche d’IA à partir d’un état propre et committé ?
   Good answer: le diff montre alors exactement ce que l’assistant a changé, et un mauvais changement peut être écarté instantanément en revenant au dernier commit.
3. L’assistant a produit un diff de 1 500 lignes pour ce que vous pensiez être une petite tâche. Quelle réaction est sensée ?
   Good answer: ne pas essayer de tout relire ; le jeter et découper la tâche en étapes plus petites avec des critères de terminé plus clairs (ou demander d’abord un plan).

## Completion criteria
L’apprenant répond correctement aux vérifications et sait décrire une boucle état propre → tests →
modification de l’IA → relecture du diff → commit, y compris comment repérer un test affaibli.

## Going further
- Le développement piloté par les tests (TDD), une pratique qui convient bien au code assisté par l’IA.
- Leçon suivante : garder en sécurité les secrets et le code privé.
