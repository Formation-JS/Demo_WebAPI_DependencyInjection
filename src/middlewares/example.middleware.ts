import { ExpressMiddleware } from '@inversifyjs/http-express';
import type { NextFunction, Request, Response } from 'express';


// Middleware class pour l'exemple avec l'injection de dépendence
export class ExampleMiddleware implements ExpressMiddleware {

  // Middleware Express
  public execute(req: Request, res: Response, next: NextFunction): void {

    // Traitement pour l'exemple
    console.log(`[Example middleware] ${req.url} ${new Date().toLocaleString()}`);

    // Passer au middleware suivant
    next();

  }
}