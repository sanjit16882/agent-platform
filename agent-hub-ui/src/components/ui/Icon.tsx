import React from 'react';

export interface IconProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Icon: React.FC<IconProps> = ({ name, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Simple icon mapping using Unicode symbols and CSS
  const getIconContent = () => {
    switch (name) {
      case 'brain': return '🧠';
      case 'lightbulb': return '💡';
      case 'target': return '🎯';
      case 'clock': return '🕐';
      case 'check': return '✅';
      case 'alert': return '⚠️';
      case 'zap': return '⚡';
      case 'settings': return '⚙️';
      case 'trending': return '📈';
      case 'wand': return '🪄';
      case 'code': return '💻';
      case 'sparkles': return '✨';
      case 'workflow': return '🔄';
      case 'play': return '▶️';
      case 'pause': return '⏸️';
      case 'arrow-right': return '→';
      case 'map': return '🗺️';
      case 'wrench': return '🔧';
      case 'users': return '👥';
      case 'star': return '⭐';
      case 'message': return '💬';
      case 'award': return '🏆';
      case 'chart': return '📊';
      case 'undo': return '↶';
      case 'git-branch': return '🌿';
      default: return '●';
    }
  };

  return (
    <span 
      className={`inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}
      style={{ fontSize: size === 'sm' ? '12px' : size === 'lg' ? '20px' : '16px' }}
    >
      {getIconContent()}
    </span>
  );
};