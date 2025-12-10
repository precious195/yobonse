'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

interface ThemeToggleProps {
    className?: string;
    showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:opacity-80 ${className}`}
            style={{ color: 'var(--muted)' }}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <div className="relative w-5 h-5">
                {/* Sun icon */}
                <Sun
                    className={`w-5 h-5 absolute transition-all duration-300 ${theme === 'light'
                        ? 'rotate-0 scale-100 opacity-100'
                        : 'rotate-90 scale-0 opacity-0'
                        }`}
                    style={{ color: theme === 'light' ? 'var(--warning)' : 'var(--muted)' }}
                />
                {/* Moon icon */}
                <Moon
                    className={`w-5 h-5 absolute transition-all duration-300 ${theme === 'dark'
                        ? 'rotate-0 scale-100 opacity-100'
                        : '-rotate-90 scale-0 opacity-0'
                        }`}
                    style={{ color: theme === 'dark' ? 'var(--primary-light)' : 'var(--muted)' }}
                />
            </div>
            {showLabel && (
                <span className="font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            )}
        </button>
    );
}
