import { injectable } from "inversify";

export interface ITotoService {
    sayHello(name: string): string;
}

@injectable()
export class TotoService implements ITotoService {

    public sayHello(name: string): string {
        return `Bonjour ${name} ! Ce message utiliser l'injection de dépendence 🤯`;
    }
}