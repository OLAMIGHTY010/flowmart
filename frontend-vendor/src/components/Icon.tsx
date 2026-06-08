import React from 'react';
import {
  ArrowLeft,
  User,
  Briefcase,
  Landmark,
  ChevronDown,
  Calendar,
  CreditCard,
  Hash,
  FileText,
  Check,
  Signal,
  Wifi,
  Battery,
  FileCheck,
  CheckCircle,
  Camera,
  Phone,
  MapPin,
  Building,
} from 'lucide-react';

interface IconProps {
  i: string;
  size?: number;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  'arrow-left': ArrowLeft,
  'user': User,
  'briefcase': Briefcase,
  'landmark': Landmark,
  'chevron-down': ChevronDown,
  'calendar': Calendar,
  'credit-card': CreditCard,
  'hash': Hash,
  'file-text': FileText,
  'check': Check,
  'signal': Signal,
  'wifi': Wifi,
  'battery': Battery,
  'file-check': FileCheck,
  'check-circle': CheckCircle,
  'camera': Camera,
  'phone': Phone,
  'map-pin': MapPin,
  'building': Building,
};

export default function Icon({ i, size = 16, className = '' }: IconProps) {
  const IconComponent = iconMap[i];
  if (!IconComponent) {
    console.warn(`Icon "${i}" not found in Icon mapping`);
    return null;
  }
  return <IconComponent size={size} className={className} />;
}
