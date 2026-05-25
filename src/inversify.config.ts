import { iocContainer as container } from './ioc/container';
import { IOC_TYPES } from './ioc/types';
import { ITotoService, TotoService } from './domains/toto/toto.service';
import { HomeController } from './controllers/demo.controller';
import { ExampleClassMiddleware } from './middlewares/example-class.middleware';
import { ExampleBuilderMiddleware } from './middlewares/example-builder.middleware';
import { ProductController } from './controllers/product.controller';
import { LoggerService } from './shared/utils/logger.service';

// Binding des controllers
container.bind(HomeController).toSelf().inSingletonScope();
container.bind(ProductController).toSelf().inSingletonScope();

// Binding des middlewares
// - Classe de type "ExpressMiddleware"
container.bind(IOC_TYPES.ExampleMiddleware).to(ExampleClassMiddleware);
// - Builder avec pré-configuration
container.bind(IOC_TYPES.PreconfigMiddleware).toConstantValue({
  execute: ExampleBuilderMiddleware({ info: 'Préconfiguré', nb: 0 })
});

// Binding des services
// - Injection du service via la classe
container.bind(LoggerService).toSelf();
// - Injection avec inversion de dépendence (via un symbole et interface)
container.bind<ITotoService>(IOC_TYPES.TotoService).to(TotoService);

// Remarque : Possibilité d'ajouter le scope de l'injection via : 
// - inSingletonScope : Une seul et unique instance.
// - inRequestScope : Une instance par requete.
// - inTransientScope : Une instance par utilisation.
