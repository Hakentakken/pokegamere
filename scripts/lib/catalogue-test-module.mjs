// Keep the existing standalone handler tests isolated from Vite and live APIs.
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function moduleUrl(file, replacements = []) {
  let source = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
  for (const [from, to] of replacements) source = source.replace(from, to);
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return 'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64');
}
const dataUrl = moduleUrl('src/data/catalogueDescriptions.ts');
export const contentModuleUrl = moduleUrl('src/lib/catalogueContent.ts', [['../data/catalogueDescriptions.js', dataUrl]]);
export const catalogueModuleUrl = moduleUrl('server/catalogue.ts', [['../src/lib/catalogueContent.js', contentModuleUrl]]);
export const revisionModuleUrl = dataUrl;
