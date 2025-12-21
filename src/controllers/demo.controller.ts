import express from 'express';
import { inject } from "inversify";
import { DI_TYPES } from "../constantes/di-types";
import { ITotoService } from '../domains/toto/toto.service';
import { ApplyMiddleware, Controller, Get, Params, Response } from '@inversifyjs/http-core';


@Controller('/demo')
export class HomeController {

    // Injection de dépendance via le constructeur
    constructor(
        @inject(DI_TYPES.TotoService) private totoService: ITotoService
    ) { }

    // Définition des routes avec le décorateur
    @Get()
    public async sayHelloWorld(
        @Response() response: express.Response
    ) {
        response.json({
            message: 'Hello World'
        });
    }

    @Get('/name/:id')
    public async sayHelloName(
        @Params({ name: 'id', })  id: string,
        @Response() response: express.Response,
    ) {
        const message = this.totoService.sayHello(id);
        response.send({ message });
    }

    @Get('/middleware')
    @ApplyMiddleware(DI_TYPES.ExampleMiddleware)
    public async getMiddleware(
        @Response() response: express.Response
    ) {
        response.json({
            message: 'Route qui utilise un middleware !'
        });
    }
}