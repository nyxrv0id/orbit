import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RepoDetailView } from '../components/RepoDetailView';
import { RepositoryMetadata } from '../types/github';

const mockRepo: RepositoryMetadata = {
  owner: 'pallets',
  name: 'flask',
  full_name: 'pallets/flask',
  description: 'The Python micro framework for building web applications.',
  html_url: 'https://github.com/pallets/flask',
  homepage: 'https://palletsprojects.com/p/flask/',
  stargazers_count: 67000,
  forks_count: 16000,
  open_issues_count: 12,
  subscribers_count: 2100,
  language: 'Python',
  languages: [{ name: 'Python', bytes: 100000, percentage: 100 }],
  license: { key: 'bsd-3-clause', name: 'BSD 3-Clause "New" or "Revised" License', spdx_id: 'BSD-3-Clause', url: null },
  default_branch: 'main',
  is_fork: false,
  is_archived: false,
  is_template: false,
  topics: ['python', 'flask', 'web-framework'],
  created_at: '2010-04-06T11:11:59Z',
  updated_at: '2024-01-01T00:00:00Z',
  pushed_at: '2024-01-02T00:00:00Z',
  size_kb: 4500,
  health_score: 92.5,
  health_breakdown: {
    score: 92.5,
    level: 'High',
    components: {
      maintenance: { score: 30, max_score: 30, reason: 'High velocity' },
      community: { score: 25, max_score: 25, reason: 'Strong community' },
      documentation: { score: 22.5, max_score: 25, reason: 'Documentation available' },
      stability: { score: 15, max_score: 20, reason: 'Stable core' },
    },
  },
};

describe('RepoDetailView Component', () => {
  it('renders repository header, metrics, and topics', () => {
    const handleToggleCompare = vi.fn();

    render(
      <RepoDetailView
        repo={mockRepo}
        activity={null}
        isLoadingActivity={false}
        isComparing={false}
        onToggleCompare={handleToggleCompare}
      />
    );

    expect(screen.getByText('flask')).toBeInTheDocument();
    expect(screen.getByText('pallets /')).toBeInTheDocument();
    expect(screen.getByText('The Python micro framework for building web applications.')).toBeInTheDocument();
    expect(screen.getByText('67,000')).toBeInTheDocument();
    expect(screen.getByText('16,000')).toBeInTheDocument();
    expect(screen.getByText('#flask')).toBeInTheDocument();

    const compareBtn = screen.getByRole('button', { name: /add to compare/i });
    fireEvent.click(compareBtn);
    expect(handleToggleCompare).toHaveBeenCalled();
  });
});
