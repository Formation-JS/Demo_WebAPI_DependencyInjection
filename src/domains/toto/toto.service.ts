import { inject, injectable } from "inversify";
import { LoggerService } from '../../shared/utils/logger.service';

export interface ITotoService {
    sayHello(name: string): string;
}

@injectable()
export class TotoService implements ITotoService {

    constructor(
        @inject(LoggerService) private loggerService: LoggerService
    ) { }

    public sayHello(name: string): string {
        this.loggerService.log('Demo !')
        return `Bonjour ${name} ! Ce message utiliser l'injection de dépendence 🤯`;
    }
}