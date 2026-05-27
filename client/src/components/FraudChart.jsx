import { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { formatDate } from '../utils/helpers';

export default function FraudChart({ data = [] }) {
  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    
    // Reverse for chronological order
    return [...data].reverse().map(item => ({
      date: formatDate(item.createdAt),
      riskScore: item.riskScore,
      amount: item.amount,
      isFraud: item.isFraud ? 100 : 0
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Risk Trend Analysis</h3>
            <p className="chart-sub">Not enough data to display chart</p>
          </div>
        </div>
        <div className="empty-state" style={{ height: 300 }}>
          <p>Process more transactions to see trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">Risk Trend Analysis</h3>
          <p className="chart-sub">Transaction risk scores over time</p>
        </div>
      </div>
      
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="var(--text-muted)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              stroke="var(--text-muted)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-elevated)', 
                borderColor: 'var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
            <Area 
              type="monotone" 
              dataKey="riskScore" 
              name="Risk Score"
              stroke="var(--accent)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorRisk)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}