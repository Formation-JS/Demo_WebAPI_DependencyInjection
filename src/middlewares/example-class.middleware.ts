import type { NextFunction, Request, Response } from 'express';
import { IExpressMiddleware } from '../@types/middleware';


//! Middleware class pour l'exemple avec l'injection de dépendence
// Remarque : Celui-ci n'est pas configurable comme avec le systeme de "Builder"
export class ExampleClassMiddleware implements IExpressMiddleware {

  // Middleware Express
  public execute(req: Request, res: Response, next: NextFunction): void {

    // Traitement pour l'exemple
    console.log(`[Example middleware] ${req.url} : ${new Date().toLocaleString()}`);

    // Passer au middleware suivant
    next();

  }
}