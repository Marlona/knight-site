import ts from 'typescript';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const dir = await mkdtemp(join(tmpdir(), 'knight-tests-'));
try {
  for (const [name, source] of [['sequences', 'lib/sequences.ts'], ['maintenance', 'worker/maintenance.ts']]) {
    const code = ts.transpileModule(await readFile(source, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
    const file = join(dir, name + '.mjs');
    await writeFile(file, code);
    const subject = await import(pathToFileURL(file).href);
    const suite = await import(`../tests/${name}.mjs`);
    await suite.run(subject);
    console.log(`PASS ${name}`);
  }
} finally { await rm(dir, { recursive: true, force: true }); }
