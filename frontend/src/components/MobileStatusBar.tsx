import Icon from './Icon';

interface MobileStatusBarProps {
  dark?: boolean;
}

export default function MobileStatusBar({ dark = false }: MobileStatusBarProps) {
  const textColor = dark ? 'text-dark-header-foreground' : 'text-foreground';
  return (
    <div className={`flex justify-between items-center px-4 pt-3 pb-1 ${textColor}`}>
      <span className="text-sm font-bold">9:41</span>
      <div className="flex items-center gap-1.5">
        <Icon i="signal" size={14} />
        <Icon i="wifi" size={14} />
        <Icon i="battery" size={14} />
      </div>
    </div>
  );
}
