import { container } from './ioc/container';
import { IOC_TYPES } from './ioc/types';
import { ITotoService, TotoService } from './domains/toto/toto.service';
import { HomeController } from './controllers/demo.controller';
import { ExampleClassMiddleware } from './middlewares/example-class.middleware';
import { ExampleBuilderMiddleware } from './middlewares/example-builder.middleware';

// Binding des controllers
container.bind(HomeController).toSelf().inSingletonScope();

// Binding des middlewares
// - Classe de type "ExpressMiddleware"
container.bind(IOC_TYPES.ExampleMiddleware).to(ExampleClassMiddleware);
// - Builder avec pré-configuration
container.bind(IOC_TYPES.PreconfigMiddleware).toConstantValue({
  execute: ExampleBuilderMiddleware({ info: 'Préconfiguré', nb: 0 })
});

// Binding des services
container.bind<ITotoService>(IOC_TYPES.TotoService).to(TotoService);

// Remarque : Possibilité d'ajouter le scope de l'injection via : 
// - inSingletonScope : Une seul et unique instance.
// - inRequestScope : Une instance par requete.
// - inTransientScope : Une instance par utilisation.
