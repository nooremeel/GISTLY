import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookmarkCard from '../BookmarkCard';
import type { Bookmark } from '../../types/bookmark';
import { apiClient } from '../../api/client';

vi.mock('../../api/client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    delete: vi.fn(),
    put: vi.fn(),
  },
  getImageUrl: vi.fn((path) => path),
}));

const mockShowToast = vi.fn();
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

const sampleBookmark: Bookmark = {
  _id: 'bm-123',
  title: 'React Documentation',
  url: 'https://react.dev/learn',
  note: 'Essential guide for modern React patterns.',
  summary: 'Official documentation and interactive tutorials for React.',
  tags: ['react', 'frontend', 'javascript', 'docs', 'web', 'ui'],
  collection: 'Learning',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('BookmarkCard component', () => {
  const onUpdateMock = vi.fn();
  const onDeleteMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title, domain, note, summary, and collection', () => {
    render(
      <BookmarkCard
        bookmark={sampleBookmark}
        onUpdate={onUpdateMock}
        onDelete={onDeleteMock}
      />
    );

    expect(screen.getByText('React Documentation')).toBeInTheDocument();
    expect(screen.getByText('react.dev')).toBeInTheDocument();
    expect(screen.getByText('Essential guide for modern React patterns.')).toBeInTheDocument();
    expect(screen.getByText('Official documentation and interactive tutorials for React.')).toBeInTheDocument();
    expect(screen.getByText('Learning')).toBeInTheDocument();
  });

  it('limits visible tags to MAX_VISIBLE_TAGS (4) and renders overflow count', () => {
    render(
      <BookmarkCard
        bookmark={sampleBookmark}
        onUpdate={onUpdateMock}
        onDelete={onDeleteMock}
      />
    );

    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('frontend')).toBeInTheDocument();
    expect(screen.getByText('javascript')).toBeInTheDocument();
    expect(screen.getByText('docs')).toBeInTheDocument();
    expect(screen.getByText(/\+2/)).toBeInTheDocument();
  });


  it('falls back to domain or URL when title is missing', () => {
    const noTitleBookmark: Bookmark = {
      ...sampleBookmark,
      title: '',
      url: 'https://vitejs.dev',
    };

    render(
      <BookmarkCard
        bookmark={noTitleBookmark}
        onUpdate={onUpdateMock}
        onDelete={onDeleteMock}
      />
    );

    expect(screen.getByText('vitejs.dev')).toBeInTheDocument();
  });

  it('opens EditBookmarkModal when clicking Edit button', async () => {
    const user = userEvent.setup();
    render(
      <BookmarkCard
        bookmark={sampleBookmark}
        onUpdate={onUpdateMock}
        onDelete={onDeleteMock}
      />
    );

    const editBtn = screen.getByRole('button', { name: /edit bookmark/i });
    await user.click(editBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /edit bookmark/i })).toBeInTheDocument();
  });


  it('requires two-step confirmation before deleting bookmark', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.delete).mockResolvedValueOnce({});

    render(
      <BookmarkCard
        bookmark={sampleBookmark}
        onUpdate={onUpdateMock}
        onDelete={onDeleteMock}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: /delete bookmark/i });

    await user.click(deleteBtn);
    expect(screen.getByText('Sure?')).toBeInTheDocument();
    expect(apiClient.delete).not.toHaveBeenCalled();
    expect(onDeleteMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /confirm delete bookmark/i }));

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith('/api/bookmarks/bm-123');
      expect(onDeleteMock).toHaveBeenCalledWith('bm-123');
      expect(mockShowToast).toHaveBeenCalledWith('Bookmark deleted', 'success');
    });
  });
});
