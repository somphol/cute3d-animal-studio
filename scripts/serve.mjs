#!/usr/bin/env node
// Zero-dependency static server for local development.
//
//   node scripts/serve.mjs          # http://127.0.0.1:4173
//   PORT=8080 node scripts/serve.mjs

import { startServer } from '../tests/lib/harness.mjs';
import { ROOT } from '../tests/lib/fixtures.mjs';

const port = Number(process.env.PORT) || 4173;
const server = await startServer(ROOT, port);
console.log(`Cute3D studio → ${server.url}`);
console.log('Press Ctrl+C to stop.');

const shutdown = async () => {
  await server.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
