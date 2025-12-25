#!/usr/bin/env node

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const yamlPath = path.join(__dirname, '..', 'backend', 'openapi.yaml');
const outputPath = path.join(__dirname, '..', 'backend', 'openapi-spec.ts');

console.log(`Reading ${yamlPath}...`);
const spec = yaml.load(fs.readFileSync(yamlPath, 'utf8'));

const content = `// Auto-generated from openapi.yaml
// Do not edit manually - run: npm run generate:openapi

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const openApiSpec: any = ${JSON.stringify(spec, null, 2)};
`;

fs.writeFileSync(outputPath, content);
console.log(`Generated ${outputPath}`);
