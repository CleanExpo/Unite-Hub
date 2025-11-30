/**
 * Tabs Component
 *
 * Accessible tab navigation with keyboard support.
 * Supports icons, disabled tabs, and lazy-loading content.
 *
 * @example
 * <Tabs
 *   tabs={[
 *     { id: 'account', label: 'Account', content: <AccountSettings /> },
 *     { id: 'security', label: 'Security', content: <SecuritySettings /> },
 *   ]}
 *   defaultActive="account"
 *   onChange={(id) => console.log(id)}
 * />
 *
 * @example
 * <Tabs
 *   tabs={[
 *     { id: 'home', label: 'Home', icon: <HomeIcon />, content: <HomePage /> },
 *     { id: 'settings', label: 'Settings', icon: <SettingsIcon />, content: <SettingsPage /> },
 *   ]}
 * />
 */

import { forwardRef, ReactNode, useState, HTMLAttributes } from 'react';

export interface TabItem {
  /** Unique identifier for tab */
  id: string;

  /** Tab label text or node */
  label: string | ReactNode;

  /** Tab content */
  content: ReactNode;

  /** Optional icon */
  icon?: ReactNode;

  /** Disable this tab */
  disabled?: boolean;
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  /** Array of tab items */
  tabs: TabItem[];

  /** Initially active tab ID */
  defaultActive?: string;

  /** Callback when active tab changes */
  onChange?: (tabId: string) => void;

  /** Custom CSS class */
  className?: string;

  /** Show tab icons */
  showIcons?: boolean;
}

/**
 * Tabs Component
 *
 * Uses design tokens:
 * - Tab list: border-border-subtle
 * - Active tab: border-accent-500, text-accent-500
 * - Inactive tab: text-text-secondary, hover:text-text-primary
 * - Content: pt-6
 * - Animations: duration-normal, ease-out
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      tabs,
      defaultActive,
      onChange,
      className = '',
      showIcons = true,
      ...props
    },
    ref
  ) => {
    const initialTab = defaultActive || tabs[0]?.id || '';
    const [activeTab, setActiveTab] = useState(initialTab);

    const handleTabChange = (tabId: string) => {
      const tab = tabs.find(t => t.id === tabId);
      if (tab && !tab.disabled) {
        setActiveTab(tabId);
        onChange?.(tabId);
      }
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const activeIndex = tabs.findIndex(t => t.id === activeTab);

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp': {
          e.preventDefault();
          let previousIndex = activeIndex - 1;
          // Skip disabled tabs
          while (previousIndex >= 0 && tabs[previousIndex].disabled) {
            previousIndex--;
          }
          if (previousIndex >= 0) {
            handleTabChange(tabs[previousIndex].id);
            (e.target as HTMLElement).previousElementSibling?.focus();
          }
          break;
        }
        case 'ArrowRight':
        case 'ArrowDown': {
          e.preventDefault();
          let nextIndex = activeIndex + 1;
          // Skip disabled tabs
          while (nextIndex < tabs.length && tabs[nextIndex].disabled) {
            nextIndex++;
          }
          if (nextIndex < tabs.length) {
            handleTabChange(tabs[nextIndex].id);
            (e.target as HTMLElement).nextElementSibling?.focus();
          }
          break;
        }
        case 'Home': {
          e.preventDefault();
          const firstEnabledTab = tabs.find(t => !t.disabled);
          if (firstEnabledTab) {
            handleTabChange(firstEnabledTab.id);
          }
          break;
        }
        case 'End': {
          e.preventDefault();
          for (let i = tabs.length - 1; i >= 0; i--) {
            if (!tabs[i].disabled) {
              handleTabChange(tabs[i].id);
              break;
            }
          }
          break;
        }
      }
    };

    const activeTabContent = tabs.find(t => t.id === activeTab)?.content;

    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        {/* Tab List */}
        <div
          role="tablist"
          className="flex gap-1 border-b border-border-subtle overflow-x-auto"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-disabled={tab.disabled}
              id={`tab-${tab.id}`}
              className={`
                px-4 py-3
                font-medium
                text-sm
                whitespace-nowrap
                border-b-2
                transition-colors duration-normal ease-out
                focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-base
                ${
                  activeTab === tab.id
                    ? 'border-accent-500 text-accent-500'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              onClick={() => handleTabChange(tab.id)}
              onKeyDown={handleKeyDown}
              disabled={tab.disabled}
            >
              <span className="flex items-center gap-2">
                {showIcons && tab.icon && <span className="text-base">{tab.icon}</span>}
                <span>{tab.label}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="pt-6">
          {activeTabContent && (
            <div
              role="tabpanel"
              id={`panel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
              className="animate-in fade-in duration-100"
            >
              {activeTabContent}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

export default Tabs;
