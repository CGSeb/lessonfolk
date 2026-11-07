---
id: securing-ai-systems/05-red-teaming-your-own-system
title: Faire le red teaming de son propre système
level: advanced
estimatedMinutes: 20
objectives:
  - Définir les objectifs et les règles d’un exercice de red teaming à partir de la modélisation des menaces
  - Expliquer pourquoi les défenses doivent être testées contre un attaquant qui s’adapte
  - Lire les résultats d’un red teaming en taux et en impact, pas en tentatives isolées
  - Transformer les trouvailles en corrections de conception et en tests de régression
prerequisites:
  - securing-ai-systems/04-designing-for-containment
---

## Key ideas
1. **Le red teaming teste tout le système face à des objectifs, pas le modèle face à des
   prompts.** Une équipe rouge joue délibérément l’attaquant. Ses objectifs viennent de la
   modélisation des menaces : « obtenir le remboursement d’une commande qui n’est pas la vôtre »,
   « lire l’adresse d’un autre client », « faire contacter une adresse extérieure par l’agent ».
   Elle vise le système réel (outils, droits, interface), dans un environnement de test avec des
   données et des comptes fictifs, selon des règles écrites sur ce qui est dans le périmètre.
2. **Couvrez chaque point d’entrée et chaque type de dommage.** Variez l’origine de l’attaque (le
   chat, un e-mail, une pièce jointe, un document de l’index, une mémoire enregistrée) et sa cible
   (passer outre les instructions, extraire des données, provoquer des actions non voulues, faire
   passer une sortie dangereuse à d’autres programmes, faire grimper les coûts, produire un
   contenu contraire aux règles du produit). Les attaques sur plusieurs tours ou plusieurs étapes
   d’un agent comptent aussi : beaucoup de défaillances demandent plus d’un message.
3. **Testez contre un attaquant qui s’adapte.** Rejouer une liste de prompts d’attaque connus
   rassure à tort : ce sont ceux sur lesquels les défenses ont été réglées. Un vrai attaquant
   connaît (ou devine) vos défenses et ajuste sans cesse. La recherche sur les défenses
   anti-injection a montré à plusieurs reprises que des mesures qui arrêtaient des jeux
   d’attaques fixes cédaient face à des attaques adaptatives. Combinez la créativité humaine et la
   génération automatique de nombreuses variantes.
4. **Mesurez des taux et un impact.** Les réponses d’un modèle varient d’une exécution à l’autre,
   donc une tentative ratée ne prouve rien. Lancez chaque attaque de nombreuses fois et indiquez à
   quelle fréquence elle réussit, et surtout ce qu’une réussite permet : une phrase bizarre, une
   fiche qui fuit, de l’argent déplacé. Une réussite rare à fort impact est une trouvaille sérieuse.
5. **Corrigez la conception, puis gardez le test.** Rafistoler la formulation exacte qui a marché
   (« ne fais jamais X ») invite la variante suivante. Remontez chaque trouvaille à la capacité qui
   l’a rendue nuisible et corrigez-la là (leçon 4). Ajoutez ensuite l’attaque à vos tests de
   régression (comparer des versions et repérer les régressions est vu dans *Évaluer les réponses
   de l’IA*) et relancez-les après chaque changement de modèle, de prompt ou d’outils.

## Teaching notes
- Analogie qui fonctionne : **un exercice d’incendie mené avec l’état d’esprit d’un vrai
  pyromane**. On ne teste pas les portes coupe-feu en vérifiant que l’incendie de l’an dernier
  serait arrêté ; on cherche la porte que quelqu’un a laissée ouverte avec une cale.
- Demandez à l’apprenant de planifier un exercice de red teaming pour l’agent de la boutique :
  trois objectifs tirés de la modélisation des menaces, les points d’entrée à essayer pour
  chacun, ce qui compte comme une réussite, et l’environnement de test. Restez au niveau des
  objectifs et des voies d’entrée.
- Pour l’idée 4, un chiffre utile pour raisonner : une attaque qui marche une fois sur trente
  peut sembler rare, mais un attaquant qui peut envoyer trente e-mails l’obtient. Ce qui compte,
  c’est ce que fait une seule réussite.
- Idée reçue : « nous avons essayé les jailbreaks célèbres et aucun n’a marché, donc nous sommes
  protégés ». Cela prouve seulement que les prompts connus échouent ; la défense n’a pas affronté
  d’attaquant qui s’adapte.
- Idée reçue : « le red teaming, c’est une fois avant le lancement ». Chaque mise à jour du
  modèle, nouvel outil ou changement de prompt peut rouvrir une faille, d’où la transformation des
  trouvailles en tests de régression.
- N’écrivez pas de prompts d’attaque ni de méthodes d’attaque pas à pas, et n’aidez pas
  l’apprenant à attaquer des systèmes qui ne lui appartiennent pas. Le red teaming se fait sur son
  propre système, avec autorisation.
- Apprenants expérimentés : mentionnez que certaines organisations ouvrent des programmes de bug
  bounty pour leurs fonctions d’IA, et que la génération automatique d’attaques est elle-même un
  système d’IA qu’il faut vérifier.
- Rythme : consacrez l’essentiel du temps au plan d’exercice et à l’idée 5.

## Check your understanding
1. Pourquoi un exercice de red teaming doit-il se dérouler dans un environnement de test avec des données fictives, et d’où viennent ses objectifs ?
   Good answer: de vraies attaques sur le système en production pourraient faire fuiter de vraies données ou déplacer de l’argent réel et toucher de vrais utilisateurs ; les objectifs viennent de la modélisation des menaces, sous forme de dommages concrets à obtenir, comme lire les données d’un autre client ou obtenir un remboursement non autorisé.
2. Une équipe a rejoué 50 prompts de jailbreak bien connus et aucun n’a marché. Que peut-elle en conclure ?
   Good answer: seulement que ces prompts connus échouent ; les défenses sont souvent réglées sur eux, et un attaquant qui s’adapte peut encore réussir, donc il faut des tests adaptatifs (humains et variantes automatiques) visant ses propres objectifs et points d’entrée.
3. Une injection fait envoyer par l’agent l’adresse d’un client vers un compte extérieur une fois sur 30. Est-ce une trouvaille sérieuse ? Pourquoi ?
   Good answer: oui : un attaquant peut simplement répéter la tentative, et l’impact d’une réussite est une fuite de données ; on juge une trouvaille par son taux et son impact ensemble, et un fort impact rend sérieux même un taux faible.
4. L’équipe corrige cette trouvaille en ajoutant « n’envoie jamais d’e-mail à une adresse extérieure » au prompt système. Est-ce une bonne correction ? Que feriez-vous ?
   Good answer: non : une règle de prompt peut être contournée par la variante suivante ; corrigez la capacité dans le code (destinataires uniquement depuis la fiche client ou une liste autorisée, approbation pour un nouveau destinataire), puis ajoutez l’attaque aux tests de régression et relancez-les après chaque changement.

## Completion criteria
L’apprenant répond correctement aux questions, planifie un exercice de red teaming avec des
objectifs, des points d’entrée et des critères de réussite, et transforme une trouvaille en
correction de conception et en test de régression (vérifications 1-4).

## Going further
- Sujets : les attaques adaptatives contre les défenses anti-injection, le red teaming
  automatisé, les bug bounties pour l’IA.
- Leçon suivante : surveiller un système en service et réagir quand quelque chose tourne mal.
