import { inject, injectable } from "inversify";
import { LoggerService } from '../../shared/utils/logger.service';

export interface IExampleService {
    sayHello(name: string): string;
}

@injectable()
export class ExampleService implements IExampleService {

    constructor(
        @inject(LoggerService) private loggerService: LoggerService
    ) { }

    public sayHello(name: string): string {
        this.loggerService.log('Demo !')
        return `Bonjour ${name} ! Ce message utiliser l'injection de dépendence 🤯`;
    }
}