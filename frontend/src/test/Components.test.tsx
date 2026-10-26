import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageBar } from '../components/LanguageBar';
import { HealthScoreCard } from '../components/HealthScoreCard';
import { HealthScoreBreakdown, LanguageShare } from '../types/github';

describe('LanguageBar Component', () => {
  it('renders language list with percentages', () => {
    const mockLanguages: LanguageShare[] = [
      { name: 'Python', bytes: 80000, percentage: 80 },
      { name: 'Rust', bytes: 20000, percentage: 20 },
    ];

    render(<LanguageBar languages={mockLanguages} />);

    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Rust')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('handles empty language list gracefully', () => {
    render(<LanguageBar languages={[]} />);
    expect(screen.getByText(/no language breakdown available/i)).toBeInTheDocument();
  });
});

describe('HealthScoreCard Component', () => {
  it('renders score and breakdown components', () => {
    const mockBreakdown: HealthScoreBreakdown = {
      score: 85,
      level: 'High',
      components: {
        maintenance: { score: 25, max_score: 30, reason: 'Active commits within 30 days.' },
        community: { score: 25, max_score: 25, reason: 'High star count and active forks.' },
        documentation: { score: 20, max_score: 25, reason: 'License and description present.' },
        stability: { score: 15, max_score: 20, reason: 'Established codebase with tags.' },
      },
    };

    render(<HealthScoreCard breakdown={mockBreakdown} healthScore={85} />);

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Maintenance & Velocity')).toBeInTheDocument();
    expect(screen.getByText('Active commits within 30 days.')).toBeInTheDocument();
  });
});
