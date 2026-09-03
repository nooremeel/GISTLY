import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cx } from '../lib/cx';
import { apiClient, getImageUrl } from '../api/client';

export default function AccountMenu({ variant = 'header' }: { variant?: 'header' | 'tab' }) {

    const { user, logout, updateProfile } = useAuth();

    const { showToast } = useToast();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (!open) return;

        function handlePointerDown(e: MouseEvent) {
            if (!containerRef.current?.contains(e.target as Node)) {
                setOpen(false);
            }
        }

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setOpen(false);
                triggerRef.current?.focus();
            }
        }

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    if (!user) return null;

    const email: string = user.email ?? '';
    const initial = email ? email[0]!.toUpperCase() : '?';

    const handleLogout = async () => {
        setOpen(false);
        await logout();
        showToast('Logged out successfully', 'success');
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setIsUploading(true);
        try {
            const res = await apiClient.postFormData<{ url: string }>('/api/uploads', formData);
            await updateProfile({ profilePicture: res.url });
            showToast('Profile picture updated', 'success');
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to update profile picture', 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div ref={containerRef} className={cx('relative', variant === 'tab' && 'flex-1 flex')}>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className={cx(
                    'transition-colors duration-150 outline-none bg-transparent border-none p-0',
                    variant === 'header' 
                      ? 'flex items-center gap-2 rounded-md border border-transparent py-1 pl-1 pr-2 hover:bg-accent-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
                      : 'flex flex-col items-center justify-center gap-1 flex-1 py-2 w-full text-[10px] font-medium text-muted hover:text-ink'
                )}
            >
                {user.profilePicture ? (
                    <img
                        src={getImageUrl(user.profilePicture)}
                        alt="Profile"
                        className={cx(
                            "object-cover rounded-full shrink-0 border border-line",
                            variant === 'header' ? "size-8" : "size-6"
                        )}
                    />
                ) : (
                    <span
                        aria-hidden="true"
                        className={cx(
                            "flex shrink-0 items-center justify-center rounded-full font-semibold text-paper",
                            variant === 'header' ? "size-8 bg-ink text-small" : "size-6 bg-ink text-xs"
                        )}
                    >
                        {initial}
                    </span>
                )}
                
                {variant === 'header' && (
                    <>
                        <span className="hidden max-w-32 truncate text-small text-muted sm:inline">
                            {email}
                        </span>
                        <ChevronDown
                            aria-hidden="true"
                            className={cx('size-4 text-faint transition-transform duration-150', open && 'rotate-180')}
                        />
                    </>
                )}
                
                {variant === 'tab' && (
                    <span className="text-[10px] font-medium">Profile</span>
                )}
            </button>

            {open && (
                <div
                    role="menu"
                    aria-label="Account"
                    className="animate-dropdown-enter absolute right-0 max-md:bottom-[calc(100%+8px)] max-md:top-auto md:top-[calc(100%+8px)] z-20 w-56 rounded-md border border-line bg-surface p-1 shadow-md"
                >
                    <div className="truncate px-3 py-2 text-small text-muted">Signed in as {email}</div>
                    <div className="my-1 h-px bg-line" />
                    
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className={cx(
                            'flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-small text-ink',
                            'transition-colors duration-150 hover:bg-accent-subtle',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                            isUploading && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <ImageIcon aria-hidden="true" className="size-4 text-muted" />
                        {isUploading ? 'Uploading...' : 'Change picture'}
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                    />

                    <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className={cx(
                            'flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-small text-ink',
                            'transition-colors duration-150 hover:bg-accent-subtle',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
                        )}
                    >
                        <LogOut aria-hidden="true" className="size-4 text-muted" />
                        Log out
                    </button>
                </div>
            )}
        </div>
    );
}