# Injection de dépendance en WebAPI avec Express
Utilisation de l'injection de dépendance de `inversify`, du routage via `tsoa` et documentation OpenAPI avec `scalar`. 

## Packages utilisés dans cette démo
```
express v5.2
inversify v7
inversify-binding-decorators v4
@scalar/express-api-reference v0.9
tsoa v7 (Alpha)
zod v4
json-schema-to-typescript v15
```

## Description de la démo
- Configuration de `Inversify` 
- Injection des services
- Décorateur `TSOA` pour configurer le routage depuis les contrôleurs
- Exemple d'utilisation de middlewares (simples et avec `Inversify`)
- Utilisation de Zod adaptée à TSOA

## Détails des middlewares

### Simple
Utilisation des middlewares sans exploiter `Inversify`.  
Décorateur à utiliser : `@Middlewares(fct)`.  

### Avec Inversify
Mise en place de middlewares qui exploitent les injections de dépendance.  
Deux décorateurs ont été créés pour cette utilisation : `ResolveMiddleware` et `UseMiddleware`

Scénarios possibles : 
- Classe implémentant `IExpressMiddleware`:  
  Configuration : `container.bind(IOC_TYPES.FooMiddleware).to(FooMiddleware)`  
  Décorateur à utiliser : `@ResolveMiddleware(ref-ioc)`  
  _Permet d'injecter des services dans le middleware (basé sur le pattern natif d'Inversify)._

- Builder préconfiguré :  
  Configuration : `container.bind(IOC_TYPES.BarMiddleware).toConstantValue({ execute: ... })`  
  Décorateur à utiliser : `@ResolveMiddleware(ref-ioc)`  

- Enregistrement à la volée :  
  Pas de configuration  
  Décorateur à utiliser : `@UseMiddleware(fct)`  
  _Solution "maison" pour pouvoir utiliser des middlewares Express standards (builders) dans le mécanisme d'Inversify._

## Zod + Tsoa
La validation de données par `TSOA` est basée sur une utilisation de types TS documentés en JSDoc.  
Dans cette démo, j'ai mis en place une conversion des schémas `Zod` pour générer les fichiers TS.  
_Cas pratique : Utilisation de schémas de validation communs avec l'app client._  

### Utilisation
Le script `src/validator-type-generator.ts` parcourt les schémas du dossier `src/validators` et génère les fichiers TS dans le dossier `src/generated/types`.  

Fonctionnement des commandes :
- `generate:models` : Génération des types basée sur Zod
- `predev` : Commande lançant les outils de génération _(Déclenchement automatique avant `dev`)_
- `dev` : Lancement de l'app avec un watcher

## Documentation
- Inversify : https://inversify.io/docs/introduction/getting-started/
- Inversify Framework : https://inversify.io/framework/docs/introduction/getting-started/
- Tsoa : https://tsoa-community.github.io/docs/getting-started.html

## Remarque
L'injection de dépendance avec Inversify est assez stricte, il existe des alternatives plus légères : 
- `awilix` et `awilix-express`  
  _Configuration plus "simple", injection par "nom de variable" sans configuration._  
  _Mécanisme de routage intégré avec les décorateurs (@route, @GET, @POST, ...)_
- `tsyringe`  
  _Injection par constructeur et décorateur avec configuration légère et explicite._  
  _Pas d'intégration officielle pour Express (nécessite d'implémenter un connecteur pour la gestion du routage)._
