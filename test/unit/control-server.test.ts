import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest';
import { ControlServer } from '../../src/daemon/control-server.js';
import pino from 'pino';

const TEST_HOST = '127.0.0.1';
let testControlPort = 0;

function createSilentLogger() {
  return pino({ level: 'silent' });
}

function createMockWsServer(connected = false) {
  return {
    isConnected: vi.fn(() => connected),
    sendRequest: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onClientConnect: vi.fn(),
    onClientDisconnect: vi.fn(),
    getBridgeVersion: vi.fn(() => null),
    getCliVersion: vi.fn(() => '0.5.0'),
  };
}

async function fetchJson(path: string, options?: RequestInit) {
  const url = `http://${TEST_HOST}:${testControlPort}${path}`;
  const res = await fetch(url, options);
  return { status: res.status, body: await res.json() };
}

function getBoundPort(server: ControlServer): number {
  const httpServer = (server as unknown as { server?: { address: () => unknown } }).server;
  const address = httpServer?.address();
  if (!address || typeof address !== 'object' || !('port' in address)) {
    throw new Error('ControlServer test could not determine bound port');
  }
  return address.port as number;
}

describe('ControlServer', () => {
  let server: ControlServer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockWs: any;

  beforeEach(async () => {
    mockWs = createMockWsServer();
    server = new ControlServer(0, TEST_HOST, mockWs, createSilentLogger());
    await server.start();
    testControlPort = getBoundPort(server);
  });

  afterEach(async () => {
    await server.stop();
  });

  describe('GET /health', () => {
    it('returns running status', async () => {
      const { status, body } = await fetchJson('/health');
      expect(status).toBe(200);
      expect(body.status).toBe('running');
      expect(body.pid).toBe(process.pid);
      expect(typeof body.uptime).toBe('number');
    });

    it('reports wsConnected from WebSocket server', async () => {
      mockWs.isConnected.mockReturnValue(true);
      const { body } = await fetchJson('/health');
      expect(body.wsConnected).toBe(true);
    });
  });

  describe('POST /execute', () => {
    it('dispatches action to WebSocket server', async () => {
      mockWs.sendRequest.mockResolvedValue({ remId: '123' });

      const { status, body } = await fetchJson('/execute', {
        method: 'POST',
        body: JSON.stringify({ action: 'createNote', payload: { title: 'Test' } }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(status).toBe(200);
      expect(body.result).toEqual({ remId: '123' });
      expect(mockWs.sendRequest).toHaveBeenCalledWith('createNote', { title: 'Test' });
    });

    it('returns error when action is missing', async () => {
      const { status, body } = await fetchJson('/execute', {
        method: 'POST',
        body: JSON.stringify({ payload: {} }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(status).toBe(400);
      expect(body.error).toContain('Missing action');
    });

    it('enriches get_status with cliVersion', async () => {
      mockWs.sendRequest.mockResolvedValue({ connected: true, pluginVersion: '0.5.0' });
      mockWs.getBridgeVersion.mockReturnValue('0.5.0');
      mockWs.getCliVersion.mockReturnValue('0.5.0');

      const { status, body } = await fetchJson('/execute', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_status', payload: {} }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(status).toBe(200);
      expect(body.result.cliVersion).toBe('0.5.0');
      expect(body.result.version_warning).toBeUndefined();
    });

    it('includes version_warning when bridge version mismatches', async () => {
      mockWs.sendRequest.mockResolvedValue({ connected: true });
      mockWs.getBridgeVersion.mockReturnValue('0.6.0');
      mockWs.getCliVersion.mockReturnValue('0.5.0');

      const { body } = await fetchJson('/execute', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_status', payload: {} }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(body.result.version_warning).toContain('Version mismatch');
    });

    it('injects version_warning when bridge version null but pluginVersion in result mismatches', async () => {
      mockWs.sendRequest.mockResolvedValue({ connected: true, pluginVersion: '0.5.0' });
      mockWs.getBridgeVersion.mockReturnValue(null);
      mockWs.getCliVersion.mockReturnValue('0.6.0');

      const { body } = await fetchJson('/execute', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_status', payload: {} }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(body.result.version_warning).toContain('Version mismatch');
    });

    it('returns error when WebSocket request fails', async () => {
      mockWs.sendRequest.mockRejectedValue(new Error('not connected'));

      const { status, body } = await fetchJson('/execute', {
        method: 'POST',
        body: JSON.stringify({ action: 'test', payload: {} }),
        headers: { 'Content-Type': 'application/json' },
      });

      expect(status).toBe(500);
      expect(body.error).toContain('not connected');
    });
  });

  describe('POST /shutdown', () => {
    it('returns shutdown acknowledgement', async () => {
      const shutdownFn = vi.fn();
      server.onShutdown(shutdownFn);

      const { status, body } = await fetchJson('/shutdown', { method: 'POST' });
      expect(status).toBe(200);
      expect(body.result).toBe('shutting down');

      // Allow setImmediate to fire
      await new Promise((r) => setTimeout(r, 50));
      expect(shutdownFn).toHaveBeenCalled();
    });
  });

  describe('unknown routes', () => {
    it('returns 404 for unknown path', async () => {
      const { status, body } = await fetchJson('/unknown');
      expect(status).toBe(404);
      expect(body.error).toBe('Not found');
    });
  });
});
