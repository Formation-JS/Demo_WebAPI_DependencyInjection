import "reflect-metadata";
import express from "express";
import { apiReference } from '@scalar/express-api-reference';

// Configuration de Inversify
import './inversify.config';

// Fichiers générés par TSOA
import { RegisterRoutes } from "./generated/routes";
import swaggerDocument from "./generated/swagger.json";



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
    })
  );

  const port = 3000;
  app.listen(port, () => {
    console.log(`WebAPI is running on http://localhost:${port}`);
    console.log(`Documentation Scalar UI : http://localhost:${port}/docs`);
  });
};

webapi();