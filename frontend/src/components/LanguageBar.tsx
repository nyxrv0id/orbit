import React from 'react';
import { LanguageShare } from '../types/github';

interface LanguageBarProps {
  languages: LanguageShare[];
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  'C++': '#f34b7d',
  C: '#555555',
  Java: '#b07219',
  Ruby: '#701516',
  PHP: '#4F5D95',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Dockerfile: '#384d54',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const LanguageBar: React.FC<LanguageBarProps> = ({ languages }) => {
  if (!languages || languages.length === 0) {
    return (
      <div className="text-xs text-orbit-faint italic font-mono py-2">
        No language breakdown available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Percentage Multi-bar */}
      <div className="h-2 w-full rounded-full bg-orbit-subtle overflow-hidden flex">
        {languages.map((lang) => {
          const color = LANGUAGE_COLORS[lang.name] || '#8b5cf6';
          return (
            <div
              key={lang.name}
              style={{
                width: `${lang.percentage}%`,
                backgroundColor: color,
              }}
              title={`${lang.name}: ${lang.percentage}% (${formatBytes(lang.bytes)})`}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all"
            />
          );
        })}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
        {languages.map((lang) => {
          const color = LANGUAGE_COLORS[lang.name] || '#8b5cf6';
          return (
            <div key={lang.name} className="flex items-center gap-2 text-xs font-mono">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-orbit-text truncate">{lang.name}</span>
              <span className="text-orbit-muted ml-auto">{lang.percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
