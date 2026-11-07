---
id: securing-ai-systems/04-designing-for-containment
title: Concevoir pour contenir les dégâts
level: advanced
estimatedMinutes: 25
objectives:
  - Réduire le rayon d’action d’un modèle trompé avec des droits limités
  - Expliquer comment séparer la lecture de l’action limite l’injection de prompt
  - Choisir les limites qui doivent être appliquées dans le code
  - Concevoir une étape d’approbation que les gens lisent vraiment
prerequisites:
  - securing-ai-systems/03-data-leaks-and-exfiltration
---

## Key ideas
1. **Supposez le modèle compromis, et réduisez ce qu’il peut atteindre.** Le moindre privilège
   (vu dans *Agents IA et outils*) va plus loin que le choix des outils. Les outils doivent agir
   avec les droits de la personne servie, pas avec un passe-partout : l’agent de la boutique qui
   traite le ticket d’un client ne peut lire que les commandes de ce client. Les identifiants
   sont étroits et de courte durée. Une tâche qui n’a besoin que de lire ne reçoit aucun outil
   qui écrit. Le rayon d’action d’un modèle trompé se limite alors aux données de l’utilisateur
   en cours, et non à toute la base.
2. **Séparez la lecture du contenu non fiable de l’action.** Les modèles de conception les plus
   efficaces tiennent le modèle qui lit le texte hostile à l’écart du pouvoir d’agir. Dans l’un
   d’eux (le *dual LLM*), un modèle *en quarantaine*, sans outils, lit l’e-mail, et le modèle qui
   tient les outils ne voit jamais le texte brut : il ne reçoit que des références aux résultats,
   ou des valeurs contraintes que le code peut vérifier (une catégorie d’une liste fixe, un numéro
   de commande au bon format). Dans un autre, le plan est arrêté avant de lire tout contenu non
   fiable (*planifier, puis exécuter*), si bien que le contenu peut remplir des valeurs mais pas
   ajouter de nouvelles actions. Ces conceptions sacrifient un peu de souplesse pour obtenir une
   garantie qu’aucun filtre ne peut donner.
3. **Mettez les limites strictes dans le code, après le modèle.** Quoi que décide le modèle, sa
   décision passe par des contrôles qu’il ne peut pas contourner en argumentant : un format de
   sortie strict, des listes autorisées (destinataires, domaines, outils), des plafonds de montant
   et de fréquence, et des règles métier (un seul remboursement par commande, uniquement vers le
   moyen de paiement d’origine). Le modèle propose ; un code déterministe décide de ce qui est
   permis.
4. **Isolez ce qui s’exécute.** Le code que le modèle écrit, les pages qu’il parcourt et les
   fichiers qu’il ouvre tournent dans un bac à sable : pas d’accès aux fichiers ni aux secrets de
   la machine hôte, et un accès réseau limité à ce que la tâche exige. Une session qui traite du
   contenu non fiable ne partage pas son environnement avec des outils sensibles.
5. **Rendez les approbations dignes d’être lues.** Une approbation humaine (vue dans *Agents IA
   et outils*) ne protège que si la personne voit l’effet réel : le destinataire effectif, le
   montant, les données qui sortent, tirés de l’action elle-même et non de la description qu’en
   donne le modèle (« envoyer la réponse au client » peut cacher une autre adresse). Ne la
   demandez que pour les actions à fort impact, pour que les approbations restent assez rares
   pour être lues, et adressez-les à quelqu’un capable de juger.

## Teaching notes
- Analogie qui fonctionne : **les compartiments étanches d’un navire**. On ne compte pas sur une
  coque qui ne serait jamais percée ; on fait en sorte qu’une brèche inonde un compartiment, pas
  le navire.
- Cas suivi pour toute la leçon : reconcevez l’agent de la boutique avec l’apprenant. Partez de
  l’agent de la leçon 1 (lit toutes les commandes, envoie à n’importe quelle adresse, rembourse
  librement) et appliquez une idée à la fois : accès limité au client en cours (1), une étape en
  quarantaine qui transforme l’e-mail en catégorie et en numéro de commande (2), plafonds de
  remboursement et réponse uniquement à l’expéditeur dans le code (3), pas de navigation web hors
  du domaine de la boutique (4), approbation au-delà d’un montant, en montrant la commande, le
  montant et le moyen de paiement (5).
- Pour l’idée 2, les apprenants expérimentés connaissent peut-être le motif « dual LLM » ou des
  systèmes de recherche qui suivent l’origine de chaque valeur. Nommez-les comme des pistes, sans
  promettre qu’ils règlent tout : ils restreignent ce que l’agent peut faire, c’est le prix de la
  garantie.
- Idée reçue : « contenir les dégâts rend l’agent inutile ». Cela rétrécit les chemins dangereux ;
  l’essentiel de la valeur (lire, rédiger, rechercher) reste.
- Idée reçue : « une fenêtre d’approbation règle le problème ». Seulement si elle montre l’effet
  réel et reste assez rare pour être lue ; sinon on clique sans lire.
- Ne décrivez pas de moyens de sortir d’un bac à sable ou de contourner des limites.
- Rythme : c’est la leçon la plus longue. Si le temps manque, consacrez-le aux idées 1 à 3 avec
  la reconception et résumez les idées 4 et 5.

## Check your understanding
1. Reconcevez l’agent de la boutique pour qu’un e-mail piégé ne puisse pas faire fuiter les données d’autres clients. Nommez au moins deux changements et pourquoi chacun fonctionne.
   Good answer: deux ou plus parmi : les outils agissent avec les droits du client en cours, donc les données des autres clients sont hors de portée ; les réponses ne partent qu’au client qui a écrit, appliqué dans le code ; une étape en quarantaine transforme l’e-mail en données contraintes, donc la partie qui agit ne voit jamais d’instructions brutes ; aucune voie de sortie comme des requêtes web libres ou l’affichage d’images.
2. Pourquoi arrêter le plan avant de lire le contenu non fiable limite-t-il ce qu’une injection peut faire ?
   Good answer: les actions sont choisies avant que le texte hostile soit lu, donc le contenu peut au plus changer des valeurs à l’intérieur de ces actions (que le code peut encore vérifier), pas ajouter de nouvelles actions comme envoyer des données ailleurs.
3. Un écran d’approbation dit « L’agent veut envoyer la réponse au client. Approuver ? ». Qu’est-ce qui ne va pas, et que devrait-il montrer ?
   Good answer: il montre la description du modèle, qui peut être fausse ou manipulée ; il devrait montrer l’effet réel tiré de l’action elle-même : l’adresse effective du destinataire, les données ou pièces jointes qui sortent, et tout montant en jeu.
4. Quelles limites de l’outil de remboursement appliqueriez-vous dans le code plutôt que dans le prompt ?
   Good answer: par exemple un montant maximum, un seul remboursement par commande, la commande doit appartenir au client, paiement uniquement vers le moyen d’origine, un plafond quotidien, et une approbation au-delà d’un seuil ; ces contrôles tiennent même quand le modèle est trompé.

## Completion criteria
L’apprenant répond correctement aux questions et reconçoit un agent donné avec des droits
limités, la séparation de la lecture et de l’action, des limites dans le code et une approbation
qui a du sens (vérifications 1-4).

## Going further
- Sujets : le motif dual LLM, les agents « planifier puis exécuter », la sécurité par
  capacités, les bacs à sable.
- Leçon suivante : attaquer son propre système pour trouver ce que la conception a manqué.
