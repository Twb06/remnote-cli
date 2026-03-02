import { createServer } from 'node:net';

export async function getAvailablePort(host = '127.0.0.1'): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.unref();

    probe.on('error', reject);
    probe.listen(0, host, () => {
      const address = probe.address();
      if (!address || typeof address === 'string') {
        probe.close();
        reject(new Error('Failed to resolve available TCP port'));
        return;
      }

      const { port } = address;
      probe.close(() => resolve(port));
    });
  });
}
