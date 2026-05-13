# Migration de la démo « Inversify » vers « Inversify + TSOA »

## Les packages
### Désinstallation
```
@inversifyjs/http-core
@inversifyjs/http-express
```
### Installation
```
tsoa
@scalar/express-api-reference
inversify-binding-decorators
```

## Adaptations
### Conteneur IOC
TSOA s'attend à recevoir le conteneur d'injection nommé `iocContainer`.  
Le `decorate(...)` s'assure que la classe de base Controller de TSOA est compatible avec Inversify.  
```js
import { Container, decorate, injectable } from "inversify";
import { buildProviderModule } from "inversify-binding-decorators";
import { Controller } from "tsoa";

const iocContainer = new Container();

decorate(injectable(), Controller);

iocContainer.load(buildProviderModule());

export { iocContainer };
```

Adapter les fichiers l'utilisant via un alias `import { iocContainer as container } from '../ioc/container';`

### Configuration pour TSOA
Créer un fichier de configuration `tsoa.json`.  
Exemple de fichier :  
```json
{
  "entryFile": "src/app.ts",
  "noImplicitAdditionalProperties": "throw-on-extras",
  "controllerPathGlobs": [
    "src/controllers/**/*.ts"
  ],
  "spec": {
    "outputDirectory": "src/generated",
    "specVersion": 3
  },
  "routes": {
    "routesDir": "src/generated",
    "iocModule": "src/ioc/container.ts"
  }
}
```

### Configuration pour TS
Adapter la configuration du fichier `tsconfig.json` pour gérer les modules JSON.  
Ajouter la ligne `"resolveJsonModule": true` dans `compilerOptions`

### Gestion de git
Ajouter la ligne `src/generated` dans le fichier `.gitignore`

### Adaptation de l'application WebAPI
Importer les routes et la documentation générées de `tsoa`
```js
import { RegisterRoutes } from "./generated/routes";
import swaggerDocument from "./generated/swagger.json";
```

Modifier la création de l'app : 
- Ne plus utiliser `InversifyExpressHttpAdapter`.  
- Utiliser les routes générées par `tsoa` via `RegisterRoutes(app)`.
- Configurer Scalar avec le middleware `apiReference`.

### Utilisation des middlewares
Les deux solutions peuvent être adaptées, pas de problème de compatibilité.

#### Sans utiliser le conteneur IOC de Inversify
Utiliser le décorateur `@Middlewares(fct)` de `tsoa`.

#### Exploitation de l'injection de dépendances
Copier les deux décorateurs : 
- decorators/resolve-middleware.decorator.ts  
  _Adaptateur pour utiliser les middlewares d'Inversify dans TSOA_
- decorators/use-middleware.decorator.ts  
  _Adaptateur qui enregistre à la volée les middlewares dans l'IOC_
