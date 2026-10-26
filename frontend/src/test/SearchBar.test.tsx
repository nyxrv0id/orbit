import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../components/SearchBar';

describe('SearchBar Component', () => {
  it('renders input with placeholder and shortcut key', () => {
    const handleSelect = vi.fn();
    render(<SearchBar onSelectRepo={handleSelect} />);

    const input = screen.getByLabelText('Repository search');
    expect(input).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
  });

  it('triggers onSelectRepo with parsed owner and repo on submit', () => {
    const handleSelect = vi.fn();
    render(<SearchBar onSelectRepo={handleSelect} />);

    const input = screen.getByLabelText('Repository search');
    fireEvent.change(input, { target: { value: 'tiangolo/fastapi' } });
    fireEvent.submit(input);

    expect(handleSelect).toHaveBeenCalledWith('tiangolo', 'fastapi');
  });

  it('correctly parses full GitHub URL into owner and repo', () => {
    const handleSelect = vi.fn();
    render(<SearchBar onSelectRepo={handleSelect} />);

    const input = screen.getByLabelText('Repository search');
    fireEvent.change(input, { target: { value: 'https://github.com/pallets/flask' } });
    fireEvent.submit(input);

    expect(handleSelect).toHaveBeenCalledWith('pallets', 'flask');
  });
});
