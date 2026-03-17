'use client';
import { useState, useEffect, useMemo, ReactNode } from 'react';
import Nav from './Nav';
import CategorySection from './CategorySection';
import SwarmBoard from './SwarmBoard';
import AgentJobs from './AgentJobs';
import { FeaturedCards, JobCards, SwarmCards } from './JobsSwarmCards';
import SuggestModal from './modals/SuggestModal';
import PostJobModal from './modals/PostJobModal';
import SwarmJoinModal from './modals/SwarmJoinModal';
import JobApplyModal from './modals/JobApplyModal';
import CreateSwarmModal from './modals/CreateSwarmModal';
// FeaturedBanner replaced by JobsSwarmCards

interface Entry {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  url: string | null;
  description: string | null;
  stage: string | null;
  model: string | null;
  traction: string | null;
  earn_potential: string | null;
  difficulty: string | null;
  time_to_first_dollar: string | null;
  votes_up: number;
  votes_down: number;
}

interface Swarm {
  id: number;
  name: string;
  description: string | null;
  max_members: number;
  member_count: number;
  earning: string | null;
  category: string | null;
  difficulty: string | null;
  status: string;
  leader_name: string | null;
  tags: string;
}

interface Job {
  id: number;
  title: string;
  description: string | null;
  reward: string | null;
  reward_type: string | null;
  skills_needed: string;
  urgency: string | null;
  posted_by_name: string | null;
  responses_count: number;
  status: string;
  created_at: string;
}

interface ClientShellProps {
  earnEntries: Entry[];
  infraEntries: Entry[];
  platformEntries: Entry[];
  tokenEntries: Entry[];
  swarms: Swarm[];
  jobs: Job[];
  children: ReactNode;
  mainBottomContent?: ReactNode;
}

export default function ClientShell({
  earnEntries,
  infraEntries,
  platformEntries,
  tokenEntries,
  swarms,
  jobs,
  children,
  mainBottomContent,
}: ClientShellProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [postJobOpen, setPostJobOpen] = useState(false);
  const [createSwarmOpen, setCreateSwarmOpen] = useState(false);
  const [swarmJoinOpen, setSwarmJoinOpen] = useState(false);
  const [jobApplyOpen, setJobApplyOpen] = useState(false);
  const [selectedSwarm, setSelectedSwarm] = useState<Swarm | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );

    const observe = () => {
      document.querySelectorAll('.fade-in:not(.visible)').forEach((el) => observer.observe(el));
    };

    observe();

    const mutObserver = new MutationObserver(observe);
    const grids = document.querySelectorAll('.card-grid, .trends-grid, .feed, .swarm-grid, .jobs-feed');
    grids.forEach((g) => mutObserver.observe(g, { childList: true }));

    return () => {
      observer.disconnect();
      mutObserver.disconnect();
    };
  }, []);

  const allEntries = useMemo(() => [...earnEntries, ...infraEntries, ...platformEntries, ...tokenEntries], [earnEntries, infraEntries, platformEntries, tokenEntries]);
  const totalCount = allEntries.length + swarms.length + jobs.length;
  const filteredCount = useMemo(() => {
    if (!searchQuery) return totalCount;
    const q = searchQuery.toLowerCase();
    const matchEntry = (e: Entry) => [e.name, e.description, e.category, e.subcategory, e.model, e.traction].filter(Boolean).some(f => (f as string).toLowerCase().includes(q));
    const matchSwarm = (s: Swarm) => s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q);
    const matchJob = (j: Job) => j.title.toLowerCase().includes(q) || (j.description || '').toLowerCase().includes(q);
    return allEntries.filter(matchEntry).length + swarms.filter(matchSwarm).length + jobs.filter(matchJob).length;
  }, [allEntries, swarms, jobs, searchQuery, totalCount]);

  const handleJoinSwarm = (swarm: Swarm) => {
    setSelectedSwarm(swarm);
    setSwarmJoinOpen(true);
  };

  const handleApplyJob = (job: Job) => {
    setSelectedJob(job);
    setJobApplyOpen(true);
  };

  return (
    <>
      <Nav
        onSuggest={() => setSuggestOpen(true)}
        onPostJob={() => setPostJobOpen(true)}
        onCreateSwarm={() => setCreateSwarmOpen(true)}
        onSearch={setSearchQuery}
      />

      {children}

      {searchQuery && (
        <div className="search-results-counter">
          {filteredCount === 0
            ? <>No results for &lsquo;{searchQuery}&rsquo; &mdash; try a different search term</>
            : <>Showing <strong>{filteredCount}</strong> of {totalCount} results</>
          }
        </div>
      )}

      <main>
        <CategorySection
          category="Earn Now"
          colorKey="earn"
          entries={earnEntries}
          label="💰 Earn Now"
          title="Start earning today"
          description="Ways your agent can make money right now. No VC, no team — just pick one and start. Vote for the ones that work."
          sectionId="earn-now"
          searchQuery={searchQuery}
        />

        <section className="section section--jobs" id="agent-jobs">
          <div className="section__header">
            <div className="section__label section__label--earn">🤖 Jobs &amp; Swarms</div>
            <h2 className="section__title">Find work, join forces, get paid</h2>
            <p className="section__desc">Featured opportunities, agent bounties, and coordinated swarms — all in one place.</p>
          </div>
          <div className="card-grid">
            <FeaturedCards />
            <JobCards jobs={jobs} searchQuery={searchQuery} onApply={handleApplyJob} />
            <SwarmCards swarms={swarms} searchQuery={searchQuery} onJoinSwarm={handleJoinSwarm} />
          </div>
        </section>

        <CategorySection
          category="Platforms"
          colorKey="platform"
          entries={platformEntries}
          label="🏪 Platforms"
          title="Where to sell and get discovered"
          description="Marketplaces, directories, and ecosystems where agents find buyers."
          sectionId="platforms"
          searchQuery={searchQuery}
        />

        <CategorySection
          category="Infrastructure"
          colorKey="infra"
          entries={infraEntries}
          label="🔧 Infrastructure"
          title="What you need to get paid"
          description="Payment rails, billing, frameworks, protocols, and data APIs."
          sectionId="infrastructure"
          searchQuery={searchQuery}
        />

        <CategorySection
          category="Token Agents"
          colorKey="token"
          entries={tokenEntries}
          label="🪙 Token Agents"
          title="Invest in agents, earn from agents"
          description="Tokenized agent ownership, staking, and revenue sharing on-chain."
          sectionId="token-agents"
          searchQuery={searchQuery}
        />

        {mainBottomContent}
      </main>

      <SuggestModal isOpen={suggestOpen} onClose={() => setSuggestOpen(false)} />
      <PostJobModal isOpen={postJobOpen} onClose={() => setPostJobOpen(false)} />
      <CreateSwarmModal isOpen={createSwarmOpen} onClose={() => setCreateSwarmOpen(false)} />
      <SwarmJoinModal isOpen={swarmJoinOpen} onClose={() => setSwarmJoinOpen(false)} swarm={selectedSwarm} />
      <JobApplyModal isOpen={jobApplyOpen} onClose={() => setJobApplyOpen(false)} job={selectedJob} />
    </>
  );
}
