import z, { ZodType } from 'zod';
import { compile } from 'json-schema-to-typescript';
import fs from 'fs';
import path from 'path';

const validatorFolder = path.join(__dirname, "./validators");

function injectTsoaTagsDynamically(schema: any): string[] {
  if (!schema || typeof schema !== 'object') return [];

  // Detection magique des dates (et types non représentables)
  // * Si le nœud est totalement vide `{}`, c'est que Zod l'a mis en "any".
  // * On le convertit à la volée en type string ISO pour TSOA.
  // * Alternative : Ajouter un tag "[Date]" dans la description pour le detecter
  const isZodDateFallback =
    (!schema.type || schema.type === 'object' || Array.isArray(schema.type))
    && !schema.properties
    && !schema.anyOf
    && !schema.$ref
    && !schema.items
    && !schema.additionalProperties;

  if (isZodDateFallback) {
    schema.type = 'string';
    schema.format = 'date-time';
    schema.tsType = 'Date';
    schema._isDate = true;
  }

  // Sauvegarde de la description initiale
  let originalDesc = schema.description ? schema.description.trim() : '';
  const bubbledTags: string[] = [];

  // BUBBLING : Remonter les règles des nullables (anyOf) ET des descriptions imbriquées (allOf)
  ['anyOf', 'allOf'].forEach(group => {
    if (Array.isArray(schema[group])) {
      schema[group].forEach((subSchema: any) => {

        //* Ignore les sous-schémas ont un type null
        if (subSchema.type !== 'null') {

          //* Récuperation les tags générés par les sous-schémas
          const subTags = injectTsoaTagsDynamically(subSchema);

          //* Sauvegarde des tags trouvés
          bubbledTags.push(...subTags);

          //* Ajout d'un flag pour les entiers
          if (subSchema.type === 'integer') {
            schema._isInteger = true;
          }

          //* Gestion du type date
          if (subSchema.format && subSchema.tsType !== 'Date' && !subSchema._isDate) {
            schema.format = subSchema.format;
          }
          if (subSchema._isDate) {
            schema._isDate = true;
          }
        }
      });
    }
  });

  // Parcours sécurisé des noeuds schémas
  if (schema.definitions) Object.values(schema.definitions).forEach(injectTsoaTagsDynamically);
  if (schema.properties) Object.values(schema.properties).forEach(injectTsoaTagsDynamically);
  if (schema.items) injectTsoaTagsDynamically(schema.items);
  if (schema.anyOf) schema.anyOf.forEach(injectTsoaTagsDynamically);
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    injectTsoaTagsDynamically(schema.additionalProperties);
  }

  // Génération des tags pour le noeud
  const tags: string[] = [];
  ['minLength', 'maxLength', 'minimum', 'maximum', 'pattern', 'minItems', 'maxItems'].forEach(rule => {
    if (schema[rule] !== undefined) {
      tags.push(`@${rule} ${schema[rule]}`);
      delete schema[rule]; // Fix pour les Tuples (Non supporté)
    }
  });

  // Conversion des tags Zod en TSOA
  if (schema.type === 'integer' || schema._isInteger) tags.push('@isInt');
  if (schema.format === 'email') tags.push('@isEmail');
  if (schema.format === 'date-time' && schema.tsType !== 'Date' && !schema._isDate) {
    tags.push('@isDateTime\n@format date-time');
  }

  // Conversion des Zod min/max exclusive en TSOA min/max
  if (schema.exclusiveMinimum !== undefined && schema.minimum === undefined) {
    const isInt = schema.type === 'integer' || schema._isInteger;
    tags.push(`@minimum ${isInt ? schema.exclusiveMinimum + 1 : schema.exclusiveMinimum}`);
    delete schema.exclusiveMinimum;
  }
  if (schema.exclusiveMaximum !== undefined && schema.maximum === undefined) {
    const isInt = schema.type === 'integer' || schema._isInteger;
    tags.push(`@maximum ${isInt ? schema.exclusiveMaximum - 1 : schema.exclusiveMaximum}`);
    delete schema.exclusiveMaximum;
  }

  // Gestion des valeurs par défaut
  if (schema.default !== undefined) {
    //* Ajout de guillemets pour les valeur de type string
    const defaultVal = typeof schema.default === 'string' ? `"${schema.default}"` : schema.default;
    tags.push(`@default ${defaultVal}`);

    //* Suppression du schéma pour évité les doublons
    delete schema.default;
  }

  // Fusion de tous les tags et de la description sans doublons
  const uniqueTags = [...new Set([...tags, ...bubbledTags])];
  if (uniqueTags.length > 0 || originalDesc) {
    const separator = originalDesc && uniqueTags.length > 0 ? '\n' : '';
    schema.description = originalDesc + separator + uniqueTags.join('\n');
  }

  // Renvoi pour la recusivité (Pour le cas : allOf/anyOf)
  return uniqueTags;
}

// Générateur de type basé sur les schemas Zod
async function generateModels() {
  console.log("Génération des modèles TypeScript depuis Zod");

  // Répértoire de typage généré
  const outDir = path.join(__dirname, './generated/types');
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  // Récuperation des modules de schema Zod
  const files = fs.readdirSync(validatorFolder).filter(f => f.endsWith(".schema.ts"));
  const globalRegistry: Record<string, ZodType> = {};

  for (const file of files) {
    //* Import du module
    const validatorFile = path.join(validatorFolder, file);
    const validatorModule = await import(validatorFile);

    //* Parcours des exports nommés du module
    for (const exportName of Object.keys(validatorModule)) {
      //* Définition du nom du typages
      const [initialName, ...restName] = exportName.split('');
      let typeName = `${initialName.toUpperCase()}${restName.join('')}`;
      typeName = typeName.replace(/(Schema)?$/, 'Dto');

      //* Enregistrement des schemas dans le schema global
      globalRegistry[typeName] = validatorModule[exportName] as ZodType;
    }
  }

  // Création du schema global
  const rootSchema = z.object(globalRegistry);

  // Génération du json en concervant les liens entre les schemas (Utilisation du "ref")
  let jsonSchema: Record<string, any> = rootSchema.toJSONSchema({
    unrepresentable: "any",
    reused: "ref",
    cycles: "ref"
  });

  // Restructuration du json pour la syntaxe TS
  function mapDefsToDefinitions(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.$ref && typeof obj.$ref === 'string' && obj.$ref.startsWith('#/$defs/')) {
      obj.$ref = obj.$ref.replace('#/$defs/', '#/definitions/');
    }
    Object.values(obj).forEach(mapDefsToDefinitions);
  }
  mapDefsToDefinitions(jsonSchema);
  jsonSchema.definitions = jsonSchema.$defs || {};
  delete jsonSchema.$defs;

  // Sauvegarde du nom des définitions principal
  const rootDefNames = new Set(Object.keys(jsonSchema.properties || {}));

  // Detection du nom des définitions à renommer
  const defsToRename: Record<string, string> = {};
  if (jsonSchema.properties) {
    for (const [modelName, propSchema] of Object.entries(jsonSchema.properties)) {
      if ((propSchema as any).$ref) {
        //* Modèle utilisé : Zod l'a mis dans definitions
        const oldDefName = (propSchema as any).$ref.split('/').pop();
        defsToRename[oldDefName] = modelName;
      } else {
        //* Modèle unique : Déplacement manuellement dans les definitions
        jsonSchema.definitions[modelName] = propSchema;
      }
      //* L'interface racine ne contient plus que des $ref
      (jsonSchema.properties as any)[modelName] = { $ref: `#/definitions/${modelName}` };
    }
  }

  // Renommage textuel global des références internes
  function renameRootPointers(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    if (obj.$ref && typeof obj.$ref === 'string' && obj.$ref.startsWith('#/definitions/')) {
      const oldName = obj.$ref.split('/').pop() as string;
      if (defsToRename[oldName]) {
        obj.$ref = `#/definitions/${defsToRename[oldName]}`;
      }
    }
    Object.values(obj).forEach(renameRootPointers);
  }
  renameRootPointers(jsonSchema);

  // Renommage réel des clés dans l'objet definitions
  for (const [oldDef, newDef] of Object.entries(defsToRename)) {
    if (jsonSchema.definitions[oldDef]) {
      jsonSchema.definitions[newDef] = jsonSchema.definitions[oldDef];
      delete jsonSchema.definitions[oldDef];
    }
  }

  // Detection des définitions non mappées qui sont considérées comme "anonymes"
  function inlineAnonymousRefs(obj: any, seen = new Set()) {
    if (!obj || typeof obj !== 'object') return;
    if (seen.has(obj)) return;
    seen.add(obj);

    if (Array.isArray(obj)) {
      obj.forEach(item => inlineAnonymousRefs(item, seen));
      return;
    }
    Object.values(obj).forEach(val => inlineAnonymousRefs(val, seen));

    if (obj.$ref && typeof obj.$ref === 'string' && obj.$ref.startsWith('#/definitions/')) {
      const refName = obj.$ref.split('/').pop() as string;

      //* Utilisation du "rootDefNames" pour conserver les définitions principal 
      if (!rootDefNames.has(refName) && jsonSchema.definitions[refName]) {
        const defContent = jsonSchema.definitions[refName];

        delete obj.$ref;
        const clonedContent = JSON.parse(JSON.stringify(defContent));
        Object.assign(obj, clonedContent);

        seen.delete(obj);
        inlineAnonymousRefs(obj, seen);
      }
    }
  }
  inlineAnonymousRefs(jsonSchema);

  // Suppression des définitions anonymes (désormais absorbées et inutiles)
  for (const defName of Object.keys(jsonSchema.definitions)) {
    if (!rootDefNames.has(defName)) {
      delete jsonSchema.definitions[defName];
    }
  }

  // Injection des tags necessaires pour TSOA
  injectTsoaTagsDynamically(jsonSchema);

  // Generation des interfaces TS avec JSDoc
  let tsCode = await compile(jsonSchema as any, 'IGNORE_ME_ROOT', {
    additionalProperties: false,
    bannerComment: '/* \n * Fichier généré automatiquement depuis Zod.\n * NE PAS MODIFIER MANUELLEMENT.\n */',
    style: { semi: true, singleQuote: true, tabWidth: 4 }
  });

  // Nettoyage de l'interface généré pour schéma "rootSchema"
  tsCode = tsCode.replace(/export interface IGNORE_ME_ROOT\s*\{[^}]*\}/, '').trim();

  // Sauvegarde dans le dossier "generated" de TSOA
  const filenameGenerated = path.join(outDir, 'models.ts');
  fs.writeFileSync(filenameGenerated, tsCode);
  console.log(`Fichier généré : ${filenameGenerated}`);
}

generateModels().catch(console.error);