import { Container } from "inversify";
import { DI_TYPES } from './constantes/di-types';
import { ITotoService, TotoService } from './domains/toto/toto.service';
import { HomeController } from './controllers/demo.controller';
import { ExampleMiddleware } from './middlewares/example.middleware';

const container = new Container();

// Binding des controllers
container.bind(HomeController).toSelf().inSingletonScope();

// Binding des middlewares
container.bind(DI_TYPES.ExampleMiddleware).to(ExampleMiddleware);

// Binding des services
container.bind<ITotoService>(DI_TYPES.TotoService).to(TotoService);

// Remarque : Possibilité d'ajouter le scope de l'injection via : 
// - inSingletonScope : Une seul et unique instance.
// - inRequestScope : Une instance par requete.
// - inTransientScope : Une instance par utilisation.

export { container };