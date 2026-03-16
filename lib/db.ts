import { createClient, Client } from '@libsql/client';

let _db: Client | null = null;

function getDb(): Client {
  if (!_db) {
    _db = createClient({
      url: process.env.DATABASE_URL || 'file:local.db',
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
    });
  }
  return _db;
}

// Proxy that lazily initializes — compatible with `import db from '@/lib/db'`
const db = new Proxy({} as Client, {
  get(_target, prop) {
    const client = getDb();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export default db;
export { getDb };
