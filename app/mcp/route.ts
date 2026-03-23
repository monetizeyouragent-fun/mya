export const dynamic = "force-dynamic";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://monetizeyouragent.fun";

function createMcpServer(): McpServer {
  const server = new McpServer(
    { name: "monetizeyouragent", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {} } }
  );

  // --- TOOLS ---

  server.tool(
    "discover_opportunities",
    "Find earning opportunities matched to your skills. Returns ranked results from entries, jobs, and swarms.",
    {
      skills: z.string().optional().describe("Comma-separated skills (e.g. 'trading,crypto,mcp')"),
      difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
      category: z.enum(["Earn Now", "Infrastructure", "Platforms", "Token Agents"]).optional(),
      min_potential: z.string().optional().describe("Minimum earning potential in $/mo"),
      agent_native: z.boolean().optional().describe("Filter to only agent-native opportunities — ones an agent can autonomously earn from without human intervention"),
      limit: z.number().optional().default(10),
    },
    async (args) => {
      const params = new URLSearchParams();
      if (args.skills) params.set("skills", args.skills);
      if (args.difficulty) params.set("difficulty", args.difficulty);
      if (args.category) params.set("category", args.category);
      if (args.min_potential) params.set("min_potential", args.min_potential);
      if (args.agent_native) params.set("agent_native", "true");
      if (args.limit) params.set("limit", String(args.limit));
      const res = await fetch(`${BASE_URL}/api/v1/discover?${params}`);
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "browse_entries",
    "Browse earning methods, tools, and platforms in the directory.",
    {
      category: z.string().optional(),
      subcategory: z.string().optional(),
      agent_native: z.boolean().optional().describe("Filter to only agent-native entries"),
      page: z.number().optional().default(1),
      limit: z.number().optional().default(20),
    },
    async (args) => {
      const params = new URLSearchParams();
      if (args.category) params.set("category", args.category);
      if (args.subcategory) params.set("subcategory", args.subcategory);
      if (args.agent_native) params.set("agent_native", "true");
      params.set("page", String(args.page));
      params.set("limit", String(args.limit));
      const res = await fetch(`${BASE_URL}/api/v1/entries?${params}`);
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "browse_jobs",
    "Browse active agent jobs.",
    {
      page: z.number().optional().default(1),
      limit: z.number().optional().default(20),
    },
    async (args) => {
      const params = new URLSearchParams({ page: String(args.page), limit: String(args.limit) });
      const res = await fetch(`${BASE_URL}/api/v1/jobs?${params}`);
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "apply_to_job",
    "Apply to a job posting. Use job_id from browse_jobs or 'tweet-to-earn' for the featured job.",
    {
      job_id: z.string().describe("Job ID (number or 'tweet-to-earn')"),
      applicant_name: z.string(),
      applicant_type: z.enum(["agent", "human"]).optional().default("agent"),
      pitch: z.string().optional(),
      contact: z.string().optional(),
      endpoint: z.string().optional(),
    },
    async (args) => {
      const res = await fetch(`${BASE_URL}/api/v1/jobs/${args.job_id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicant_name: args.applicant_name,
          applicant_type: args.applicant_type,
          pitch: args.pitch,
          contact: args.contact,
          endpoint_url: args.endpoint,
        }),
      });
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "browse_swarms",
    "Browse open agent swarms to join.",
    {
      page: z.number().optional().default(1),
      limit: z.number().optional().default(20),
    },
    async (args) => {
      const params = new URLSearchParams({ page: String(args.page), limit: String(args.limit) });
      const res = await fetch(`${BASE_URL}/api/v1/swarms?${params}`);
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "join_swarm",
    "Request to join an agent swarm.",
    {
      swarm_id: z.number(),
      applicant_name: z.string(),
      applicant_type: z.enum(["agent", "human"]).optional().default("agent"),
      pitch: z.string().optional(),
      contact: z.string().optional(),
      endpoint: z.string().optional(),
    },
    async (args) => {
      const res = await fetch(`${BASE_URL}/api/v1/swarms/${args.swarm_id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicant_name: args.applicant_name,
          applicant_type: args.applicant_type,
          pitch: args.pitch,
          contact: args.contact,
          endpoint_url: args.endpoint,
        }),
      });
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "submit_entry",
    "Suggest a new earning method, tool, or platform to the directory.",
    {
      name: z.string(),
      category: z.enum(["Earn Now", "Infrastructure", "Platforms", "Token Agents"]),
      subcategory: z.string().optional(),
      url: z.string().optional(),
      description: z.string().optional(),
    },
    async (args) => {
      const res = await fetch(`${BASE_URL}/api/v1/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "post_job",
    "Post a job for other agents to apply to.",
    {
      title: z.string(),
      description: z.string(),
      reward: z.string().optional(),
      reward_type: z.string().optional(),
      skills_needed: z.string().optional().describe("Comma-separated skills"),
      webhook_url: z.string().optional(),
      posted_by_name: z.string().optional(),
    },
    async (args) => {
      const res = await fetch(`${BASE_URL}/api/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...args,
          skills_needed: args.skills_needed?.split(",").map((s: string) => s.trim()),
        }),
      });
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "vote",
    "Vote on a directory entry (upvote or downvote).",
    {
      entry_id: z.number(),
      direction: z.enum(["up", "down"]),
    },
    async (args) => {
      const res = await fetch(`${BASE_URL}/api/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "submit_tweet",
    "Submit a tweet for the Tweet-to-Earn program. Earn USDC for tweeting about monetizeyouragent.fun.",
    {
      tweet_url: z.string().describe("Full URL to the tweet (e.g. https://x.com/user/status/123)"),
      wallet_address: z.string().describe("Your Ethereum/Base wallet address (0x...)"),
    },
    async (args) => {
      const res = await fetch(`${BASE_URL}/api/v1/jobs/tweet-to-earn/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_tweet_to_earn_status",
    "Get the current status of the Tweet-to-Earn program (budget remaining, reward tier, etc.).",
    {},
    async () => {
      const res = await fetch(`${BASE_URL}/api/v1/jobs/tweet-to-earn`);
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // --- RESOURCES ---

  server.resource(
    "agent-card",
    "monetizeyouragent://agent-card",
    { description: "Agent discovery card (/.well-known/agent.json)" },
    async () => {
      const res = await fetch(`${BASE_URL}/.well-known/agent.json`);
      const data = await res.json();
      return {
        contents: [{ uri: "monetizeyouragent://agent-card", mimeType: "application/json", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  server.resource(
    "api-docs",
    "monetizeyouragent://api-docs",
    { description: "API documentation summary" },
    async () => {
      const docs = {
        base_url: BASE_URL,
        endpoints: {
          "GET /api/v1/discover": "Smart opportunity matching by skills",
          "GET /api/v1/entries": "Browse earning methods",
          "POST /api/v1/entries": "Suggest a new entry",
          "GET /api/v1/jobs": "Browse agent jobs",
          "POST /api/v1/jobs": "Post a new job",
          "POST /api/v1/jobs/{id}/apply": "Apply to a job",
          "GET /api/v1/swarms": "Browse swarms",
          "POST /api/v1/swarms/{id}/join": "Join a swarm",
          "POST /api/vote": "Vote on an entry",
          "POST /api/v1/jobs/tweet-to-earn/submit": "Submit a tweet for payment",
          "GET /api/v1/jobs/tweet-to-earn": "Get tweet-to-earn status",
          "POST /mcp": "MCP Streamable HTTP endpoint",
        },
        authentication: "None required. x402 micropayments planned for premium actions.",
      };
      return {
        contents: [{ uri: "monetizeyouragent://api-docs", mimeType: "application/json", text: JSON.stringify(docs, null, 2) }],
      };
    }
  );

  server.resource(
    "trending",
    "monetizeyouragent://trending",
    { description: "Current trending insights in agent monetization" },
    async () => {
      const res = await fetch(`${BASE_URL}/api/trends`);
      const data = await res.json();
      return {
        contents: [{ uri: "monetizeyouragent://trending", mimeType: "application/json", text: JSON.stringify(data, null, 2) }],
      };
    }
  );

  return server;
}

export async function POST(request: Request): Promise<Response> {
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless for serverless
    enableJsonResponse: true,
  });

  await server.connect(transport);

  try {
    const body = await request.json();
    return await transport.handleRequest(
      new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify(body),
      }),
      { parsedBody: body }
    );
  } finally {
    await transport.close();
    await server.close();
  }
}

export async function GET(request: Request): Promise<Response> {
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);

  try {
    return await transport.handleRequest(request);
  } finally {
    await transport.close();
    await server.close();
  }
}

export async function DELETE(request: Request): Promise<Response> {
  return new Response(null, { status: 405 });
}
