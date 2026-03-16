export const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  api_key TEXT UNIQUE,
  webhook_url TEXT,
  type TEXT NOT NULL DEFAULT 'external' CHECK(type IN ('platform', 'external')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  url TEXT,
  description TEXT,
  stage TEXT,
  model TEXT,
  traction TEXT,
  earn_potential TEXT,
  difficulty TEXT,
  time_to_first_dollar TEXT,
  votes_up INTEGER NOT NULL DEFAULT 0,
  votes_down INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'pending', 'rejected')),
  posted_by_user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS swarms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  max_members INTEGER NOT NULL DEFAULT 50,
  member_count INTEGER NOT NULL DEFAULT 0,
  earning TEXT,
  category TEXT,
  difficulty TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'full', 'closed')),
  leader_name TEXT,
  leader_user_id INTEGER,
  tags TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leader_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  reward TEXT,
  reward_type TEXT,
  skills_needed TEXT DEFAULT '[]',
  urgency TEXT DEFAULT 'active',
  posted_by_name TEXT,
  posted_by_user_id INTEGER,
  responses_count INTEGER NOT NULL DEFAULT 0,
  webhook_url TEXT,
  contact_endpoint TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'closed', 'expired')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('job_apply', 'swarm_join')),
  target_id INTEGER NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_type TEXT NOT NULL DEFAULT 'agent' CHECK(applicant_type IN ('agent', 'human')),
  pitch TEXT,
  contact TEXT,
  endpoint_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'waitlisted')),
  routed_to TEXT,
  webhook_response_code INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(applicant_name, type, target_id)
);

CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,
  voter_fingerprint TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('up', 'down')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entry_id) REFERENCES entries(id),
  UNIQUE(entry_id, voter_fingerprint)
);

CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rank INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  revenue TEXT,
  url TEXT,
  method TEXT
);

CREATE TABLE IF NOT EXISTS trends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  icon TEXT,
  title TEXT NOT NULL,
  text TEXT,
  is_hot INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS feed_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('vote', 'application', 'job_posted', 'entry_suggested', 'swarm_joined', 'tweet_verified', 'tweet_paid', 'support_ticket')),
  actor_name TEXT NOT NULL,
  target_name TEXT NOT NULL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tweet_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  tweet_url TEXT NOT NULL UNIQUE,
  tweet_id TEXT NOT NULL UNIQUE,
  author_username TEXT,
  author_id TEXT,
  wallet_address TEXT NOT NULL,
  reward_amount REAL NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK(verification_status IN ('pending', 'verified', 'rejected', 'paid')),
  rejection_reason TEXT,
  tx_hash TEXT,
  verified_at DATETIME,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_config (
  id INTEGER PRIMARY KEY,
  total_budget REAL NOT NULL DEFAULT 200,
  total_spent REAL NOT NULL DEFAULT 0,
  total_tweets_paid INTEGER NOT NULL DEFAULT 0,
  job_active INTEGER NOT NULL DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK(category IN ('general', 'payment', 'verification', 'bug', 'feature', 'swarm', 'job', 'account')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'auto_resolved', 'escalated', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
  submitter_name TEXT NOT NULL,
  submitter_type TEXT NOT NULL DEFAULT 'agent' CHECK(submitter_type IN ('agent', 'human')),
  contact TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'user' CHECK(sender_type IN ('user', 'auto', 'admin')),
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id)
);
`;
