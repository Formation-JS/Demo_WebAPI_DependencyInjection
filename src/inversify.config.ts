import { Container } from "inversify";
import { DI_TYPES } from './constantes/di-types';
import { ITotoService, TotoService } from './domains/toto/toto.service';
import { HomeController } from './controllers/demo.controller';

const container = new Container();

// Binding des controllers
container.bind(HomeController).toSelf();

// Binding du service
container.bind<ITotoService>(DI_TYPES.TotoService).to(TotoService);

export { container };