// ↓ Necessaire si utilisation de l'inversion de dépendence
//   Injection via le symbole et non la classe

export const IOC_TYPES = {
  // Middlewares
  ExampleMiddleware: Symbol.for('ExampleMiddleware'),
  PreconfigMiddleware: Symbol.for('PreconfigMiddleware'),

  // Services
  ExampleService: Symbol.for('ExampleService'),
  ProductService: Symbol.for('ProductService'),
};
