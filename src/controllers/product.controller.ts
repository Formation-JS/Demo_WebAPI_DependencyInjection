import { Body, Get, Path, Post, Route } from 'tsoa';
import { ProductDto } from '../generated/types/models';

@Route('/product')
export class ProductController {

  // Injection de dépendance via le constructeur
  constructor() { }

  // Définition des routes avec le décorateur
  @Get()
  public async GetAll(
  ): Promise<ProductDto[]> {
    throw new Error('Not implemented');
  }

  @Get('/:id')
  public async GetById(
    @Path() id: string
  ): Promise<ProductDto> {
    throw new Error('Not implemented');
  }

  @Post()
  public async Add(
    @Body() productData: Omit<ProductDto, 'id'>
  ): Promise<ProductDto> {
    console.log(productData);
    throw new Error('Not implemented');
  }
}