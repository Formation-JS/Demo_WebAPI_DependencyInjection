import { Body, Delete, Get, Path, Post, Route } from 'tsoa';
import { ProductDto } from '../generated/types/models';
import { IOC_TYPES } from '../ioc/types';
import { inject } from 'inversify';
import { IProductService } from '../domains/products/product.service';
import { Product } from '../domains/products/product.entity';
import { NotFoundError } from '../shared/errors/not-found.error';

@Route('/product')
export class ProductController {

  // Injection de dépendance via le constructeur
  constructor(
    @inject(IOC_TYPES.ProductService) private productService: IProductService
  ) { }

  // Définition des routes avec le décorateur
  @Get()
  public async GetAll(
  ): Promise<Product[]> {
    return await this.productService.getAll();
  }

  @Get('/:id')
  public async GetById(
    @Path() id: string
  ): Promise<Product> {
    return await this.productService.getById(id);
  }

  @Post()
  public async Add(
    @Body() productData: ProductDto
  ): Promise<Product> {
    console.log('ProductDto', productData);
    await this.productService.insert(productData);
    return productData;
  }

  @Delete('/:id')
  public async Delete(
    @Path() id: string
  ): Promise<void> {
    await this.productService.delete(id);
  }
}