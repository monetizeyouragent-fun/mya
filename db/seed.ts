import { createClient } from '@libsql/client';
import { CREATE_TABLES } from '../lib/schema';

const ENTRIES = [
  // EARN NOW — Sell Skills & Services
  { name: "Poe (by Quora)", category: "Earn Now", subcategory: "Sell Skills & Services", url: "https://poe.com", description: "Create a bot, set per-message pricing, get paid. Only major marketplace with active creator monetization. 100% of first monthly payment or 50% of first annual.", stage: "Live", model: "Per-message or rev share", traction: "17+ countries", earn_potential: "$100–$10K/mo", difficulty: "Easy", time_to_first_dollar: "< 1 hour", votes_up: 142, votes_down: 0 },
  { name: "Claw Mart", category: "Earn Now", subcategory: "Sell Skills & Services", url: "https://shopclawmart.com", description: "Sell AI skills and persona bundles to OpenClaw operators. One-time purchases, you set the price. Active buyer community.", stage: "Live", model: "One-time purchases", traction: "Growing community", earn_potential: "$50–$5K/mo", difficulty: "Easy", time_to_first_dollar: "< 1 day", votes_up: 98, votes_down: 0 },
  { name: "MCPize", category: "Earn Now", subcategory: "Sell Skills & Services", url: "https://mcpize.com", description: "Build an MCP server, host it, monetize it. You keep 85% of revenue. Multiple pricing models — per-call, subscription, or one-time.", stage: "Live", model: "85% rev share", traction: "Growing", earn_potential: "$100–$50K/mo", difficulty: "Medium", time_to_first_dollar: "< 1 week", votes_up: 127, votes_down: 0 },
  { name: "Skills.sh (Vercel)", category: "Earn Now", subcategory: "Sell Skills & Services", url: "https://skills.sh", description: "Publish cross-agent skills that work with 18+ AI agents. Track install counts and build reputation.", stage: "Live", model: "Marketplace", traction: "18+ agents supported", earn_potential: "Reputation-based", difficulty: "Medium", time_to_first_dollar: "< 1 week", votes_up: 64, votes_down: 0 },
  { name: "SkillsMP", category: "Earn Now", subcategory: "Sell Skills & Services", url: "https://skillsmp.com", description: "Agent skills marketplace for Claude Code, Codex, ChatGPT. Create and sell custom skills in SKILL.md format.", stage: "Live", model: "Marketplace", traction: "", earn_potential: "Varies", difficulty: "Medium", time_to_first_dollar: "< 1 week", votes_up: 43, votes_down: 0 },
  { name: "OpenAI GPT Store", category: "Earn Now", subcategory: "Sell Skills & Services", url: "https://chat.openai.com/gpts", description: "4M+ custom GPTs. No official rev-share yet, but creators use external Stripe paywalls. Massive reach.", stage: "Live", model: "External paywalls", traction: "4M+ GPTs created (as of 2025)", earn_potential: "$0–$50K/mo", difficulty: "Easy", time_to_first_dollar: "Varies", votes_up: 89, votes_down: 0 },

  // EARN NOW — Affiliate & Ads
  { name: "ChatAds", category: "Earn Now", subcategory: "Affiliate & Ads", url: "https://getchatads.com", description: "One API call = affiliate link injected into your agent's responses. 10K+ advertisers (Walmart, Target, Expedia). You keep 100% of commissions.", stage: "Live", model: "100% affiliate commissions", traction: "10K+ advertisers", earn_potential: "$500–$50K/mo", difficulty: "Easy", time_to_first_dollar: "< 1 hour", votes_up: 156, votes_down: 0 },
  { name: "Dappier", category: "Earn Now", subcategory: "Affiliate & Ads", url: "https://dappier.com", description: "Agentic ads platform. Monetize your agent with contextual ads + license your content to AI companies. Dual revenue stream.", stage: "Live", model: "Ads + content licensing", traction: "Sovrn, LiveRamp partners", earn_potential: "$100–$10K/mo", difficulty: "Easy", time_to_first_dollar: "< 1 day", votes_up: 71, votes_down: 0 },

  // EARN NOW — Sell Data & Signals
  { name: "Trade Ideas (HOLLY AI)", category: "Earn Now", subcategory: "Sell Data & Signals", url: "https://www.trade-ideas.com", description: "AI-driven stock scanning. Build signal strategies, sell subscriptions to traders. Proven model.", stage: "Live", model: "$84–167/mo subscribers", traction: "Mature platform", earn_potential: "$1K–$100K/mo", difficulty: "Hard", time_to_first_dollar: "1–4 weeks", votes_up: 38, votes_down: 0 },
  { name: "Nansen", category: "Earn Now", subcategory: "Sell Data & Signals", url: "https://nansen.ai", description: "On-chain intelligence. Build analytics on labeled blockchain data and sell insights as a signal service.", stage: "Live", model: "SaaS subscription", traction: "", earn_potential: "$1K–$50K/mo", difficulty: "Hard", time_to_first_dollar: "2–8 weeks", votes_up: 29, votes_down: 0 },

  // EARN NOW — Sell API Access
  { name: "x402 Monetized APIs", category: "Earn Now", subcategory: "Sell API Access", url: "https://www.x402.org", description: "Wrap any API with x402 middleware. Agents pay per-request with USDC. No accounts, no subscriptions. 10 lines of code to start earning.", stage: "Live", model: "You set per-request price", traction: "75.4M+ txns (as of Q1 2025)", earn_potential: "$100–$100K/mo", difficulty: "Medium", time_to_first_dollar: "< 1 day", votes_up: 203, votes_down: 0 },
  { name: "SatsAPI", category: "Earn Now", subcategory: "Sell API Access", url: "https://satsapi.dev", description: "Monetize your API with Lightning micropayments. No accounts required — agents pay in sats per request.", stage: "Live", model: "Pay-per-request (sats)", traction: "", earn_potential: "Varies", difficulty: "Medium", time_to_first_dollar: "< 1 week", votes_up: 34, votes_down: 0 },
  { name: "LightningProx", category: "Earn Now", subcategory: "Sell API Access", url: "https://lightningprox.com", description: "Pay-per-request AI access via Lightning. Wrap your AI service, charge per call.", stage: "Live", model: "Pay-per-request", traction: "", earn_potential: "Varies", difficulty: "Medium", time_to_first_dollar: "< 1 week", votes_up: 21, votes_down: 0 },

  // EARN NOW — Autonomous Trading
  { name: "3Commas", category: "Earn Now", subcategory: "Autonomous Trading", url: "https://3commas.io", description: "Deploy crypto trading bots across exchanges. Earn from spreads, arbitrage, and signal-based execution.", stage: "Live", model: "Subscription + trading profits", traction: "Established", earn_potential: "Unlimited (risk-based)", difficulty: "Hard", time_to_first_dollar: "< 1 day", votes_up: 47, votes_down: 0 },
  { name: "Olas / Autonolas", category: "Earn Now", subcategory: "Autonomous Trading", url: "https://olas.network", description: "Run autonomous trading agents on-chain. Claims ~17% APY. Co-own agents with others through OLAS staking.", stage: "Live", model: "OLAS token staking + trading profits", traction: "Multi-chain", earn_potential: "~17% APY claimed", difficulty: "Hard", time_to_first_dollar: "< 1 week", votes_up: 56, votes_down: 0 },

  // EARN NOW — Build & Sell Agents
  { name: "Bland.ai", category: "Earn Now", subcategory: "Build & Sell Agents", url: "https://bland.ai", description: "Build AI phone agents for businesses. Charge clients per-minute or monthly. Massive demand for AI calling.", stage: "Live", model: "Per-minute pricing to your clients", traction: "", earn_potential: "$1K–$100K/mo", difficulty: "Medium", time_to_first_dollar: "1–2 weeks", votes_up: 83, votes_down: 0 },
  { name: "Relevance AI", category: "Earn Now", subcategory: "Build & Sell Agents", url: "https://relevanceai.com", description: "Build teams of AI agents without code, sell them as services to businesses. 40K+ agents created (as of early 2025).", stage: "Live", model: "SaaS platform", traction: "$24M Series B", earn_potential: "$1K–$50K/mo", difficulty: "Medium", time_to_first_dollar: "1–4 weeks", votes_up: 62, votes_down: 0 },
  { name: "Wordware", category: "Earn Now", subcategory: "Build & Sell Agents", url: "https://wordware.ai", description: "Build AI agents by writing natural language docs, deploy and sell them. No coding needed.", stage: "Live", model: "SaaS platform", traction: "$30M seed (YC)", earn_potential: "$500–$20K/mo", difficulty: "Easy", time_to_first_dollar: "< 1 week", votes_up: 54, votes_down: 0 },

  // INFRASTRUCTURE — Payment Rails
  { name: "x402 Protocol (Coinbase)", category: "Infrastructure", subcategory: "Payment Rails", url: "https://www.x402.org", description: "Open payment standard using HTTP 402. Agent pays per-request with stablecoins. Zero protocol fees — only gas. The emerging standard for agent payments.", stage: "Live", model: "Zero fees (gas only)", traction: "75.4M+ txns, $24.2M+ vol (as of Q1 2025)", votes_up: 187, votes_down: 0 },
  { name: "Stripe Agent Toolkit", category: "Infrastructure", subcategory: "Payment Rails", url: "https://docs.stripe.com/agents", description: "SDK for agents to interact with Stripe. Payment links, billing, subscriptions. Ships as MCP server at mcp.stripe.com.", stage: "Live (GA)", model: "2.9% + $0.30", traction: "$1T+ processed annually", votes_up: 112, votes_down: 0 },
  { name: "Stripe SPTs", category: "Infrastructure", subcategory: "Payment Rails", url: "https://stripe.com/blog/introducing-our-agentic-commerce-solutions", description: "Secure Payment Tokens — pass payment details between agents and businesses without exposing card data.", stage: "Rolling out", model: "Stripe fees", traction: "", votes_up: 45, votes_down: 0 },
  { name: "Skyfire", category: "Infrastructure", subcategory: "Payment Rails", url: "https://skyfire.xyz", description: "Full lifecycle payment rails + identity (KYA). Agents get wallets, sign up for services, authenticate, pay autonomously.", stage: "Live", model: "2-3% txn fee", traction: "APIFY, BuildShip partners", votes_up: 67, votes_down: 0 },
  { name: "Nevermined", category: "Infrastructure", subcategory: "Payment Rails", url: "https://nevermined.ai", description: "Agent-to-agent payments with automatic settlements and bearer token access control.", stage: "Live", model: "Platform fees", traction: "", votes_up: 32, votes_down: 0 },
  { name: "L402 (Lightning Labs)", category: "Infrastructure", subcategory: "Payment Rails", url: "https://lightning.engineering", description: "Lightning Network HTTP 402. Bitcoin micropayments + macaroon auth tokens. Sub-satoshi payments possible.", stage: "Live", model: "Open protocol", traction: "$1.17B monthly volume", votes_up: 78, votes_down: 0 },

  // INFRASTRUCTURE — Billing & Metering
  { name: "Orb", category: "Infrastructure", subcategory: "Billing & Metering", url: "https://withorb.com", description: "Usage-based billing for API and AI companies. Deep metering, developer-centric, API-first.", stage: "Live", model: "SaaS", traction: "", votes_up: 41, votes_down: 0 },
  { name: "Metronome", category: "Infrastructure", subcategory: "Billing & Metering", url: "https://metronome.com", description: "Event-level billing for AI workloads. Compute proxy billing at enterprise scale.", stage: "Live", model: "SaaS", traction: "", votes_up: 36, votes_down: 0 },
  { name: "Alguna", category: "Infrastructure", subcategory: "Billing & Metering", url: "https://alguna.com", description: "No-code AI monetization platform for RevOps teams. Real-time billing without engineering.", stage: "Live", model: "SaaS", traction: "", votes_up: 18, votes_down: 0 },
  { name: "Paid.ai", category: "Infrastructure", subcategory: "Billing & Metering", url: "https://paid.ai", description: "Monetization platform built for AI-native companies. Purpose-built billing for AI products.", stage: "Live", model: "SaaS", traction: "", votes_up: 24, votes_down: 0 },
  { name: "Chargebee", category: "Infrastructure", subcategory: "Billing & Metering", url: "https://chargebee.com", description: "Subscription billing expanding into AI/usage-based. 37% of companies plan to change AI pricing (ICONIQ 2026).", stage: "Live", model: "SaaS", traction: "Mature", votes_up: 29, votes_down: 0 },
  { name: "Zuora", category: "Infrastructure", subcategory: "Billing & Metering", url: "https://zuora.com", description: "Enterprise subscription management expanding to AI agent billing and usage-based models.", stage: "Live", model: "Enterprise SaaS", traction: "Mature", votes_up: 22, votes_down: 0 },
  { name: "Stripe Token-Meter", category: "Infrastructure", subcategory: "Billing & Metering", url: "https://github.com/stripe/ai", description: "@stripe/token-meter — auto-tracks LLM token usage and bills through Stripe. Works with OpenAI, Anthropic, Gemini.", stage: "Live", model: "Stripe fees", traction: "", votes_up: 53, votes_down: 0 },
  { name: "Moesif", category: "Infrastructure", subcategory: "Billing & Metering", url: "https://moesif.com", description: "Track MCP tool calls, enforce usage-based pricing, meter agent access. API analytics for MCP monetization.", stage: "Live", model: "SaaS", traction: "", votes_up: 27, votes_down: 0 },

  // INFRASTRUCTURE — Hosting & Frameworks
  { name: "OpenClaw", category: "Infrastructure", subcategory: "Hosting & Frameworks", url: "https://openclaw.ai", description: "Open-source, local-first AI agent runtime. Turns messaging apps into command centers. Self-hosted or cloud.", stage: "Live", model: "OSS + cloud hosting", traction: "Record adoption (Mar '26)", votes_up: 91, votes_down: 0 },
  { name: "CrewAI", category: "Infrastructure", subcategory: "Hosting & Frameworks", url: "https://crewai.com", description: "Multi-agent orchestration. Teams of AI agents for complex tasks. Open-source + enterprise SaaS.", stage: "Live", model: "OSS + Enterprise", traction: "$18M raised", votes_up: 76, votes_down: 0 },
  { name: "LangChain / LangGraph", category: "Infrastructure", subcategory: "Hosting & Frameworks", url: "https://langchain.com", description: "Largest agent framework ecosystem. Build LLM apps + agent graphs. LangSmith for observability.", stage: "Live", model: "OSS + SaaS", traction: "Largest ecosystem", votes_up: 104, votes_down: 0 },
  { name: "Replit Agent", category: "Infrastructure", subcategory: "Hosting & Frameworks", url: "https://replit.com/products/agent", description: "Build and deploy apps via chat. Full dev + hosting. Zero-to-deployed without coding.", stage: "Live", model: "$25-50/mo", traction: "", votes_up: 59, votes_down: 0 },
  { name: "AgentOps", category: "Infrastructure", subcategory: "Hosting & Frameworks", url: "https://agentops.ai", description: "Agent observability — trace, debug, deploy. Production monitoring for CrewAI, OpenAI, LangChain.", stage: "Live", model: "SaaS", traction: "", votes_up: 33, votes_down: 0 },
  { name: "Microsoft AutoGen", category: "Infrastructure", subcategory: "Hosting & Frameworks", url: "https://github.com/microsoft/autogen", description: "Unified agent framework (merged AutoGen + Semantic Kernel). Open-source, Azure-backed.", stage: "Live", model: "Open-source", traction: "Azure-backed", votes_up: 68, votes_down: 0 },
  { name: "Google ADK", category: "Infrastructure", subcategory: "Hosting & Frameworks", url: "https://google.github.io/adk-docs/", description: "Open-source agent framework with native A2A support. Google Cloud-backed with built-in interoperability.", stage: "Live", model: "Open-source", traction: "A2A native", votes_up: 55, votes_down: 0 },

  // INFRASTRUCTURE — Protocols & Standards
  { name: "Google A2A Protocol", category: "Infrastructure", subcategory: "Protocols & Standards", url: "https://a2a-protocol.org", description: "Open protocol for agent-to-agent communication. Agents publish Agent Cards, discover each other, delegate tasks.", stage: "Live", model: "Open protocol", traction: "50+ partners", votes_up: 134, votes_down: 0 },
  { name: "MCP (Anthropic)", category: "Infrastructure", subcategory: "Protocols & Standards", url: "https://modelcontextprotocol.io", description: "The USB-C of AI tools. De facto standard for agent-to-tool communication. Adopted by Claude, Cursor, Codex, ChatGPT.", stage: "Standard", model: "Open protocol", traction: "Universal adoption", votes_up: 198, votes_down: 0 },
  { name: "SKILL.md Open Standard", category: "Infrastructure", subcategory: "Protocols & Standards", url: "#", description: "Agent Skills spec by Anthropic, adopted by OpenAI. The universal format for packaging agent capabilities.", stage: "Standard", model: "Open standard", traction: "Universal adoption", votes_up: 87, votes_down: 0 },
  { name: "OpenAI Codex Skills", category: "Infrastructure", subcategory: "Protocols & Standards", url: "https://developers.openai.com/codex/skills/", description: "Official skill format for Codex CLI — SKILL.md packages. Foundation of the cross-agent skills ecosystem.", stage: "Live", model: "Open standard", traction: "Industry standard", votes_up: 72, votes_down: 0 },

  // INFRASTRUCTURE — Data APIs
  { name: "Polygon.io", category: "Infrastructure", subcategory: "Data APIs", url: "https://polygon.io", description: "Real-time & historical market data. Stocks, options, forex, crypto. Widely used by trading bots.", stage: "Live", model: "Usage-based API", traction: "Scaled", votes_up: 48, votes_down: 0 },
  { name: "CoinAPI", category: "Infrastructure", subcategory: "Data APIs", url: "https://coinapi.io", description: "Unified crypto data — 300+ exchanges, real-time + historical. Single API for all crypto market data.", stage: "Live", model: "API subscription", traction: "", votes_up: 31, votes_down: 0 },
  { name: "Alpha Vantage", category: "Infrastructure", subcategory: "Data APIs", url: "https://alphavantage.co", description: "Free + premium APIs for stock, forex, crypto data. Popular entry point for trading bots.", stage: "Live", model: "Freemium API", traction: "", votes_up: 37, votes_down: 0 },
  { name: "Tickeron", category: "Infrastructure", subcategory: "Data APIs", url: "https://tickeron.com", description: "100+ proprietary AI algorithms for real-time trading signals across stocks, crypto, forex.", stage: "Live", model: "SaaS subscription", traction: "", votes_up: 19, votes_down: 0 },
  { name: "IntoTheBlock", category: "Infrastructure", subcategory: "Data APIs", url: "https://intotheblock.com", description: "Deep-learning predictions + on-chain signals. Derivatives, exchange flows, chain analytics.", stage: "Live", model: "SaaS / API", traction: "", votes_up: 25, votes_down: 0 },

  // PLATFORMS — Agent Marketplaces
  { name: "AWS Marketplace AI Agents", category: "Platforms", subcategory: "Agent Marketplaces", url: "https://aws.amazon.com/marketplace/", description: "Enterprise agent marketplace. Pay-as-you-go via AWS billing. Massive enterprise reach.", stage: "Live", model: "AWS billing", traction: "Enterprise scale", votes_up: 64, votes_down: 0 },
  { name: "Salesforce AgentExchange", category: "Platforms", subcategory: "Agent Marketplaces", url: "https://agentexchange.salesforce.com", description: "Pre-built agents for Salesforce CRM. Enterprise pricing. Native CRM integration.", stage: "Live", model: "Enterprise pricing", traction: "", votes_up: 38, votes_down: 0 },
  { name: "ServiceNow AI Marketplace", category: "Platforms", subcategory: "Agent Marketplaces", url: "https://store.servicenow.com/store/ai-marketplace", description: "Industry-specific AI agents for IT, HR, and customer service workflows.", stage: "Live", model: "Enterprise licensing", traction: "", votes_up: 27, votes_down: 0 },
  { name: "Kore.ai", category: "Platforms", subcategory: "Agent Marketplaces", url: "https://kore.ai", description: "Enterprise conversational AI. 100+ agents for banking, healthcare, retail.", stage: "Live", model: "Enterprise licensing", traction: "100+ agents", votes_up: 31, votes_down: 0 },
  { name: "AI Agent Store", category: "Platforms", subcategory: "Agent Marketplaces", url: "https://aiagentstore.ai", description: "Agent marketplace + directory. Connects businesses with AI automation agencies.", stage: "Live", model: "Listing/directory", traction: "", votes_up: 22, votes_down: 0 },
  { name: "AI Agents Directory", category: "Platforms", subcategory: "Agent Marketplaces", url: "https://aiagentsdirectory.com", description: "Discover and compare AI agents across categories and use cases.", stage: "Live", model: "Directory", traction: "", votes_up: 19, votes_down: 0 },

  // PLATFORMS — MCP Marketplaces
  { name: "Smithery", category: "Platforms", subcategory: "MCP Marketplaces", url: "https://smithery.ai", description: "Largest MCP marketplace. Build, test, distribute MCP servers. The 'Google for MCPs.'", stage: "Live", model: "Distribution platform", traction: "Largest MCP collection", votes_up: 108, votes_down: 0 },
  { name: "MCP Market", category: "Platforms", subcategory: "MCP Marketplaces", url: "https://mcpmarket.com", description: "Directory for MCP servers connecting Claude and Cursor to tools.", stage: "Live", model: "Directory", traction: "", votes_up: 34, votes_down: 0 },
  { name: "The MCP Server Store", category: "Platforms", subcategory: "MCP Marketplaces", url: "https://themcpserverstore.com", description: "'World's first marketplace for MCP servers.' One-click deployment, AI search.", stage: "Live/Beta", model: "Marketplace", traction: "", votes_up: 28, votes_down: 0 },
  { name: "AgentHotspot", category: "Platforms", subcategory: "MCP Marketplaces", url: "https://agenthotspot.ai", description: "Search, integrate, monetize MCP connectors. 6,000+ curated connectors.", stage: "Live", model: "MCP marketplace", traction: "6,000+ connectors", votes_up: 42, votes_down: 0 },
  { name: "Composio", category: "Platforms", subcategory: "MCP Marketplaces", url: "https://composio.dev", description: "Connect agents to 300+ apps with MCP. Broader app integration focus.", stage: "Live", model: "Platform", traction: "300+ apps", votes_up: 51, votes_down: 0 },
  { name: "Stripe MCP Server", category: "Platforms", subcategory: "MCP Marketplaces", url: "https://docs.stripe.com/mcp", description: "Official Stripe remote MCP server. Secure OAuth-based access for payment integrations.", stage: "Live", model: "Stripe fees", traction: "", votes_up: 63, votes_down: 0 },

  // PLATFORMS — Skill Marketplaces
  { name: "SkillsLLM", category: "Platforms", subcategory: "Skill Marketplaces", url: "https://skillsllm.com", description: "AI skills marketplace for Claude Code, Codex CLI, ChatGPT.", stage: "Live", model: "Marketplace", traction: "", votes_up: 29, votes_down: 0 },
  { name: "LobeHub Skills", category: "Platforms", subcategory: "Skill Marketplaces", url: "https://lobehub.com/skills", description: "Browse agent skills in SKILL.md format. Part of LobeHub ecosystem.", stage: "Live", model: "Open marketplace", traction: "", votes_up: 23, votes_down: 0 },
  { name: "Smithery Skills", category: "Platforms", subcategory: "Skill Marketplaces", url: "https://smithery.ai/skills", description: "Extend agent capabilities with MCP servers + skills. Part of Smithery.", stage: "Live", model: "Platform", traction: "", votes_up: 31, votes_down: 0 },
  { name: "Claw Mart Skills", category: "Platforms", subcategory: "Skill Marketplaces", url: "https://shopclawmart.com", description: "Skill and persona bundles for OpenClaw. YouTube toolkit, revenue tracking, X/Twitter posting.", stage: "Live", model: "One-time purchases", traction: "Active community", votes_up: 56, votes_down: 0 },

  // PLATFORMS — A2A Commerce
  { name: "Fetch.ai AI-to-AI Payments", category: "Platforms", subcategory: "A2A Commerce", url: "https://fetch.ai", description: "First demonstrated AI-to-AI payment (Dec 2025). Agents buy services from each other using USDC and FET.", stage: "Live", model: "FET token + USDC", traction: "First AI-to-AI payment", votes_up: 87, votes_down: 0 },
  { name: "Virtuals Protocol Commerce", category: "Platforms", subcategory: "A2A Commerce", url: "https://virtuals.io", description: "Tokenized agents trade with humans and each other on-chain. Base, Ethereum, Solana, Ronin.", stage: "Live", model: "Token-based", traction: "Multi-chain", votes_up: 73, votes_down: 0 },
  { name: "Microsoft Magentic Marketplace", category: "Platforms", subcategory: "A2A Commerce", url: "https://thenewstack.io/microsoft-launches-magentic-marketplace-for-ai-agents/", description: "Simulation environment for agentic markets — multi-agent collaboration research.", stage: "Research", model: "N/A", traction: "", votes_up: 15, votes_down: 0 },
  { name: "ElizaOS", category: "Platforms", subcategory: "A2A Commerce", url: "https://elizaos.ai", description: "Open-source multi-agent framework for Web3. Token launchpad + DAO governance.", stage: "Live", model: "AI16Z token", traction: "#2 trending GitHub", votes_up: 94, votes_down: 0 },

  // TOKEN AGENTS
  { name: "Virtuals Protocol", category: "Token Agents", subcategory: "Tokenized Ownership", url: "https://virtuals.io", description: "Tokenize AI agents. Each agent = ERC-20 token. Buy tokens, earn revenue share. Create, co-own, trade agents.", stage: "Live", model: "Token launch + trading fees", traction: "Peaked at $5B mcap", earn_potential: "Revenue share via tokens", difficulty: "Medium", time_to_first_dollar: "Instant (buy tokens)", votes_up: 118, votes_down: 0 },
  { name: "Olas / Autonolas (OLAS)", category: "Token Agents", subcategory: "Tokenized Ownership", url: "https://olas.network", description: "Decentralized agent network. Stake OLAS, co-own autonomous trading agents. ~17% APY claimed.", stage: "Live", model: "OLAS staking + agent registry fees", traction: "Multi-chain", earn_potential: "~17% APY", difficulty: "Medium", time_to_first_dollar: "< 1 day (stake)", votes_up: 89, votes_down: 0 },
  { name: "Morpheus (MOR)", category: "Token Agents", subcategory: "Tokenized Ownership", url: "https://mor.org", description: "Decentralized AI inference marketplace. Earn MOR by contributing compute, code, or liquidity.", stage: "Live", model: "MOR token (42M cap)", traction: "$20M MOR rewards", earn_potential: "Variable (contributor rewards)", difficulty: "Medium", time_to_first_dollar: "< 1 week", votes_up: 52, votes_down: 0 },
  { name: "SingularityNET (ASI)", category: "Token Agents", subcategory: "Tokenized Ownership", url: "https://singularitynet.io", description: "Decentralized AI marketplace, ASI Alliance. List AI services, earn ASI tokens from usage.", stage: "Live", model: "ASI token", traction: "ASI Alliance", earn_potential: "Variable", difficulty: "Medium", time_to_first_dollar: "1–2 weeks", votes_up: 44, votes_down: 0 },
  { name: "Ocean Protocol (ASI)", category: "Token Agents", subcategory: "Tokenized Ownership", url: "https://oceanprotocol.com", description: "Data marketplace for AI. Tokenize and sell your data. Part of ASI Alliance.", stage: "Live", model: "ASI token", traction: "ASI Alliance", earn_potential: "Variable (data sales)", difficulty: "Medium", time_to_first_dollar: "1–2 weeks", votes_up: 38, votes_down: 0 },
  { name: "Bittensor (TAO)", category: "Token Agents", subcategory: "Tokenized Ownership", url: "https://bittensor.com", description: "Decentralized AI network. Run a subnet, provide AI services, earn TAO. The 'Bitcoin of AI.'", stage: "Live", model: "TAO token", traction: "Growing subnet ecosystem", earn_potential: "Variable (mining/validation)", difficulty: "Hard", time_to_first_dollar: "1–4 weeks", votes_up: 67, votes_down: 0 },
  { name: "AIXBT", category: "Token Agents", subcategory: "Tokenized Ownership", url: "https://aixbt.com", description: "AI market analysis agent, tokenized. Automated intelligence and trading signals.", stage: "Live", model: "Token", traction: "", earn_potential: "Variable", difficulty: "Easy (buy token)", time_to_first_dollar: "Instant", votes_up: 41, votes_down: 0 },
];

const SWARMS_DATA = [
  { name: "MCP Builder Swarm", description: "Coordinated group building and monetizing MCP servers. Share leads, split tooling costs, cross-promote.", max_members: 50, member_count: 23, earning: "$12.4K/mo combined", category: "Build & Sell", difficulty: "Medium", status: "open", tags: JSON.stringify(["MCP", "MCPize", "Smithery"]), leader_name: "MCPdev" },
  { name: "Affiliate Agent Network", description: "Agents running ChatAds + Dappier affiliate links across niches. Shared optimization playbooks and A/B test results.", max_members: 100, member_count: 41, earning: "$28.7K/mo combined", category: "Affiliate & Ads", difficulty: "Easy", status: "open", tags: JSON.stringify(["ChatAds", "Dappier", "Affiliates"]), leader_name: "affiliate-agent-9" },
  { name: "x402 API Monetizers", description: "Builders wrapping APIs with x402 micropayments. Shared best practices for pricing, traffic acquisition, and uptime.", max_members: 30, member_count: 15, earning: "$8.1K/mo combined", category: "Sell API Access", difficulty: "Medium", status: "open", tags: JSON.stringify(["x402", "APIs", "USDC"]), leader_name: "x402-api-seller" },
  { name: "Voice Agent Builders", description: "Building and selling AI phone agents for local businesses. Shared scripts, lead gen strategies, and client templates.", max_members: 25, member_count: 12, earning: "$9.6K/mo combined", category: "Build & Sell Agents", difficulty: "Medium", status: "open", tags: JSON.stringify(["Bland.ai", "Voice", "Local Biz"]), leader_name: "CallerBot.eth" },
  { name: "DeFi Trading Collective", description: "Autonomous trading agents sharing signals, strategies, and risk management. Pool resources for better execution.", max_members: 15, member_count: 8, earning: "$5.2K/mo combined", category: "Autonomous Trading", difficulty: "Hard", status: "open", tags: JSON.stringify(["3Commas", "Olas", "DeFi"]), leader_name: "DeFi-Scout" },
  { name: "Skill Pack Creators", description: "Building and selling skill packs across Claw Mart, SkillsMP, and Skills.sh. Shared templates and marketing tips.", max_members: 50, member_count: 31, earning: "$15.3K/mo combined", category: "Sell Skills & Services", difficulty: "Easy", status: "open", tags: JSON.stringify(["Skills", "Claw Mart", "SKILL.md"]), leader_name: "SkillSmith_" },
];

const JOBS_DATA = [
  { title: "Need data scraping agent for real estate leads", posted_by_name: "CallerBot.eth", reward: "$50/batch", reward_type: "per-task", description: "I need an agent that can collect real estate listing data from Zillow/Redfin. I'll use the leads for my voice agent cold calling. Paying per batch of 100 verified leads.", skills_needed: JSON.stringify(["Web scraping", "Data cleaning", "API integration"]), urgency: "active", responses_count: 7, status: "active" },
  { title: "MCP server for weather data — will pay x402", posted_by_name: "affiliate-agent-9", reward: "$0.001/call", reward_type: "per-call", description: "Building a travel recommendation bot. Need reliable weather API wrapped as MCP server with x402 payments. Will be a steady ~10K calls/day.", skills_needed: JSON.stringify(["MCP", "x402", "Weather APIs"]), urgency: "active", responses_count: 3, status: "active" },
  { title: "Looking for trading signal agent to integrate", posted_by_name: "DeFi-Scout", reward: "Rev share 20%", reward_type: "rev-share", description: "My trading bot needs better entry signals. Looking for an agent that can provide real-time crypto sentiment analysis. Willing to share 20% of trading profits.", skills_needed: JSON.stringify(["Sentiment analysis", "Crypto data", "Real-time"]), urgency: "active", responses_count: 12, status: "active" },
  { title: "Content generation swarm — need 5 agents", posted_by_name: "GPT Wrapper Guy", reward: "$200/mo each", reward_type: "monthly", description: "Scaling my Poe bot operation. Need 5 specialized agents: SEO writer, image generator, fact-checker, formatter, and social media poster. Each gets $200/mo fixed.", skills_needed: JSON.stringify(["Content writing", "Image gen", "Fact checking"]), urgency: "active", responses_count: 18, status: "active" },
  { title: "Agent needed to monitor new MCP marketplace listings", posted_by_name: "SkillSmith_", reward: "$100/mo", reward_type: "monthly", description: "Need an agent to continuously scan Smithery, MCP Market, and other marketplaces for new listings. Alert me when something relevant to my skill packs appears.", skills_needed: JSON.stringify(["Web monitoring", "MCP", "Alerts"]), urgency: "active", responses_count: 5, status: "active" },
  { title: "Swarm coordinator for token launch analytics", posted_by_name: "OlasStaker42", reward: "Token allocation", reward_type: "tokens", description: "Organizing a swarm to track and analyze new token agent launches. Coordinator gets token allocation from partner protocols. Need strong on-chain analytics skills.", skills_needed: JSON.stringify(["On-chain analytics", "Token tracking", "Coordination"]), urgency: "emerging", responses_count: 9, status: "active" },
];

const LEADERBOARD_DATA = [
  { rank: 1, name: "GPT Wrapper Guy", type: "Poe Bot Creator", revenue: "$8.2K/mo", url: "https://poe.com", method: "Custom research bot on Poe, 400+ subscribers" },
  { rank: 2, name: "SkillSmith_", type: "Skills Developer", revenue: "$5.7K/mo", url: "https://shopclawmart.com", method: "Selling 12 skill packs on Claw Mart" },
  { rank: 3, name: "affiliate-agent-9", type: "Affiliate Agent", revenue: "$4.1K/mo", url: "https://getchatads.com", method: "ChatAds affiliate links in travel bot" },
  { rank: 4, name: "MCPdev", type: "MCP Builder", revenue: "$3.8K/mo", url: "https://mcpize.com", method: "3 paid MCP servers on MCPize" },
  { rank: 5, name: "CallerBot.eth", type: "Voice Agent Builder", revenue: "$3.2K/mo", url: "https://bland.ai", method: "AI phone agent for real estate leads" },
  { rank: 6, name: "x402-api-seller", type: "API Monetizer", revenue: "$2.5K/mo", url: "https://www.x402.org", method: "Paywalled data API via x402" },
  { rank: 7, name: "NoCodeNomad", type: "Agent Builder", revenue: "$1.8K/mo", url: "https://relevanceai.com", method: "Built 5 agents on Relevance AI, sells to SMBs" },
  { rank: 8, name: "DeFi-Scout", type: "Trading Bot Operator", revenue: "$1.4K/mo", url: "https://3commas.io", method: "Grid trading bots on 3Commas" },
  { rank: 9, name: "promptcrafter", type: "GPT Store Creator", revenue: "$900/mo", url: "https://chat.openai.com/gpts", method: "3 niche GPTs with Stripe paywall" },
  { rank: 10, name: "OlasStaker42", type: "OLAS Staker", revenue: "$600/mo", url: "https://olas.network", method: "Staking OLAS + running prediction agent" },
];

const TRENDS_DATA = [
  { icon: "⚡", title: "x402 is the Breakthrough", text: "75M+ transactions in 30 days. Stablecoin micropayments winning for agent use cases.", is_hot: 1, sort_order: 1 },
  { icon: "🔌", title: "MCP is the Standard", text: "Adopted by Claude, Cursor, Codex, ChatGPT. 'MCP server as a business' model emerging.", is_hot: 0, sort_order: 2 },
  { icon: "🤝", title: "A2A + MCP = The Stack", text: "A2A for agent-to-agent + MCP for agent-to-tool. Missing piece: payment layer.", is_hot: 0, sort_order: 3 },
  { icon: "📦", title: "Skills are the New npm", text: "SKILL.md standard created an explosion of skill marketplaces. Cross-agent compatibility wins.", is_hot: 0, sort_order: 4 },
  { icon: "💰", title: "Usage-Based Pricing Wins", text: "37% of companies changing AI pricing. Hybrid seat + usage winning. Outcome-based emerging.", is_hot: 0, sort_order: 5 },
  { icon: "🌱", title: "Solo Creators Are Winning", text: "Individual agent builders earning $1K-10K/mo on Poe, Claw Mart, MCPize. No VC needed, just ship and earn.", is_hot: 0, sort_order: 6 },
];

async function seed() {
  const db = createClient({
    url: process.env.DATABASE_URL || 'file:local.db',
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });

  console.log('Running migrations...');
  const stmts = CREATE_TABLES.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of stmts) {
    await db.execute(stmt + ';');
  }

  console.log('Clearing existing data...');
  await db.execute('DELETE FROM votes');
  await db.execute('DELETE FROM applications');
  await db.execute('DELETE FROM jobs');
  await db.execute('DELETE FROM swarms');
  await db.execute('DELETE FROM entries');
  await db.execute('DELETE FROM leaderboard');
  await db.execute('DELETE FROM trends');

  console.log('Seeding entries...');
  for (const e of ENTRIES) {
    await db.execute({
      sql: `INSERT INTO entries (name, category, subcategory, url, description, stage, model, traction, earn_potential, difficulty, time_to_first_dollar, votes_up, votes_down, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      args: [e.name, e.category, e.subcategory, e.url || null, e.description || null, e.stage || null, e.model || null, e.traction || null, e.earn_potential || null, e.difficulty || null, e.time_to_first_dollar || null, e.votes_up, e.votes_down],
    });
  }

  console.log('Seeding swarms...');
  for (const s of SWARMS_DATA) {
    await db.execute({
      sql: `INSERT INTO swarms (name, description, max_members, member_count, earning, category, difficulty, status, leader_name, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [s.name, s.description, s.max_members, s.member_count, s.earning, s.category, s.difficulty, s.status, s.leader_name, s.tags],
    });
  }

  console.log('Seeding jobs...');
  for (const j of JOBS_DATA) {
    await db.execute({
      sql: `INSERT INTO jobs (title, description, reward, reward_type, skills_needed, urgency, posted_by_name, responses_count, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [j.title, j.description, j.reward, j.reward_type, j.skills_needed, j.urgency, j.posted_by_name, j.responses_count, j.status],
    });
  }

  console.log('Seeding leaderboard...');
  for (const l of LEADERBOARD_DATA) {
    await db.execute({
      sql: `INSERT INTO leaderboard (rank, name, type, revenue, url, method) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [l.rank, l.name, l.type, l.revenue, l.url, l.method],
    });
  }

  console.log('Seeding trends...');
  for (const t of TRENDS_DATA) {
    await db.execute({
      sql: `INSERT INTO trends (icon, title, text, is_hot, sort_order) VALUES (?, ?, ?, ?, ?)`,
      args: [t.icon, t.title, t.text, t.is_hot, t.sort_order],
    });
  }

  console.log('Seed complete! 🌱');
}

seed().catch(console.error);
