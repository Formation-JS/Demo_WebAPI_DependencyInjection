import type { NextFunction, Request, Response } from 'express';

// Interface pour les middlewares qui exploite l'injection de dépendence
export interface IExpressMiddleware {
    execute(req: Request, res: Response, next: NextFunction): void | Promise<void>;
}