import 'reflect-metadata';
import { apiReference } from '@scalar/express-api-reference';
import express, { ErrorRequestHandler } from 'express';
import { ValidateError } from 'tsoa';

// Configuration de Inversify
import './inversify.config';

// Fichiers générés par TSOA
import { RegisterRoutes } from './generated/routes';
import swaggerDocument from './generated/swagger.json';
import { NotFoundError } from './shared/errors/not-found.error';

const webapi = async () => {
  const app = express();

  // Middlewares de base
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes générées par TSOA (qui utilise Inversify)
  RegisterRoutes(app);

  // Configuration de Scalar UI avec le JSON généré par TSOA
  app.use(
    '/docs',
    apiReference({
      // @ts-expect-error : Bug de typage dans @scalar/express-api-reference
      spec: {
        content: swaggerDocument,
      },
      theme: 'elysiajs',
    }),
  );

  const errorMiddleware: ErrorRequestHandler = (error, req, res, next) => {
    // Erreurs 404
    if (error instanceof NotFoundError) {
      res.status(404).json({
        message: error.message,
      });
      return;
    }

    // Erreurs de validation TSOA
    if (error instanceof ValidateError) {
      console.warn('[Validation Error]', error);
      res.status(422).json({
        message: 'Erreur de validation des données',
        details: error?.fields,
      });
      return;
    }

    // Erreurs serveur
    if (error instanceof Error) {
      console.error('[Server Error]', error);
      res.status(500).json({
        message: 'Erreur interne du serveur',
      });
      return;
    }

    next();
  };
  app.use(errorMiddleware);

  const port = 3000;
  app.listen(port, () => {
    console.log(`WebAPI is running on http://localhost:${port}`);
    console.log(`Documentation Scalar UI : http://localhost:${port}/docs`);
  });
};

webapi();
