import { Request, Response, NextFunction } from 'express';
import { iocContainer as container } from '../ioc/container';
import { Middlewares } from 'tsoa';

// Lien entre TSOA et Inversify
export function ResolveMiddleware(symbol: symbol): ClassDecorator & MethodDecorator {
  const middlewareIOC = (req: Request, res: Response, next: NextFunction) => {
    const middleware = container.get<any>(symbol);

    if (typeof middleware.execute === 'function') {
      return middleware.execute(req, res, next);
    }
    return middleware(req, res, next);
  };

  return Middlewares(middlewareIOC);
}
