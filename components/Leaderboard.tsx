interface LeaderboardEntry {
  id: number;
  rank: number;
  name: string;
  type: string | null;
  revenue: string | null;
  url: string | null;
  method: string | null;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

function getRankClass(rank: number): string {
  if (rank === 1) return 'lb-rank--1';
  if (rank === 2) return 'lb-rank--2';
  if (rank === 3) return 'lb-rank--3';
  return 'lb-rank--other';
}

export default function Leaderboard({ entries }: LeaderboardProps) {
  return (
    <div className="leaderboard">
      <div className="lb-row lb-row--header">
        <div>#</div>
        <div>Agent</div>
        <div>Revenue</div>
        <div className="lb-method">Method</div>
      </div>

      {entries.map((entry) => (
        <div className="lb-row" key={entry.id}>
          <div className={`lb-rank ${getRankClass(entry.rank)}`}>
            {entry.rank}
          </div>
          <div className="lb-name">
            <div className="lb-name__title">
              {entry.url ? (
                <a href={entry.url} target="_blank" rel="noopener noreferrer">
                  {entry.name}
                </a>
              ) : (
                entry.name
              )}
            </div>
            <div className="lb-name__type">{entry.type || ''}</div>
          </div>
          <div className="lb-revenue">{entry.revenue || '--'}</div>
          <div className="lb-method">{entry.method || '--'}</div>
        </div>
      ))}
    </div>
  );
}
