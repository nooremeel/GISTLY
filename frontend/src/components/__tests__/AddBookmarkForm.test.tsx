import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddBookmarkForm from '../AddBookmarkForm';
import { apiClient } from '../../api/client';
import type { Bookmark } from '../../types/bookmark';

// Mock apiClient
vi.mock('../../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    postFormData: vi.fn(),
  },
  getImageUrl: vi.fn((path) => path),
}));

// Mock useToast
const mockShowToast = vi.fn();
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

describe('AddBookmarkForm component', () => {
  const onProcessingMock = vi.fn();
  const onCreatedMock = vi.fn();
  const onFailedMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocked responses for tag/collection autocomplete
    vi.mocked(apiClient.get).mockImplementation((path: string) => {
      if (path.includes('/tags')) {
        return Promise.resolve({ data: [{ _id: 'design' }, { _id: 'tech' }] } as any);
      }
      if (path.includes('/collections')) {
        return Promise.resolve({ data: [{ _id: 'Work' }, { _id: 'Reading' }] } as any);
      }
      return Promise.resolve({ data: [] } as any);
    });
  });

  it('renders all form input fields', async () => {
    render(
      <AddBookmarkForm
        onProcessing={onProcessingMock}
        onCreated={onCreatedMock}
        onFailed={onFailedMock}
      />
    );

    expect(await screen.findByLabelText(/paste a url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^title$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^note$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/collection/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add bookmark/i })).toBeInTheDocument();
  });


  it('shows error and blocks submission if both URL and note are empty', async () => {
    const user = userEvent.setup();

    render(
      <AddBookmarkForm
        onProcessing={onProcessingMock}
        onCreated={onCreatedMock}
        onFailed={onFailedMock}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /add bookmark/i });
    await user.click(submitBtn);

    expect(screen.getAllByText('Please provide a URL or a note.').length).toBeGreaterThan(0);
    expect(onProcessingMock).not.toHaveBeenCalled();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('submits successfully when URL is provided and fires optimistic + created callbacks', async () => {
    const user = userEvent.setup();
    const createdBookmark: Bookmark = {
      _id: 'bm-new-1',
      title: 'Vite',
      url: 'https://vitejs.dev',
      summary: 'Next Generation Frontend Tooling',
      tags: ['vite', 'frontend'],
      collection: 'Uncategorized',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce(createdBookmark);

    render(
      <AddBookmarkForm
        onProcessing={onProcessingMock}
        onCreated={onCreatedMock}
        onFailed={onFailedMock}
      />
    );

    const urlInput = screen.getByLabelText(/paste a url/i);
    await user.type(urlInput, 'https://vitejs.dev');

    const submitBtn = screen.getByRole('button', { name: /add bookmark/i });
    await user.click(submitBtn);

    // Optimistic processing callback fires immediately
    expect(onProcessingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        _processing: true,
        url: 'https://vitejs.dev',
      })
    );

    // After API resolves, onCreated callback fires with real bookmark data
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/bookmarks',
        expect.objectContaining({
          url: 'https://vitejs.dev',
        })
      );
      expect(onCreatedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'bm-new-1',
          url: 'https://vitejs.dev',
          _animateGist: true,
        })
      );
      expect(mockShowToast).toHaveBeenCalledWith('Bookmark added!', 'success');
    });
  });

  it('handles API failures by calling onFailed and restoring the user input', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Server unavailable'));

    render(
      <AddBookmarkForm
        onProcessing={onProcessingMock}
        onCreated={onCreatedMock}
        onFailed={onFailedMock}
      />
    );

    const urlInput = screen.getByLabelText(/paste a url/i);
    await user.type(urlInput, 'https://failing-url.com');

    const submitBtn = screen.getByRole('button', { name: /add bookmark/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onFailedMock).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith('Server unavailable', 'error');
      // Input value is restored
      expect(screen.getByLabelText(/paste a url/i)).toHaveValue('https://failing-url.com');
    });
  });
});

