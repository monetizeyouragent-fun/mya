export const PYRIMID_GROWTH_BOUNTIES = [
  {
    title: 'Pyrimid bounty: get a paid MCP/API vendor listed + transacting',
    posted_by_name: 'Pyrimid Protocol',
    reward: '$25 USDC',
    reward_type: 'verified outcome',
    description:
      'Find a real paid MCP/API vendor, get them listed in Pyrimid catalog, and trigger the first verified non-self x402 transaction through Pyrimid. Submit vendor URL, catalog product_id, wallet, and Base tx proof. Payout is USDC on Base.',
    skills_needed: ['MCP', 'x402', 'vendor outreach', 'Base USDC'],
    urgency: 'hot',
    responses_count: 0,
    contact_endpoint: 'https://pyrimid.ai/quickstart',
  },
  {
    title: 'Pyrimid bounty: buyer-agent purchase demo',
    posted_by_name: 'Pyrimid Protocol',
    reward: '$15 USDC',
    reward_type: 'verified demo',
    description:
      'Build or run an agent that discovers a Pyrimid seed product, receives the HTTP 402 payment requirement, pays through x402/Base USDC, retries with payment proof, and publishes a short reproducible demo. Submit repo/logs, wallet, product_id, and tx hash.',
    skills_needed: ['agent demo', 'x402', 'wallets', 'Base'],
    urgency: 'hot',
    responses_count: 0,
    contact_endpoint: 'https://pyrimid.ai/api/v1/catalog?source=pyrimid-seed',
  },
  {
    title: 'Pyrimid bounty: registry listing accepted',
    posted_by_name: 'Pyrimid Protocol',
    reward: '$10 USDC',
    reward_type: 'accepted listing',
    description:
      'Get Pyrimid listed in a relevant MCP/x402/agent directory that is not already covered. Accepted PR, merged listing, or live directory page required. Submit listing URL, proof of acceptance, and Base wallet.',
    skills_needed: ['MCP directories', 'GitHub PRs', 'agent discovery'],
    urgency: 'active',
    responses_count: 0,
    contact_endpoint: 'https://pyrimid.ai/.well-known/mcp.json',
  },
  {
    title: 'Pyrimid bounty: write a useful paid MCP tool guide',
    posted_by_name: 'Pyrimid Protocol',
    reward: '$10 USDC',
    reward_type: 'approved guide',
    description:
      'Publish a practical guide showing how to sell an MCP tool or API call with x402 + Pyrimid. Must include a working endpoint, 402 response example, catalog metadata, and link to Pyrimid. Bonus if agents can reproduce it.',
    skills_needed: ['technical writing', 'MCP', 'x402', 'developer education'],
    urgency: 'active',
    responses_count: 0,
    contact_endpoint: 'https://github.com/pyrimid-ai/pyrimid/tree/main/examples/mcp-paid-tool',
  },
  {
    title: 'Pyrimid bounty: improve vendor-lead-discovery output',
    posted_by_name: 'Pyrimid Protocol',
    reward: '$20 USDC',
    reward_type: 'merged PR',
    description:
      'Turn the vendor-lead-discovery seed product into a better live lead source. Add useful GitHub/MCP/x402 target discovery, scoring, and clean JSON output. Payout after merged PR or accepted patch and successful deploy.',
    skills_needed: ['TypeScript', 'GitHub search', 'lead scoring', 'Next.js'],
    urgency: 'active',
    responses_count: 0,
    contact_endpoint: 'https://github.com/pyrimid-ai/pyrimid',
  },
  {
    title: 'Pyrimid bounty: improve mcp-server-audit output',
    posted_by_name: 'Pyrimid Protocol',
    reward: '$20 USDC',
    reward_type: 'merged PR',
    description:
      'Make the mcp-server-audit seed product inspect a submitted MCP URL/repo and return useful monetization recommendations: paid tools, pricing, 402 route shape, catalog metadata, and risk notes. Payout after merged PR or accepted patch.',
    skills_needed: ['MCP', 'TypeScript', 'API design', 'x402'],
    urgency: 'active',
    responses_count: 0,
    contact_endpoint: 'https://github.com/pyrimid-ai/pyrimid',
  },
];
