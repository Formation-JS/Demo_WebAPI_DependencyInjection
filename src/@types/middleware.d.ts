import { RequestHandler } from 'express';

// Interface pour les middlewares qui exploite l'injection de dépendence
export interface IExpressMiddleware {
  execute: RequestHandler;
}
