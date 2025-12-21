import { Request, Response, NextFunction, RequestHandler } from 'express';


//! Middleware Builder (Standard Express) qui peut être utiliser avec le decorateur custom "UseMiddleware"
type ExampleBuilderMiddlewareConfig = {
  info: string;
  nb: number;
};

export function ExampleBuilderMiddleware (config: ExampleBuilderMiddlewareConfig) : RequestHandler {

  // Middleware Express
  return (req: Request, res: Response, next: NextFunction) => {

    // Traitement pour l'exemple
    console.log(`[Example builder] ${req.url} : ${config.info} ${config.nb}`);

    // Passer au middleware suivant
    next();

  };

}