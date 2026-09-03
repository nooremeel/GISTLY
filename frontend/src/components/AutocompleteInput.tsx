import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../lib/cx';
import { Tag } from './Tag';

export interface AutocompleteInputProps {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  options: string[];
  /** If true, returns string[]. If false, returns string. */
  multiple?: boolean;
  value: string | string[];
  onChange: (val: any) => void;
  error?: string;
}

export function AutocompleteInput({
  id,
  name,
  label,
  placeholder,
  disabled,
  options,
  multiple = false,
  value,
  onChange,
  error,
}: AutocompleteInputProps) {
  const [inputValue, setInputValue] = useState(multiple ? '' : (value as string));
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  // Sync input value with external value if not multiple
  useEffect(() => {
    if (!multiple) {
      setInputValue((value as string) || '');
    }
  }, [value, multiple]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(e.target as Node);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(e.target as Node);
      
      if (isOutsideContainer && isOutsideDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4, // 4px gap
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const filteredOptions = options
    .filter(
      (opt) =>
        opt.toLowerCase().includes(inputValue.toLowerCase()) &&
        (!multiple || !(value as string[]).includes(opt))
    )
    .slice(0, 4);

  const handleSelect = (option: string) => {
    if (multiple) {
      const arr = value as string[];
      if (!arr.includes(option)) {
        onChange([...arr, option]);
      }
      setInputValue('');
      setIsOpen(false);
      inputRef.current?.focus();
    } else {
      setInputValue(option);
      onChange(option);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (multiple && inputValue.trim()) {
        const val = inputValue.trim();
        const topSuggestion = filteredOptions.find((o) => o.toLowerCase() === val.toLowerCase());
        const finalVal = topSuggestion || val;
        
        const arr = value as string[];
        if (!arr.includes(finalVal)) {
          onChange([...arr, finalVal]);
        }
        setInputValue('');
        setIsOpen(false);
      } else if (!multiple && inputValue.trim()) {
        onChange(inputValue.trim());
        setIsOpen(false);
      }
    } else if (e.key === 'Backspace' && multiple && !inputValue && (value as string[]).length > 0) {
      const arr = [...(value as string[])];
      arr.pop();
      onChange(arr);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      setIsOpen(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);
    if (!multiple) {
      onChange(val);
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (disabled) return;
    onChange((value as string[]).filter((t) => t !== tagToRemove));
  };

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-small font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <div
          className={cx(
            'flex flex-wrap items-center gap-2 min-h-[48px] w-full px-3 py-2 rounded-md border text-base outline-none transition-colors duration-150',
            disabled ? 'bg-surface border-line/50 text-faint cursor-not-allowed' : 'bg-surface border-line hover:border-line-hover text-ink',
            error ? 'border-red-500 hover:border-red-600 focus-within:ring-2 focus-within:ring-red-500' : 'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-paper'
          )}
          onClick={() => {
            if (!disabled) {
              inputRef.current?.focus();
              setIsOpen(true);
            }
          }}
        >
          {multiple && (
            <>
              {(value as string[]).map((tag) => (
                <Tag
                  key={tag}
                  active
                  className="!px-2 !py-0.5 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  title="Click to remove"
                  noPrefix
                >
                  {tag} &times;
                </Tag>
              ))}
            </>
          )}
          <input
            ref={inputRef}
            id={id}
            name={name}
            type="text"
            className="flex-1 min-w-[120px] bg-transparent outline-none border-none p-0 text-base m-0 placeholder-muted disabled:cursor-not-allowed disabled:text-faint"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            onBlur={(e) => {
              // Only close if focus didn't move inside the dropdown list
              if (dropdownRef.current?.contains(e.relatedTarget as Node)) return;
              setIsOpen(false);

              if (multiple && inputValue.trim()) {
                const val = inputValue.trim();
                const topSuggestion = filteredOptions.find((o) => o.toLowerCase() === val.toLowerCase());
                const finalVal = topSuggestion || val;
                const arr = value as string[];
                if (!arr.includes(finalVal)) {
                  onChange([...arr, finalVal]);
                }
                setInputValue('');
              } else if (!multiple && inputValue.trim()) {
                onChange(inputValue.trim());
              }
            }}
            placeholder={multiple && (value as string[]).length > 0 ? '' : placeholder}
            disabled={disabled}
            autoComplete="off"
          />
        </div>

        {isOpen && filteredOptions.length > 0 && typeof document !== 'undefined' && createPortal(
          <ul 
            ref={dropdownRef}
            className="z-[9999] max-h-40 overflow-y-auto overscroll-contain bg-surface border border-line rounded-md shadow-lg py-1 text-small"
            style={dropdownStyle}
          >
            {filteredOptions.map((opt) => (
              <li
                key={opt}
                className="px-3 py-2 cursor-pointer hover:bg-accent-subtle hover:text-accent transition-colors"
                onMouseDown={(e) => {
                  // Prevent input blur before click finishes
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(opt);
                }}
              >
                {opt}
              </li>
            ))}
          </ul>,
          document.body
        )}
      </div>
      {error && <p className="text-small text-red-500">{error}</p>}
    </div>
  );
}
