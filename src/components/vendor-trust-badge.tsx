'use client';

import { Shield, Award, Star, AlertTriangle } from 'lucide-react';
import { getTrustTier } from '@/lib/vendor-trust';

interface VendorTrustBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  language?: 'sw' | 'en';
}

export default function VendorTrustBadge({
  score,
  size = 'md',
  showLabel = true,
  language = 'sw',
}: VendorTrustBadgeProps) {
  const sw = language === 'sw';
  const tier = getTrustTier(score);

  const sizeConfig = {
    sm: { badge: 'w-6 h-6', icon: 12, text: 'text-xs', score: 'text-[10px]' },
    md: { badge: 'w-8 h-8', icon: 16, text: 'text-sm', score: 'text-xs' },
    lg: { badge: 'w-12 h-12', icon: 20, text: 'text-base', score: 'text-sm' },
  };

  const config = sizeConfig[size];

  const IconComponent = score >= 81 ? Award : score >= 61 ? Shield : score >= 31 ? Star : AlertTriangle;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className={`${config.badge} rounded-full flex items-center justify-center ${tier.bgColor}`}
        style={score >= 81 ? { background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', boxShadow: '0 0 8px rgba(245,158,11,0.3)' } : {}}
      >
        <IconComponent
          size={config.icon}
          style={{ color: tier.color }}
        />
      </div>
      <div className="flex flex-col">
        <span className={`${config.score} font-bold`} style={{ color: tier.color }}>
          {score}
        </span>
        {showLabel && (
          <span className={`${config.score} text-gray-400 leading-none`}>
            {sw ? tier.labelSw : tier.label}
          </span>
        )}
      </div>
    </div>
  );
}
