// The Velvet Vault — hand-in program (Node 22, standard library only).
// It copies this repository's game/ and screenshots/ into /output (or the
// directory MAKEFUN_OUTPUT_DIR names) and writes /output/dossier.json with
// the vendored make.fun library, so the judge reads exactly the game that
// was built. A missing screenshots/ folder is fine: screenshots are taken
// after the game, and the program still hands the game in.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps, as the kit's starter hands them in: the dossier text
// is capped, and the game and screenshot limits refuse an entry the scorer
// would refuse, so a bad hand-in fails here instead of on the server.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
console.log(`The Velvet Vault handed in to ${out}`);
