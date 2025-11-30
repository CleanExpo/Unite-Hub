/**
 * Dropdown/Select Component
 *
 * Customizable dropdown selector with search, multi-select, and option groups.
 * Fully keyboard accessible with click-outside detection.
 *
 * @example
 * <Dropdown
 *   options={[
 *     { value: 'option1', label: 'Option 1' },
 *     { value: 'option2', label: 'Option 2' },
 *   ]}
 *   value={selectedValue}
 *   onChange={setSelectedValue}
 *   searchable
 * />
 *
 * @example
 * <Dropdown
 *   options={[
 *     { value: 'admin', label: 'Admin', icon: <LockIcon /> },
 *     { value: 'user', label: 'User', icon: <UserIcon /> },
 *   ]}
 *   value={role}
 *   onChange={setRole}
 *   multi={false}
 * />
 */

import {
  forwardRef,
  ReactNode,
  useState,
  useRef,
  useEffect,
  HTMLAttributes,
} from 'react';

export interface DropdownOption {
  /** Unique value */
  value: string;

  /** Display label */
  label: string | ReactNode;

  /** Optional icon */
  icon?: ReactNode;

  /** Disable this option */
  disabled?: boolean;
}

export interface DropdownProps extends HTMLAttributes<HTMLDivElement> {
  /** Array of selectable options */
  options: DropdownOption[];

  /** Current selected value(s) */
  value: string | string[];

  /** Callback when selection changes */
  onChange: (value: string | string[]) => void;

  /** Allow multiple selections */
  multi?: boolean;

  /** Show search input */
  searchable?: boolean;

  /** Show clear button */
  clearable?: boolean;

  /** Placeholder text */
  placeholder?: string;

  /** Custom CSS class */
  className?: string;

  /** Disabled state */
  disabled?: boolean;
}

/**
 * Dropdown Component
 *
 * Uses design tokens:
 * - Background: bg-bg-card, border-border-subtle
 * - Text: text-text-primary, text-text-secondary
 * - Hover: bg-bg-hover
 * - Focus: ring-accent-500
 * - Animations: duration-fast, ease-out
 */
export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      options,
      value,
      onChange,
      multi = false,
      searchable = false,
      clearable = false,
      placeholder = 'Select...',
      className = '',
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Filter options based on search
    const filteredOptions = searchTerm
      ? options.filter(opt =>
          typeof opt.label === 'string'
            ? opt.label.toLowerCase().includes(searchTerm.toLowerCase())
            : false
        )
      : options;

    // Get selected option(s)
    const selectedValues = Array.isArray(value) ? value : [value];
    const selectedLabels = selectedValues
      .map(v => options.find(opt => opt.value === v)?.label)
      .filter(Boolean);

    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    // Focus search input when opened
    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, searchable]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
          break;
        }
        case 'Enter': {
          e.preventDefault();
          const option = filteredOptions[highlightedIndex];
          if (option && !option.disabled) {
            handleSelect(option.value);
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          setIsOpen(false);
          break;
        }
        case 'Home': {
          e.preventDefault();
          setHighlightedIndex(0);
          break;
        }
        case 'End': {
          e.preventDefault();
          setHighlightedIndex(Math.max(0, filteredOptions.length - 1));
          break;
        }
      }
    };

    const handleSelect = (selectedValue: string) => {
      if (multi) {
        const newValues = selectedValues.includes(selectedValue)
          ? selectedValues.filter(v => v !== selectedValue)
          : [...selectedValues, selectedValue];
        onChange(newValues);
      } else {
        onChange(selectedValue);
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(multi ? [] : '');
    };

    return (
      <div
        ref={ref}
        className={`relative w-full ${className}`}
        {...props}
      >
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full
            px-4 py-2
            text-left
            flex items-center justify-between
            bg-bg-card
            border border-border-subtle
            rounded-lg
            text-text-primary
            focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-base
            transition-colors duration-fast
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-border-medium'}
          `}
          onKeyDown={handleKeyDown}
        >
          <span className="flex items-center gap-2 flex-1 truncate">
            {selectedLabels.length > 0 ? (
              multi ? (
                <span className="text-sm text-text-secondary">
                  {selectedLabels.length} selected
                </span>
              ) : (
                selectedLabels[0]
              )
            ) : (
              <span className="text-text-secondary">{placeholder}</span>
            )}
          </span>

          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {clearable && selectedValues.length > 0 && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-bg-hover rounded transition-colors"
                aria-label="Clear selection"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <svg
              className={`w-5 h-5 text-text-secondary transition-transform duration-normal ${
                isOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className={`
              absolute
              top-full
              left-0
              right-0
              mt-2
              z-50
              bg-bg-card
              border border-border-subtle
              rounded-lg
              shadow-lg
              overflow-hidden
              animate-in fade-in zoom-in-95 duration-100
            `}
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-2 border-b border-border-subtle">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  className={`
                    w-full
                    px-3 py-2
                    bg-bg-hover
                    border border-border-subtle
                    rounded
                    text-text-primary
                    placeholder-text-secondary
                    focus:outline-none focus:ring-2 focus:ring-accent-500
                    text-sm
                  `}
                />
              </div>
            )}

            {/* Options List */}
            <div
              ref={listRef}
              className="max-h-64 overflow-y-auto"
              role="listbox"
              aria-multiselectable={multi}
            >
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-text-secondary text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full
                      px-4 py-3
                      flex items-center gap-2
                      text-left
                      text-sm
                      transition-colors duration-fast
                      focus:outline-none
                      ${
                        selectedValues.includes(option.value)
                          ? 'bg-accent-500/10 text-accent-500 font-medium'
                          : 'text-text-primary hover:bg-bg-hover'
                      }
                      ${
                        index === highlightedIndex && !option.disabled
                          ? 'bg-bg-hover'
                          : ''
                      }
                      ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    disabled={option.disabled}
                    role="option"
                    aria-selected={selectedValues.includes(option.value)}
                  >
                    {option.icon && <span className="text-base flex-shrink-0">{option.icon}</span>}
                    <span>{option.label}</span>
                    {selectedValues.includes(option.value) && (
                      <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export default Dropdown;
