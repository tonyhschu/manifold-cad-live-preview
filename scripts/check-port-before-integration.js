#!/usr/bin/env node

/**
 * Integration Pre-Test Port Check
 *
 * Fails fast if port 3000 is already in use. Many integration tests start
 * a dev server on port 3000; running them while the port is occupied leads
 * to confusing EADDRINUSE failures mid-suite.
 */

import net from 'net';

const PORT = 4000; // Keep this aligned with tests' default dev server port

function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      // EADDRINUSE => port is taken
      if (err && /** @type {{ code?: string }} */(err).code === 'EADDRINUSE') {
        resolve(false);
      } else {
        // Any other error, be conservative and treat as unavailable
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    // Bind to localhost only; CI environments commonly allow this
    server.listen(port, '127.0.0.1');
  });
}

(async () => {
  const available = await checkPortAvailable(PORT);
  if (!available) {
    console.error('❌ INTEGRATION PRECHECK FAILED');
    console.error(`Port ${PORT} is already in use.`);
    console.error('Integration tests expect to start a dev server on this port.');
    console.error('\nTo resolve:');
    console.error(`  1) Stop the process using port ${PORT}`);
    console.error(`     macOS: lsof -i :${PORT} -sTCP:LISTEN -n -P`);
    console.error('           kill -9 <PID>');
    console.error('  2) Or adjust tests to use a different port (e.g. 3010) and rerun');
    process.exit(1);
  } else {
    console.log(`✅ Port check passed - port ${PORT} is available`);
  }
})().catch((err) => {
  console.error('❌ Integration precheck encountered an unexpected error:', err?.message || err);
  process.exit(1);
});

