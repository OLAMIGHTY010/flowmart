import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  HelpCircle,
  TrendingUp,
  BarChart2,
  PieChart,
  CornerDownLeft,
  Bot,
  User,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  DataVisualizationServices,
  type AskDataCopilotResponse,
} from '@/services/DataVisualizationServices';

export const AskYourDataCopilot: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AskDataCopilotResponse | null>(null);

  const samplePrompts = [
    'What is our 14-day demand forecast?',
    'Show me the 80/20 Pareto vital products',
    'Which delivery zone has the worst SLA bottleneck?',
    'What is our current locked escrow liquidity?',
  ];

  const handleSearch = async (promptToUse?: string) => {
    const q = (promptToUse || query).trim();
    if (!q || loading) return;

    setLoading(true);
    try {
      const res = await DataVisualizationServices.askDataCopilot(q);
      setResponse(res);
      if (promptToUse) setQuery(promptToUse);
    } catch (err) {
      console.error('AskYourDataCopilot Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNaira = (val: number) => {
    if (!val) return '₦0';
    if (val >= 1_000_000) return `₦${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `₦${(val / 1_000).toFixed(0)}k`;
    return `₦${val.toLocaleString()}`;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-gradient-to-tr from-primary to-violet-500 text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              "Ask Your Data" AI Copilot
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                Natural Language Analytics
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Instant business intelligence, dynamic charts, and prescriptive insights from plain text queries
            </p>
          </div>
        </div>
      </div>

      {/* Input Box */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-muted/40 border border-border/80 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
          <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Ask questions about sales, demand forecasts, delivery SLAs, or escrow..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors shrink-0"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Starter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Try asking:
          </span>
          {samplePrompts.map((p) => (
            <button
              key={p}
              onClick={() => handleSearch(p)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition-all text-left"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Answer Area */}
      {response && (
        <div className="bg-muted/30 border border-border/80 rounded-xl p-5 flex flex-col gap-4 animate-fadeIn">
          {/* Answer Text */}
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Executive Synthesis
              </span>
              <p className="text-sm text-foreground leading-relaxed font-medium">
                {response.answer}
              </p>
            </div>
          </div>

          {/* Key Metrics Row */}
          {response.keyMetrics?.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {response.keyMetrics.map((km, idx) => (
                <div key={idx} className="bg-card border border-border rounded-xl p-3 flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-medium">{km.label}</span>
                  <span className="text-base font-bold text-foreground mt-0.5">{km.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Dynamic Generated Chart */}
          {response.chartData?.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5" /> Generated Visual Evidence
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  {response.suggestedChartType}
                </span>
              </div>

              <div className="h-[220px] w-full bg-card border border-border/60 rounded-xl p-3">
                <ResponsiveContainer width="100%" height="100%">
                  {response.suggestedChartType === 'AREA_CHART' ? (
                    <AreaChart data={response.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="aiCopilotGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                      <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} />
                      <YAxis stroke="#888888" fontSize={11} tickLine={false} tickFormatter={(v) => formatNaira(v)} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const p = payload[0]?.payload;
                          return (
                            <div className="bg-popover text-popover-foreground border border-border rounded-xl p-2.5 shadow-md text-xs">
                              <p className="font-semibold">{p.date}</p>
                              <p className="text-primary font-medium">Revenue: {formatNaira(p.value || p.revenue || 0)}</p>
                            </div>
                          );
                        }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fill="url(#aiCopilotGradient)" />
                    </AreaChart>
                  ) : (
                    <BarChart data={response.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                      <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                      <YAxis stroke="#888888" fontSize={11} tickLine={false} tickFormatter={(v) => formatNaira(v)} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const p = payload[0]?.payload;
                          return (
                            <div className="bg-popover text-popover-foreground border border-border rounded-xl p-2.5 shadow-md text-xs">
                              <p className="font-semibold">{p.name}</p>
                              <p className="text-primary font-medium">{formatNaira(p.revenue || p.value || 0)}</p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Follow-up Prompts */}
          {response.followUpQuestions?.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1 border-t border-border/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Follow-up Exploration Questions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {response.followUpQuestions.map((fq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(fq)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-card hover:bg-primary/10 hover:text-primary text-foreground border border-border transition-colors flex items-center gap-1.5"
                  >
                    <span>{fq}</span>
                    <ArrowRight className="w-3 h-3 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
