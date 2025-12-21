# Injection de dépendance en WebAPI avec Express

## Packages utilisés dans cette démo
```
express v5.2
inversify v7
@inversifyjs/http-core v4.8
@inversifyjs/http-express v4.8
```

## Description de la démo
- Configuration d'Inversify 
- Injection des services
- Décorateur pour configurer le routing depuis les controllers
- Exemple d'utilisation de middleware
  - Classe "ExpressMiddleware" :  
    _Pattern natif d'Inversify (Injection d'une classe "ExpressMiddleware")._
  - Builder préconfiguré :  
    _Injection d'un middleware Express standard pré-configuré dans le conteneur (inversify.config.ts)._  
  - Décorateur custom (@UseMiddleware) :  
    _Solution "maison" pour pouvoir utiliser des middlewares Express standards (builders) directement sur les routes (sans passer par la configuration du conteneur)._

## Documentation
- Inversify : https://inversify.io/docs/introduction/getting-started/
- Inversify Framework : https://inversify.io/framework/docs/introduction/getting-started/
- Modules complémentaires :
  - Validation (zod) : https://inversify.io/framework/validation/introduction/getting-started/
  - Swagger : https://inversify.io/framework/openapi/introduction/getting-started/

## Remarque
L'injection de dépendance avec Inversify est assez stricte, il existe des alternatives plus légères : 
- `awilix` et `awilix-express`  \
  _Configuration plus "simple", injection par "nom de variable" sans configuration._  \
  _Mécanisme de routing intégré avec les décorateurs (@route, @GET, @POST, ...)_
- `tsyringe`  \
  _Injection par Constructeur et Décorateur avec configuration légère et explicite._  \
  _Pas d'intégration officielle pour express (Nécessite d'implémenter un connecteur pour la gestion du routing)._
