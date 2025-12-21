import express from 'express';
import { inject } from "inversify";
import { IOC_TYPES } from "../ioc/types";
import { ITotoService } from '../domains/toto/toto.service';
import { ApplyMiddleware, Controller, Get, Params, Response } from '@inversifyjs/http-core';
import { UseMiddleware } from '../decorators/use-middleware.decorator';
import { ExampleBuilderMiddleware } from '../middlewares/example-builder.middleware';


@Controller('/demo')
export class HomeController {

    // Injection de dépendance via le constructeur
    constructor(
        @inject(IOC_TYPES.TotoService) private totoService: ITotoService
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
    @ApplyMiddleware(IOC_TYPES.ExampleMiddleware)
    public async getMiddleware(
        @Response() response: express.Response
    ) {
        response.json({
            message: 'Route qui utilise un middleware !'
        });
    }
    
    @Get('/middleware-builder/1')
    @UseMiddleware(ExampleBuilderMiddleware, { info: "La réponse", nb: 42 })
    public async getMiddlewareBuilder1(
        @Response() response: express.Response,
    ) {
        response.json({
            message: 'Route qui utilise un middleware avec builder (Config 1) !'
        });
    }
        
    @Get('/middleware-builder/2')
    @UseMiddleware(ExampleBuilderMiddleware, { info: "Lorem Ipsum", nb: 1337 })
    public async getMiddlewareBuilder2(
        @Response() response: express.Response,
    ) {
        response.json({
            message: 'Route qui utilise un middleware avec builder (Config 2) !'
        });
    }
        
    @Get('/middleware-builder/3')
    @UseMiddleware(ExampleBuilderMiddleware, { info: "La réponse", nb: 42 })
    public async getMiddlewareBuilder3(
        @Response() response: express.Response,
    ) {
        response.json({
            message: 'Route qui utilise un middleware avec builder (Config 3) !'
        });
    }
}