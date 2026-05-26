import z, { ZodType } from 'zod';
import { compile } from 'json-schema-to-typescript';
import fs from 'fs';
import path from 'path';

const validatorFolder = path.join(__dirname, "./validators");

function injectTsoaTagsDynamically(schema: any) {
  if (!schema || typeof schema !== 'object') return;

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

  // Parcours sécurisé des noeuds schémas
  if (schema.definitions) Object.values(schema.definitions).forEach(injectTsoaTagsDynamically);
  if (schema.properties) Object.values(schema.properties).forEach(injectTsoaTagsDynamically);
  if (schema.items) injectTsoaTagsDynamically(schema.items);
  if (schema.anyOf) schema.anyOf.forEach(injectTsoaTagsDynamically);
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    injectTsoaTagsDynamically(schema.additionalProperties);
  }

  // BUBBLING : Remonter les règles des .nullable() vers le parent
  if (Array.isArray(schema.anyOf)) {
    schema.anyOf.forEach((subSchema: any) => {
      // On isole le sous-schéma qui contient les vraies règles (on ignore le null)
      if (subSchema.type !== 'null') {
        // On copie les règles cachées vers le parent
        ['minLength', 'maxLength', 'minimum', 'maximum', 'pattern', 'exclusiveMinimum', 'minItems', 'maxItems'].forEach(rule => {
          if (subSchema[rule] !== undefined) schema[rule] = subSchema[rule];
        });

        // On conserve l'indication d'entier
        if (subSchema.type === 'integer') schema._isInteger = true;

        // Gestion du type date
        if (subSchema.format && subSchema.tsType !== 'Date' && !subSchema._isDate) {
          schema.format = subSchema.format;
        }
        if (subSchema._isDate) schema._isDate = true;
      }
    });
  }

  // Génération des tags jsdoc pour tsoa
  const tags: string[] = [];
  ['minLength', 'maxLength', 'minimum', 'maximum', 'pattern', 'minItems', 'maxItems'].forEach(rule => {
    if (schema[rule] !== undefined) {
      tags.push(`@${rule} ${schema[rule]}`);
      delete schema[rule]; // Fix pour les Tuples (Non supporté)
    }
  });

  // Conversion Zod exclusiveMinimum -> TSOA minimum
  if (schema.exclusiveMinimum !== undefined && schema.minimum === undefined) {
    const isInt = schema.type === 'integer' || schema._isInteger;
    tags.push(`@minimum ${isInt ? schema.exclusiveMinimum + 1 : schema.exclusiveMinimum}`);
    delete schema.exclusiveMinimum; // Fix pour les Tuples
  }

  if (schema.type === 'integer' || schema._isInteger) tags.push('@isInt');
  if (schema.format === 'email') tags.push('@isEmail');
  if (schema.format === 'date-time' && schema.tsType !== 'Date' && !schema._isDate) {
    tags.push('@isDateTime\n@format date-time');
  }

  //! Injection finale dans la description existante (en évitant les doublons)
  if (tags.length > 0) {
    const uniqueTags = [...new Set(tags)];
    const existingDesc = schema.description ? schema.description.trim() + '\n' : '';
    schema.description = existingDesc + uniqueTags.join('\n');
  }
}

// Générateur de type basé sur les schemas Zod (commun avec le frontend)
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
    // Import du module
    const validatorFile = path.join(validatorFolder, file);
    const validatorModule = await import(validatorFile);

    // Parcours des exports nommés du module
    for (const exportName of Object.keys(validatorModule)) {
      // Définition du nom du typages
      const [initialName, ...restName] = exportName.split('');
      let typeName = `${initialName.toUpperCase()}${restName.join('')}`;
      typeName = typeName.replace('Schema', 'SchemaType');

      // Enregistrement des schemas dans le schema global
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

  // Restructuration du json pour correspondre à la syntaxe TS
  let schemaStr = JSON.stringify(jsonSchema);
  schemaStr = schemaStr.replace(/#\/\$defs\//g, '#/definitions/');
  jsonSchema = JSON.parse(schemaStr);

  jsonSchema.definitions = jsonSchema.$defs || {};
  delete jsonSchema.$defs;

  const defsToRename: Record<string, string> = {};

  if (jsonSchema.properties) {
    for (const [modelName, propSchema] of Object.entries(jsonSchema.properties)) {
      if ((propSchema as any).$ref) {
        // Ce modèle est utilisé ailleurs, Zod l'a mis dans definitions sous un faux nom
        const oldDefName = (propSchema as any).$ref.split('/').pop();
        defsToRename[oldDefName] = modelName;
      } else {
        // Modèle unique : on le déplace manuellement dans les definitions
        jsonSchema.definitions[modelName] = propSchema;
      }
      // L'interface racine ne contient plus QUE des pointeurs ($ref)
      (jsonSchema.properties as any)[modelName] = { $ref: `#/definitions/${modelName}` };
    }
  }

  // Detection des definitions (ex: array) qui n'ont été pas reprit dans le renommage
  let anonymousCount = 1;
  for (const [defName, defContent] of Object.entries(jsonSchema.definitions)) {
    if (!defsToRename[defName] && /^_{0,2}schema\d+$/.test(defName)) {
      
      // Ajoute au dictionnaire de renommage global
      defsToRename[defName] = `AnonymousType__${anonymousCount++}`;
    }
  }

  // Renommage textuel global des références internes
  schemaStr = JSON.stringify(jsonSchema);
  for (const [oldDef, newDef] of Object.entries(defsToRename)) {
    schemaStr = schemaStr.replace(new RegExp(`#/definitions/${oldDef}(?=[^a-zA-Z0-9_-]|$)`, 'g'), `#/definitions/${newDef}`);
  }
  jsonSchema = JSON.parse(schemaStr);

  // Renommage réel des clés dans l'objet definitions
  for (const [oldDef, newDef] of Object.entries(defsToRename)) {
    if (jsonSchema.definitions[oldDef]) {
      jsonSchema.definitions[newDef] = jsonSchema.definitions[oldDef];
      delete jsonSchema.definitions[oldDef];
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