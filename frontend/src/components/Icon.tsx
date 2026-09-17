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
  Users,
  'battery': Battery,
  'file-check': FileCheck,
  'check-circle': CheckCircle,
  'camera': Camera,
  'phone': Phone,
  'map-pin': MapPin,
  'building': Building,
  'bell': Bell,
  'bell-ring': BellRing,
  'loader': Loader2,
  'trending-up': TrendingUp,
  'package': Package,
  'plus-circle': PlusCircle,
  'tag': Tag,
  'truck': Truck,
  'shopping-cart': ShoppingCart,
  'home': Home,
  'shopping-bag': ShoppingBag,
  'bar-chart-2': BarChart2,
  'settings': Settings,
  'alert-circle': AlertCircle,
  'shield-check': ShieldCheck,
  'clock': Clock,
  'upload': Upload,
};

export default function Icon({ i, size = 16, className = '' }: IconProps) {
  const IconComponent = iconMap[i];
  if (!IconComponent) {
    console.warn(`Icon "${i}" not found in Icon mapping`);
    return null;
  }
  return <IconComponent size={size} className={className} />;
}
