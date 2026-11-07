---
id: adapting-models/03-data-for-fine-tuning
title: Ce qui fait de bonnes données d’entraînement
level: advanced
estimatedMinutes: 20
objectives:
  - Juger un jeu d’entraînement sur sa qualité, sa cohérence et sa couverture
  - Expliquer pourquoi le jeu de test doit rester à part et comment une fuite gonfle les scores
  - Repérer les risques pour la vie privée dans des données d’entraînement
  - Peser les avantages et les risques des données d’entraînement synthétiques
prerequisites:
  - adapting-models/02-what-fine-tuning-changes
---

## Key ideas
1. **Le modèle copie les données, défauts compris.** Un modèle fine-tuné apprend tout ce que les
   exemples ont en commun : leur bon style, mais aussi leurs erreurs, leurs incohérences, leurs
   réponses périmées et leurs biais. Un petit ensemble d’exemples propres et cohérents l’emporte
   généralement sur une grosse pile de qualité inégale. Commencez petit, mesurez, et ajoutez des
   données là où le jeu de test montre une faiblesse.
2. **Couvrez les vrais cas, y compris les difficiles.** Les exemples doivent ressembler à ce que
   le modèle rencontrera : le même mélange de demandes, les longues et les courtes, les clients
   énervés et les demandes floues. Incluez des cas où la bonne réponse est de poser une question,
   de dire « je ne sais pas » ou de passer le cas à une personne. Si chaque exemple a une réponse
   assurée, le modèle apprend à toujours en donner une.
3. **Gardez le jeu de test à part, et traquez les fuites.** Mettez de côté des exemples jamais
   utilisés pour l’entraînement, et ne notez que sur eux. Si un cas identique ou presque figure dans
   les deux (un ticket et son doublon, deux réponses dans un même fil), le score est gonflé : le
   modèle se souvient au lieu de généraliser. Cherchez les quasi-doublons de part et d’autre de la
   séparation.
4. **Les modèles peuvent répéter leurs données d’entraînement.** Un modèle peut mémoriser et
   reproduire plus tard des morceaux de ce sur quoi il a été entraîné, parfois mot pour mot. Retirez
   les données personnelles, les secrets et les détails confidentiels que vous ne voudriez montrer à
   aucun utilisateur, vérifiez que vous avez le droit d’utiliser les données pour l’entraînement, et
   souvenez-vous qu’un modèle entraîné ne peut pas simplement oublier une fiche.
5. **Les données synthétiques aident, sous conditions.** Des exemples générés par un modèle plus
   grand peuvent combler des manques (cas rares, autres langues) rapidement. Mais ils portent les
   erreurs et les habitudes de ce modèle, donc ils doivent être relus, et ils sont souvent moins
   variés que les vrais cas. Vérifiez aussi les conditions d’utilisation du modèle générateur :
   certaines interdisent d’utiliser ses sorties pour entraîner d’autres modèles.

## Teaching notes
- Analogie qui fonctionne : **un apprenti qui recopie le carnet du maître**. Si le carnet mélange
  l’écriture de trois personnes, des prix périmés et quelques erreurs, l’apprenti apprend tout cela,
  fidèlement.
- Cas suivi : l’équipe de support propose d’entraîner sur cinq ans de réponses écrites par ses
  agents. Demandez à l’apprenant ce qui pourrait mal tourner avant de le révéler : trois styles
  maison différents au fil des années, des réponses produit périmées, des réponses avec les noms et
  les détails de commande des clients, beaucoup de quasi-doublons de réponses à la même question
  fréquente, et peu d’exemples d’escalade.
- Idée reçue : « plus de données, c’est toujours mieux ». Plus de données incohérentes enseignent
  l’incohérence.
- Idée reçue : « le score de test est élevé, donc ça marche ». Demandez si le jeu de test a
  vraiment été gardé à part et vérifié pour les quasi-doublons.
- Idée reçue : « nous pourrons supprimer les données d’un client du modèle plus tard ». Retirer des
  informations précises d’un modèle entraîné n’a rien de simple ; tenez-les à l’écart dès le départ.
- Ne citez pas de tailles minimales de jeux de données ; elles dépendent de la tâche et de la
  méthode, et le conseil « commencer petit et mesurer » reste valable.
- Ne donnez pas de conseil juridique sur l’usage des données ; dites que le consentement, les
  contrats et les règles de protection des données s’appliquent et doivent être vérifiés.
- Rythme : le scénario des cinq ans de données porte la leçon ; laissez l’apprenant trouver
  lui-même la plupart des problèmes.

## Check your understanding
1. L’équipe de support veut entraîner sur cinq ans de réponses écrites par ses agents. Nommez trois risques de ce jeu de données.
   Good answer: trois parmi : des styles incohérents au fil des années, des réponses produit périmées ou fausses, des données personnelles comme des noms et des détails de commande, des quasi-doublons qui fuiront entre entraînement et test, trop peu de cas difficiles comme des escalades ou des demandes floues.
2. Pourquoi le jeu de test doit-il rester à part, et que se passe-t-il si des tickets quasi identiques se retrouvent dans les deux ensembles ?
   Good answer: le test doit mesurer comment le modèle s’en sort sur des cas qu’il n’a pas vus ; les quasi-doublons lui permettent de marquer des points en se souvenant, donc le score est gonflé et la qualité réelle est plus faible que mesurée.
3. Pourquoi est-il risqué de laisser les noms et adresses des clients dans les données d’entraînement, même si le modèle ne sert qu’en interne ?
   Good answer: les modèles peuvent mémoriser et reproduire leurs données d’entraînement, donc des données personnelles peuvent ressortir dans des réponses à d’autres utilisateurs ; on ne peut pas simplement les retirer du modèle entraîné ensuite ; cela peut aussi enfreindre des règles de protection des données ou des contrats.
4. Pourquoi un jeu d’entraînement doit-il contenir des exemples où la bonne réponse est d’escalader ou de dire « je ne sais pas » ?
   Good answer: le modèle apprend le schéma de ses exemples ; si chaque exemple a une réponse assurée, il apprend à toujours répondre avec assurance, même quand il devrait passer le cas ou reconnaître son incertitude.

## Completion criteria
L’apprenant répond correctement aux questions et sait critiquer un jeu d’entraînement proposé
sur sa qualité, sa couverture, la séparation du test, la vie privée et les données synthétiques
(vérifications 1-4).

## Going further
- Sujets : la déduplication des données, la contamination entre entraînement et test, la
  mémorisation des données d’entraînement, la génération de données synthétiques.
- Leçon suivante : la distillation et les modèles plus petits.
