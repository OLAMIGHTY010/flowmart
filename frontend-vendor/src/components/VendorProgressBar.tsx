import Icon from './Icon';

interface VendorProgressBarProps {
  steps?: string[];
  current?: number;
}

export default function VendorProgressBar({
  steps = ['Account', 'Profile', 'KYC', 'Store'],
  current = 0,
}: VendorProgressBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-initial">
          <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-body transition-all
              ${
                i < current
                  ? 'bg-primary text-primary-foreground'
                  : i === current
                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < current ? <Icon i="check" size={14} /> : i + 1}
            </div>
            <span
              className={`text-[11px] font-body text-center transition-all ${
                i <= current ? 'text-primary font-bold' : 'text-muted-foreground font-medium'
              }`}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-grow h-[3px] -mt-5 mx-2 rounded-full transition-all ${
                i < current ? 'bg-primary' : 'bg-muted'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
