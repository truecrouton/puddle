import { convertFromDirectory } from 'joi-to-typescript';
import path from 'path';

const schemaPath = path.join(__dirname, './');
console.log(`Converting ${schemaPath}`);

convertFromDirectory({
  schemaDirectory: schemaPath,
  typeOutputDirectory: path.join(__dirname, '../interfaces'),
  sortPropertiesByName: true,
  indexAllToRoot: true,
  defaultInterfaceSuffix: 'Interface',
  schemaFileSuffix: 'schema',
  interfaceFileSuffix: 'generated',
  inputFileFilter: /schema\.ts$/i
});