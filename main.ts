// Solmara Skies — the hand-in program for make.fun's "Make the best
// flight game" bounty (Node 22, standard library only).
//
// The repository holds the game as plain static files under game/ and
// the screenshots under screenshots/. This program copies both into
// the output directory and writes dossier.json there, using the
// vendored make.fun library, exactly the shape the gate expects:
// game/, screenshots/ and dossier.json, nothing else.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');

mkdirSync(outputDir, { recursive: true });
cpSync(gameDir, join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The caps the gate enforces, so a bad hand-in fails here first
// instead of on the scorer: at most 4 screenshots of 256 KiB each,
// at most 993 files and 48 MiB under game/, and no game path over
// 1,000 bytes, with the dossier text capped at 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
