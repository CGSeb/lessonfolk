---
id: ai-coding-assistants/05-secrets-and-private-code
title: Secrets et code privé
level: intermediate
estimatedMinutes: 15
objectives:
  - Identifier où les secrets et les données privées peuvent atteindre un assistant de code
  - Garder les secrets hors des prompts et du code écrit par l’IA
  - Savoir quoi faire quand un secret fuit
prerequisites:
  - ai-coding-assistants/04-tests-and-small-commits
---

## Key ideas
1. **Les assistants de code voient plus que ce que vous tapez.** Ce que vous envoyez part quelque part (vu
   dans Utiliser l’IA en toute sécurité et avec discernement). Avec du code, l’outil peut aussi envoyer les
   fichiers ouverts, les fichiers qu’il cherche ou lit, et la sortie des commandes qu’il lance. Un fichier
   `.env`, une configuration avec un mot de passe de base de données ou un journal plein d’e-mails de
   clients peuvent atteindre le modèle sans que vous les ayez jamais collés.
2. **Sachez ce que votre outil peut lire et ce que votre entreprise autorise.** Vérifiez à quels fichiers
   l’outil a accès, s’il peut recevoir l’instruction d’en exclure certains (beaucoup d’outils proposent un
   réglage d’exclusion ou suivent `.gitignore`, mais vérifiez le vôtre) et comment votre offre ou votre
   compte traite votre code. Beaucoup d’entreprises ont des règles sur les outils d’IA autorisés à voir tel
   ou tel code ; suivez-les.
3. **Retirez secrets et données personnelles avant de partager.** Les traces de pile, journaux, copies de
   requêtes et sorties de tests en échec contiennent souvent des jetons, cookies, e-mails ou identifiants.
   Remplacez-les par de fausses valeurs avant de coller. Utilisez des données fausses ou générées dans les
   jeux de test et les exemples, jamais de vrais dossiers de clients.
4. **Ne laissez pas de secrets entrer dans le code qu’il écrit.** Les assistants écrivent parfois une clé
   en dur « pour que ça marche », la mettent dans du code côté client ou l’écrivent dans les journaux. Pour
   les applications web, rappelez-vous que tout ce qui est livré au navigateur (y compris les variables
   d’environnement exposées au frontend par votre framework) est public. Les clés vont dans des variables
   d’environnement côté serveur ou un gestionnaire de secrets, et les fichiers secrets vont dans
   `.gitignore`.
5. **Si un secret fuit, révoquez-le.** Une clé collée dans un chat, committée ou livrée au navigateur doit
   être considérée comme compromise. Révoquez-la ou renouvelez-la chez le fournisseur, puis nettoyez.
   Supprimer le commit ne suffit pas : la clé reste dans l’historique git, les forks, les caches et
   peut-être les journaux.

## Teaching notes
- Analogie qui fonctionne : **un prestataire qui travaille dans vos bureaux**. Vous êtes content qu’il voie
  le code sur lequel il travaille, mais vous ne laisseriez pas le coffre ouvert ni ne lui remettriez les
  fichiers clients « au cas où ». Décidez de ce qui est dans la pièce avant qu’il commence.
- Ne répétez pas la leçon générale sur la vie privée ; rappelez-la en une phrase et concentrez-vous sur ce
  qui est propre au code : fichiers lus automatiquement, sortie de commandes, journaux, `.env`, exposition
  côté frontend, historique git.
- N’énoncez jamais ce qu’un outil ou une offre précis fait des données : cela diffère et change. Renvoyez
  l’apprenant à la documentation de son outil et à la politique de son entreprise.
- Idée reçue : « ce n’est pas grave, j’ai supprimé le commit ». Le secret est toujours dans l’historique et
  a peut-être déjà été copié ; révoquer est la seule vraie solution.
- Idée reçue : « les variables d’environnement sont toujours secrètes ». Seulement celles côté serveur ; les
  valeurs intégrées au code du frontend sont visibles par quiconque ouvre les outils du navigateur.
- Pour les apprenants en entreprise, demandez s’ils connaissent leur politique d’usage de l’IA ; sinon, la
  retrouver est un point d’action utile.
- Des outils de détection de secrets existent (dans les hébergeurs git et sous forme de hooks de
  pré-commit) ; mentionnez-les comme filet de sécurité, sans nommer ni classer de produits.

## Check your understanding
1. Vous ne collez jamais de secrets dans le chat. Citez deux façons dont un secret pourrait quand même atteindre un assistant de type agent.
   Good answer: deux éléments parmi il lit un fichier `.env` ou de configuration, il lance une commande dont la sortie montre un secret, il lit des journaux ou des sorties de tests contenant des jetons, un fichier ouvert contient une clé.
2. L’assistant suggère de mettre la clé secrète de votre prestataire de paiement dans une variable d’environnement du frontend pour que la page de paiement appelle directement l’API. Qu’est-ce qui ne va pas, et que faire à la place ?
   Good answer: tout ce qui est envoyé au navigateur est public, donc la clé serait exposée ; la garder sur le serveur et faire appeler par le frontend votre propre route serveur.
3. Vous remarquez qu’une clé d’API a été committée et poussée il y a une heure. Que faire en premier, et pourquoi supprimer le commit ne suffit-il pas ?
   Good answer: révoquer ou renouveler d’abord la clé chez le fournisseur ; l’ancienne clé reste dans l’historique git, les clones, les forks ou les caches, donc retirer le commit ne la rend pas sûre.

## Completion criteria
L’apprenant répond correctement aux vérifications et sait nommer où les secrets se cachent dans un projet,
comment les garder hors des prompts et du code écrit par l’IA, et la première étape après une fuite.

## Going further
- La documentation de votre hébergeur git sur la détection de secrets et la suppression de données sensibles de l’historique.
- La documentation de votre assistant de code sur l’usage des données et l’exclusion de fichiers.
- Leçon suivante : décider quand conduire et quand déléguer.
