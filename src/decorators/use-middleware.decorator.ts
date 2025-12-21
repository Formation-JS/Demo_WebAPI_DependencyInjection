import { container } from '../ioc/container';
import { ApplyMiddleware } from '@inversifyjs/http-core';
import { RequestHandler } from 'express';
import hash from 'object-hash';

//! Pattern pour utiliser des middlewares qui utilise un builder qui retourne un RequestHandler

// Type des fonctions Builder
export type MiddlewareBuilder = (config: any) => RequestHandler;

// Mécanisme de cache pour éviter des bindings identiques (Optimisation)
const middlewareCache = new Map<string, symbol>();

// Décorateur pour exploiter les middlewares avec l'injection de dépendence de Inversify.
export function UseMiddleware(builder: MiddlewareBuilder, config: any) {

  // Clef de hashage pour identifier le middleware (Optimisation)
  const cacheKey = `${builder.name || 'AnonymousBuilder'}-${hash(config)}`;

  // Vérification si le middleware doit être ajouter au conteneur Inversify
  let middlewareSymbol = middlewareCache.get(cacheKey);

  // Enregistrement du middleware à la volé
  if (!middlewareSymbol) {

    // Création du symbole
    middlewareSymbol = Symbol.for(cacheKey);

    // Middleware à injecter dans le container
    const middlewareAdapter = {
        execute: builder(config)
    };

    // Ajout du middleware dans le mecanisme d'injection de dépendence
    if (!container.isBound(middlewareSymbol)) {
      container.bind(middlewareSymbol).toConstantValue(middlewareAdapter);
    }

    // On sauvegarde dans le cache pour réutilisation
    middlewareCache.set(cacheKey, middlewareSymbol);
    console.log(`[UseMiddleware] Auto-binding : ${cacheKey}`);
  }

  // Utilisation du « ApplyMiddleware »
  return ApplyMiddleware(middlewareSymbol);
}