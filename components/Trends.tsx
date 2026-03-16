interface Trend {
  id: number;
  icon: string | null;
  title: string;
  text: string | null;
  is_hot: number;
  sort_order: number;
}

interface TrendsProps {
  trends: Trend[];
}

export default function Trends({ trends }: TrendsProps) {
  const sortedTrends = [...trends].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="trends-grid">
      {sortedTrends.map((trend) => {
        const isHot = trend.is_hot === 1;
        return (
          <div
            className={`trend-card${isHot ? ' trend--hot' : ''} fade-in`}
            key={trend.id}
          >
            <div className="trend__icon">{trend.icon || ''}</div>
            <div className="trend__content">
              <div className="trend__title">
                {trend.title}
                {isHot && <span className="trend__hot-badge">HOT</span>}
              </div>
              <div className="trend__text">{trend.text || ''}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
