import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { PrivacyBadge } from './PrivacyBadge';
import { Badge } from './Badge';

interface ToolHeaderProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  category: string;
  categoryRoute: string;
  categoryColor: string;
  formats?: string[];
  privacyLevel: 'local' | 'optional-external' | 'external-required';
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({
  icon,
  name,
  description,
  category,
  categoryRoute,
  categoryColor,
  formats = [],
  privacyLevel,
}) => (
  <div className="mb-8 space-y-4">
    {/* Breadcrumb */}
    <nav className="flex items-center gap-1.5 text-xs text-muted-white">
      <Link to="/" className="hover:text-main-white transition-colors">Home</Link>
      <ChevronRight className="w-3 h-3" />
      <Link to={categoryRoute} className="hover:text-main-white transition-colors">{category}</Link>
      <ChevronRight className="w-3 h-3" />
      <span className="text-main-white">{name}</span>
    </nav>

    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold font-heading text-main-white">{name}</h1>
        <p className="text-sm text-muted-white mt-1">{description}</p>
        {formats.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {formats.map((f) => (
              <Badge key={f} size="sm">{f}</Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        <PrivacyBadge level={privacyLevel} compact />
      </div>
    </div>
  </div>
);

