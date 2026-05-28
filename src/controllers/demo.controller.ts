import { inject, injectable } from "inversify";
import { IOC_TYPES } from "../ioc/types";
import { IExampleService } from '../domains/example/example.service';
import { UseMiddleware } from '../decorators/use-middleware.decorator';
import { ExampleBuilderMiddleware } from '../middlewares/example-builder.middleware';
import { Get, Middlewares, Path, Route } from 'tsoa';
import { ResolveMiddleware } from '../decorators/resolve-middleware.decorator';

@Route('/demo')
export class HomeController {

    // Injection de dépendance via le constructeur
    constructor(
        @inject(IOC_TYPES.ExampleService) private exampleService: IExampleService
    ) { }

    // Définition des routes avec le décorateur
    @Get()
    public async sayHelloWorld() {

        return ({
            message: 'Hello World'
        });
    }

    @Get('/name/:id')
    public async sayHelloName(@Path() id: string): Promise<{ message: string; }> {
        const message = this.exampleService.sayHello(id);
        return { message };
    }

    @Get('/middleware-simple')
    @Middlewares(ExampleBuilderMiddleware({ info: "No IOC", nb: -1 }))
    public async getMiddlewareSimple() {

        return ({
            message: 'Route qui utilise un middleware (Hors Inversify) !'
        });
    }

    @Get('/middleware-ioc')
    @ResolveMiddleware(IOC_TYPES.ExampleMiddleware)
    public async getMiddleware() {

        return ({
            message: 'Route qui utilise un middleware liée à l\'ioc de Inversify !'
        });
    }

    @Get('/middleware-builder/1')
    @UseMiddleware(ExampleBuilderMiddleware, { info: "La réponse", nb: 42 })
    public async getMiddlewareBuilder1() {

        return ({
            message: 'Route qui utilise un middleware avec builder (Config 1) !'
        });
    }

    @Get('/middleware-builder/2')
    @UseMiddleware(ExampleBuilderMiddleware, { info: "Lorem Ipsum", nb: 1337 })
    public async getMiddlewareBuilder2() {

        return ({
            message: 'Route qui utilise un middleware avec builder (Config 2) !'
        });
    }

    @Get('/middleware-builder/3')
    @UseMiddleware(ExampleBuilderMiddleware, { info: "La réponse", nb: 42 })
    public async getMiddlewareBuilder3() {

        return ({
            message: 'Route qui utilise un middleware avec builder (Config 3) !'
        });
    }

    @Get('/middleware-builder/4')
    @ResolveMiddleware(IOC_TYPES.PreconfigMiddleware)
    public async getMiddlewareBuilder4() {

        return ({
            message: 'Route qui utilise un middleware avec builder (Config 4) !'
        });
    }
}