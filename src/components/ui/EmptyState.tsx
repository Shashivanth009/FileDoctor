import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-2xl bg-elevated-navy flex items-center justify-center mb-4 text-muted-white">
      {icon}
    </div>
    <h3 className="text-base font-medium text-main-white mb-1">{title}</h3>
    {description && <p className="text-sm text-muted-white max-w-sm">{description}</p>}
    {action && (
      <Button variant="secondary" size="sm" className="mt-4" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
);

