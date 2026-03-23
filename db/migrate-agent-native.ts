import { getDb } from '../lib/db';

async function migrate() {
  const db = getDb();

  console.log('Adding agent_native column...');
  
  // Check if column already exists
  const tableInfo = await db.execute("PRAGMA table_info(entries)");
  const hasColumn = tableInfo.rows.some((row: any) => row.name === 'agent_native');
  
  if (!hasColumn) {
    await db.execute({ sql: 'ALTER TABLE entries ADD COLUMN agent_native INTEGER DEFAULT 0', args: [] });
    console.log('Column added.');
  } else {
    console.log('Column already exists, skipping ALTER.');
  }

  // Mark the 15 agent-native entries
  const agentNativeNames = [
    'AgentHotspot',
    'Composio',
    'LightningProx',
    'MCP Market',
    'MCPize',
    'Moesif',
    'Poe (by Quora)',
    'Pyrimid Protocol',
    'Smithery',
    'Smithery Skills',
    'Stripe Agent Toolkit',
    'Stripe MCP Server',
    'The MCP Server Store',
    'x402 Monetized APIs',
    'x402 Protocol (Coinbase)',
  ];

  const placeholders = agentNativeNames.map(() => '?').join(', ');
  const result = await db.execute({
    sql: `UPDATE entries SET agent_native = 1 WHERE name IN (${placeholders})`,
    args: agentNativeNames,
  });

  console.log(`Marked ${result.rowsAffected} entries as agent_native.`);
  console.log('Migration complete.');
}

migrate().catch(console.error);
