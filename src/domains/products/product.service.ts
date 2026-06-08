import { injectable } from 'inversify';
import { Product } from './product.entity';
import { NotFoundError } from '../../shared/errors/not-found.error';

export interface IProductService {
  insert(product: Product): Promise<string>;
  delete(id: string): Promise<void>;
  getAll(): Promise<Product[]>;
  getById(id: string): Promise<Product>;
}

@injectable()
export class ProductService implements IProductService {
  private products: Product[];

  constructor() {
    this.products = [];
  }

  async insert(product: Product): Promise<string> {
    this.products.push(product);
    return product.id;
  }

  async delete(id: string): Promise<void> {
    const targetIndex = this.products.findIndex(p => p.id === id);

    if (targetIndex === -1) {
      throw new NotFoundError('Product not exists');
    }
    this.products.splice(targetIndex, 1);
  }

  async getAll(): Promise<Product[]> {
    return this.products;
  }

  async getById(id: string): Promise<Product> {
    const product = this.products.find(p => p.id === id);

    if (!product) {
      throw new NotFoundError('Product not exists');
    }
    return product;
  }
}
