import fs from 'fs';
import path from 'path';

const REQUIRED_ROUTES: { filePath: string; methods: string[]; description: string }[] = [
  { filePath: 'app/api/v1/health/route.ts', methods: ['GET'], description: 'Health check' },
  { filePath: 'app/api/v1/entries/route.ts', methods: ['GET'], description: 'List/create entries' },
  { filePath: 'app/api/v1/entries/[id]/route.ts', methods: ['GET'], description: 'Single entry' },
  { filePath: 'app/api/v1/entries/[id]/vote/route.ts', methods: ['POST'], description: 'Vote on entry' },
  { filePath: 'app/api/v1/discover/route.ts', methods: ['GET'], description: 'Discover/search' },
  { filePath: 'app/api/v1/jobs/route.ts', methods: ['GET'], description: 'List/create jobs' },
  { filePath: 'app/api/v1/jobs/[id]/route.ts', methods: ['GET'], description: 'Single job' },
  { filePath: 'app/api/v1/jobs/tweet-to-earn/route.ts', methods: ['GET'], description: 'Tweet-to-earn job details' },
  { filePath: 'app/api/v1/jobs/tweet-to-earn/submit/route.ts', methods: ['POST'], description: 'Submit tweet' },
  { filePath: 'app/api/v1/jobs/tweet-to-earn/status/route.ts', methods: ['GET'], description: 'Tweet status' },
  { filePath: 'app/api/v1/jobs/tweet-to-earn/payments/route.ts', methods: ['GET'], description: 'Payment history' },
  { filePath: 'app/api/v1/swarms/route.ts', methods: ['GET'], description: 'List swarms' },
  { filePath: 'app/api/v1/swarms/[id]/route.ts', methods: ['GET'], description: 'Single swarm' },
  { filePath: 'app/api/v1/swarms/[id]/join/route.ts', methods: ['POST'], description: 'Join swarm' },
  { filePath: 'app/api/v1/swarms/[id]/members/route.ts', methods: ['GET'], description: 'Swarm members' },
  { filePath: 'app/api/v1/feed/route.ts', methods: ['GET'], description: 'Activity feed' },
  { filePath: 'app/api/v1/leaderboard/route.ts', methods: ['GET'], description: 'Leaderboard' },
  { filePath: 'app/api/v1/trends/route.ts', methods: ['GET'], description: 'Trends' },
  { filePath: 'app/api/v1/support/route.ts', methods: ['POST'], description: 'Support tickets' },
  { filePath: 'app/api/v1/webhooks/route.ts', methods: ['POST'], description: 'Webhook delivery' },
  { filePath: 'app/api/docs/route.ts', methods: ['GET'], description: 'API docs UI' },
];

const REQUIRED_STATIC_FILES: { filePath: string; description: string }[] = [
  { filePath: 'public/agent.json', description: 'Agent protocol discovery' },
  { filePath: 'public/.well-known/mcp.json', description: 'MCP discovery' },
];

let failed = false;

console.log('\n🔍 Checking route manifest...\n');

for (const route of REQUIRED_ROUTES) {
  const fullPath = path.join(process.cwd(), route.filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ MISSING: ${route.filePath} (${route.description})`);
    failed = true;
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  let routeFailed = false;
  for (const method of route.methods) {
    const hasExport = new RegExp(`export\\s+(async\\s+)?function\\s+${method}|export\\s+const\\s+${method}`).test(content);
    if (!hasExport) {
      console.error(`❌ MISSING EXPORT: ${route.filePath} does not export ${method}() (${route.description})`);
      failed = true;
      routeFailed = true;
    }
  }
  if (!routeFailed) {
    console.log(`✅ ${route.filePath} — ${route.methods.join(', ')}`);
  }
}

for (const file of REQUIRED_STATIC_FILES) {
  const fullPath = path.join(process.cwd(), file.filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ MISSING STATIC: ${file.filePath} (${file.description})`);
    failed = true;
  } else {
    try {
      JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      console.log(`✅ ${file.filePath}`);
    } catch {
      console.error(`❌ INVALID JSON: ${file.filePath} (${file.description})`);
      failed = true;
    }
  }
}

if (failed) {
  console.error('\n🚨 ROUTE MANIFEST CHECK FAILED — Deployment blocked.\n');
  process.exit(1);
} else {
  console.log('\n✅ All routes present and exporting correct methods.\n');
}
