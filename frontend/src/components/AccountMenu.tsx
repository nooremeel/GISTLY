// frontend/src/components/AccountMenu.tsx
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cx } from '../lib/cx';


interface AuthContextValue {
    user: { email?: string } | null;
    logout: () => Promise<void>;
}

export default function AccountMenu() {

    const { user, logout } = useAuth() as AuthContextValue;

    const { showToast } = useToast() as { showToast: (message: string, type?: string) => void };
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

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

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
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

    return (
        <div ref={containerRef} className="relative">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                className={cx(
                    'flex items-center gap-2 rounded-md border border-transparent py-1 pl-1 pr-2',
                    'transition-colors duration-150 hover:bg-accent-subtle',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
                )}
            >
                <span
                    aria-hidden="true"
                    className="flex size-8 items-center justify-center rounded-full bg-ink text-small font-semibold text-paper"
                >
                    {initial}
                </span>
                <span className="hidden max-w-32 truncate text-small text-muted sm:inline">
                    {email}
                </span>
                <ChevronDown
                    aria-hidden="true"
                    className={cx('size-4 text-faint transition-transform duration-150', open && 'rotate-180')}
                />
            </button>

            {open && (
                <div
                    role="menu"
                    aria-label="Account"
                    className="animate-dropdown-enter absolute right-0 top-[calc(100%+8px)] z-20 w-56 rounded-md border border-line bg-surface p-1 shadow-md"
                >
                    <div className="truncate px-3 py-2 text-small text-muted">Signed in as {email}</div>
                    <div className="my-1 h-px bg-line" />
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