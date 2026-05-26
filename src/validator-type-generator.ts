import { compile } from 'json-schema-to-typescript';
import fs from 'fs';
import path from 'path';
import { ZodType } from 'zod';

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

  for (const file of files) {
    // Import du module
    const validatorFile = path.join(validatorFolder, file);
    const validatorModule = await import(validatorFile);

    // Parcours des exports nommés du module
    for (const exportName of Object.keys(validatorModule)) {
      const validatorSchema = validatorModule[exportName] as ZodType;

      // Conversion du schema en JSON Schema
      // Alternative en Zod v3 : Utiliser le package "zod-to-json-schema"
      const jsonSchema = validatorSchema.toJSONSchema({
        unrepresentable: "any"
      });
      injectTsoaTagsDynamically(jsonSchema);

      // Generation d'une interface TS avec JSDoc
      const [initialName, ...restName] = exportName.split('');
      const typeName = `${initialName.toUpperCase()}${restName.join('')}Type`;
      const tsCode = await compile(jsonSchema as any, typeName, {
        additionalProperties: false, // Stricte par défaut
        bannerComment: '/* \n * Fichier généré automatiquement depuis Zod.\n * NE PAS MODIFIER MANUELLEMENT.\n */',
        style: { semi: true, singleQuote: true, tabWidth: 4 }
      });

      // Sauvegarde dans le dossier "generated" de TSOA
      const fileTypeName = `${typeName}.ts`;
      fs.writeFileSync(path.join(outDir, fileTypeName), tsCode);

      console.log(` - ${typeName} généré`);
    }
  }
  console.log("Génération terminé avec succès dans /generated/types !");
}

generateModels().catch(console.error);