import express from 'express';
import { inject } from "inversify";
import { DI_TYPES } from "../constantes/di-types";
import { ITotoService } from '../domains/toto/toto.service';
import { Controller, Get, Params, Response } from '@inversifyjs/http-core';

@Controller('/demo')
export class HomeController {

    // Injection de dépendance via le constructeur
    constructor(
        @inject(DI_TYPES.TotoService) private totoService: ITotoService
    ) { }

    @Get()
    public async sayHello1(@Response() response: express.Response) {

        response.json({
            message: 'Hello World'
        });
    }

    @Get('/:id')
    public async SayHello2(
        @Params({ name: 'id', })  id: string,
        @Response() response: express.Response,
    ) {

        const message = this.totoService.sayHello(id);

        response.send({ message });
    }
}