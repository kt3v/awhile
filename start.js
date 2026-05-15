import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
process.chdir(root);

console.log('Building...');
execSync('npm run build', { stdio: 'inherit', cwd: root });

await import('./server/index.js');
