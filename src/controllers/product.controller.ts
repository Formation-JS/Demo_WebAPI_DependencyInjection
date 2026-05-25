import { Body, Get, Path, Post, Route } from 'tsoa';
import { ProductSchemaType } from '../generated/types/ProductSchemaType';

@Route('/product')
export class ProductController {

  // Injection de dépendance via le constructeur
  constructor() { }

  // Définition des routes avec le décorateur
  @Get()
  public async GetAll(
  ): Promise<ProductSchemaType[]> {
    throw new Error('Not implemented');
  }

  @Get('/:id')
  public async GetById(
    @Path() id: string
  ): Promise<ProductSchemaType> {
    throw new Error('Not implemented');
  }

  @Post()
  public async Add(
    @Body() productData: Omit<ProductSchemaType, 'id'>
  ): Promise<ProductSchemaType> {
    throw new Error('Not implemented');
  }
}