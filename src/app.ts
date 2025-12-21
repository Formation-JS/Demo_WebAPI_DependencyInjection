import "reflect-metadata";

import { InversifyExpressHttpAdapter } from "@inversifyjs/http-express";
import * as express from "express";
import { container } from './inversify.config';

const webapi = async () => {
  const adapter: InversifyExpressHttpAdapter = new InversifyExpressHttpAdapter(
    container,
    {
      logger: true,
      useCookies: true,
      useJson: true,
      useUrlEncoded: true,
    }
  );

  const app: express.Application = await adapter.build();
  const port = 3000;

  app.listen(port, () => {
    console.log(`WebAPI is running on http://localhost:${port}`);
  });
};

webapi();