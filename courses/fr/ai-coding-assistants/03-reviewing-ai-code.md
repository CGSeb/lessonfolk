---
id: ai-coding-assistants/03-reviewing-ai-code
title: Relire du code écrit par l’IA
level: intermediate
estimatedMinutes: 20
objectives:
  - Reconnaître les défaillances typiques du code écrit par l’IA
  - Relire une modification de l’IA avec une courte liste de contrôle reproductible
  - Expliquer pourquoi vous restez responsable du code que vous acceptez
prerequisites:
  - ai-coding-assistants/02-splitting-the-work
---

## Key ideas
1. **Vous êtes responsable de chaque ligne que vous acceptez.** Le code écrit par l’IA entre dans votre
   projet, vos relectures et votre production sous votre nom. « C’est l’IA qui l’a écrit » n’explique pas un
   bug. Relisez-le au moins aussi soigneusement que le code d’un nouveau coéquipier.
2. **Des API et des paquets inventés.** Le modèle produit du texte vraisemblable (voir les hallucinations
   dans Utiliser l’IA en toute sécurité et avec discernement). Dans le code, cela donne des fonctions, des
   options ou des paquets entiers qui ont l’air plausibles mais n’existent pas, ou existent avec une
   signature différente. Vérifiez chaque import et chaque appel d’API inconnus dans la documentation, et
   n’installez jamais un paquet simplement parce que l’assistant l’a nommé : un paquet inconnu peut même
   être malveillant, enregistré sous un nom que les assistants ont tendance à inventer.
3. **Versions dépassées ou mélangées.** Le modèle a appris à partir de code écrit sur de nombreuses années.
   Il peut utiliser une API obsolète, un ancien motif de framework, ou mélanger deux versions majeures
   d’une bibliothèque dans le même fichier. Comparez avec les versions de votre projet.
4. **Des failles de sécurité qui fonctionnent très bien.** Un code peut réussir tous les tests manuels et
   rester dangereux : validation des entrées manquante, SQL ou HTML construit par concaténation de chaînes
   (injection), contrôles d’autorisation manquants sur une route d’API, secrets dans du code côté client,
   CORS trop permissif. Les assistants écrivent souvent le « chemin heureux » et sautent ces points sauf si
   on le leur demande.
5. **Plausible mais faux, et plus que demandé.** Méfiez-vous d’une logique qui a l’air juste mais gère mal
   les cas limites (listes vides, fuseaux horaires, erreurs d’un cran), d’erreurs avalées en silence, de
   tests qui ne vérifient rien d’utile et de changements non demandés : variables renommées, fichiers
   reformatés, « améliorations » ailleurs, code supprimé. Lisez tout le diff, pas seulement la partie que
   vous aviez demandée.

## Teaching notes
- Analogie qui fonctionne : **la pull request d’un stagiaire sûr de lui**. Souvent bonne, parfois
  subtilement fausse, toujours écrite avec la même assurance. Vous relisez le travail du stagiaire ligne par
  ligne ; réservez le même traitement à l’assistant.
- Suggérez une courte liste de contrôle que l’apprenant peut réutiliser : fait-il ce que j’ai demandé, et
  seulement cela ? Tous les imports et API existent-ils dans mes versions ? Que se passe-t-il avec une
  entrée mauvaise ou vide ? Qui a le droit d’appeler ceci ? Les tests testent-ils quelque chose de réel ?
- Idée reçue : « si ça tourne, c’est bon ». Faire tourner prouve peu de chose sur la sécurité, les cas
  limites ou la maintenabilité.
- Idée reçue : « je peux demander à l’IA de relire son propre code à ma place ». Une seconde passe par
  l’assistant (ou un autre modèle) peut attraper certains problèmes et vaut le coup, mais elle partage les
  mêmes angles morts ; elle complète votre relecture, elle ne la remplace pas.
- Gardez le point sur les « paquets malveillants » factuel et calme : le risque est que des attaquants
  publient des paquets sous des noms que les assistants inventent couramment. Ne citez pas d’incidents
  précis et ne donnez pas de chiffres.
- Pour les développeurs web, choisissez des exemples proches de leur pile (une route Express ou Next.js
  sans contrôle d’authentification, `innerHTML` avec une saisie utilisateur, un fetch sans gestion d’erreur).
- Cette leçon est la plus longue ; vérifiez l’engagement après l’idée 2 et après l’idée 4.

## Check your understanding
1. L’assistant utilise `import { formatRelative } from "date-utils-pro"`, un paquet dont vous n’avez jamais entendu parler. Que faites-vous avant de l’exécuter ?
   Good answer: vérifier que le paquet existe, que c’est bien celui attendu et qu’il est digne de confiance (page du registre, documentation, mainteneurs), et que la fonction existe avec cette signature ; ne jamais l’installer à l’aveugle, car des noms inventés peuvent être squattés par des paquets malveillants.
2. Une route d’API écrite par l’IA fonctionne parfaitement dans vos tests manuels. Citez deux choses qui pourraient encore être fausses.
   Good answer: deux éléments parmi validation des entrées manquante, contrôle d’autorisation manquant, injection (SQL ou HTML construit à partir d’une saisie utilisateur), erreurs avalées, cas limites non gérés, usage d’API obsolète ou dépréciée, changements non demandés ailleurs.
3. Pourquoi faut-il lire tout le diff, et pas seulement la fonction demandée ?
   Good answer: les assistants font parfois des changements non demandés (renommages, reformatage, code supprimé, modifications dans d’autres fichiers) qui peuvent casser des choses ou se cacher dans un gros changement.
4. Un bug dans du code écrit par l’IA que vous avez fusionné arrive en production. Qui en répond, et qu’est-ce que cela implique pour votre façon de relire ?
   Good answer: vous ; le code que vous acceptez entre sous votre nom et « c’est l’IA qui l’a écrit » n’explique rien, donc vous le relisez au moins aussi soigneusement que le code d’un nouveau coéquipier.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait nommer sans aide au moins quatre types de
défaillances à chercher dans du code écrit par l’IA, dont un problème de sécurité.

## Going further
- L’OWASP Top 10, une liste bien connue des risques de sécurité courants des applications web.
- Leçon suivante : tests et petits commits, pour que les relectures soient plus faciles et les erreurs peu
  coûteuses à annuler.
