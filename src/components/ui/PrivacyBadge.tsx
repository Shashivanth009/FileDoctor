import React from 'react';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

interface PrivacyBadgeProps {
  level: 'local' | 'optional-external' | 'external-required';
  compact?: boolean;
}

const config = {
  local: {
    icon: Shield,
    label: 'Processed locally',
    description: 'This file is processed entirely in your browser.',
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/20',
  },
  'optional-external': {
    icon: Lock,
    label: 'Optional external',
    description: 'Can use an external service with your consent.',
    color: 'text-amber',
    bg: 'bg-amber/10',
    border: 'border-amber/20',
  },
  'external-required': {
    icon: AlertTriangle,
    label: 'External service required',
    description: 'This operation requires sending data to an external service.',
    color: 'text-coral',
    bg: 'bg-coral/10',
    border: 'border-coral/20',
  },
};

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({ level, compact = false }) => {
  const c = config[level];
  const Icon = c.icon;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.color} border ${c.border}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
  }

  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-lg ${c.bg} border ${c.border}`}>
      <Icon className={`w-4 h-4 mt-0.5 ${c.color} flex-shrink-0`} />
      <div>
        <p className={`text-xs font-medium ${c.color}`}>{c.label}</p>
        <p className="text-[11px] text-muted-white mt-0.5">{c.description}</p>
      </div>
    </div>
  );
};

