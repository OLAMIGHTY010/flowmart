import Icon from '@/components/Icon';

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  accent?: boolean;
  sub?: string;
}

export default function StatCard({ label = 'Stat', value = '0', icon = 'package', accent = false, sub = '' }: StatCardProps) {
  return (
    <div className={`rounded-2xl px-4 py-4 flex flex-col gap-2 transition-all ${accent ? 'bg-primary text-primary-foreground' : 'bg-surface border border-border text-foreground'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-body ${accent ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ? 'bg-white/20' : 'bg-secondary'}`}>
          <Icon i={icon} size={16} className={accent ? 'text-primary-foreground' : 'text-primary'} />
        </div>
      </div>
      <p className="text-2xl font-headings font-extrabold" style={{ fontWeight: 800 }}>{value}</p>
      {sub ? <p className={`text-xs font-body ${accent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{sub}</p> : null}
    </div>
  );
}
