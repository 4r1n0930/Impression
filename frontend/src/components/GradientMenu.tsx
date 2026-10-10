import React from 'react';
import './GradientMenu.css';

export interface ControlItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  isOff?: boolean;
  onClick?: () => void;
}

export default function GradientMenu({ items, className = '' }: { items: ControlItem[]; className?: string }) {
  return (
    <ul className={`gm-list ${className}`}>
      {items.map(({ id, title, icon, gradientFrom, gradientTo, isOff, onClick }) => (
        <li key={id} style={{ '--gradient-from': gradientFrom, '--gradient-to': gradientTo } as React.CSSProperties}>
          <button type="button" className="gm-btn" onClick={onClick} aria-label={title} aria-pressed={!!isOff}>
            <span className={`gm-bg ${isOff ? 'is-off' : ''}`} />
            <span className="gm-glow" />
            <span className={`gm-icon ${isOff ? 'is-off' : ''}`}>{icon}</span>
            <span className="gm-title">{title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
