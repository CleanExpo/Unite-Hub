/**
 * Analytics Dashboard Component
 * 
 * This component provides a customizable dashboard for displaying analytics data.
 * It supports various widgets like metrics, charts, tables, and more.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from '@radix-ui/react-icons'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { 
  DashboardConfig, 
  ReportTimePeriod, 
  ReportMetric,
  AnalyticsMetric
} from '@/lib/analytics'

// Define analytics metric values for comparison (since we can't use the enum as a value)
const BOUNCE_RATE = 'bounce_rate';
const EXIT_RATE = 'exit_rate';
const CART_ABANDONMENT_RATE = 'cart_abandonment_rate';

// Widget types
type WidgetType = 'metric' | 'chart' | 'table' | 'funnel' | 'journey' | 'map' | 'text';

// Widget configurations
interface MetricWidgetConfig {
  metric: AnalyticsMetric | string;
  format?: string;
  prefix?: string;
  suffix?: string;
  showComparison?: boolean;
  comparisonLabel?: string;
}

interface ChartWidgetConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  metrics: Array<AnalyticsMetric | string>;
  groupBy?: string;
  stacked?: boolean;
  showLegend?: boolean;
}

interface TableWidgetConfig {
  columns: Array<{
    key: string;
    label: string;
    format?: string;
  }>;
  rows: number;
  pagination?: boolean;
  sortable?: boolean;
}

interface FunnelWidgetConfig {
  steps: Array<{
    name: string;
    metric: AnalyticsMetric | string;
  }>;
  showConversionRates?: boolean;
}

interface TextWidgetConfig {
  content: string;
}

// Widget props
interface WidgetProps {
  id: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  config: any;
  data: any;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

// Time period options
const TIME_PERIOD_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: 'last_7_days' },
  { label: 'Last 30 days', value: 'last_30_days' },
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
  { label: 'This quarter', value: 'this_quarter' },
  { label: 'Last quarter', value: 'last_quarter' },
  { label: 'This year', value: 'this_year' },
  { label: 'Last year', value: 'last_year' },
  { label: 'Custom', value: 'custom' },
];

// Comparison options
const COMPARISON_OPTIONS = [
  { label: 'Previous period', value: 'previous_period' },
  { label: 'Previous year', value: 'previous_year' },
  { label: 'None', value: 'none' },
];

// Placeholder for chart component
const Chart = ({ type, data, options }: { type: string; data: any; options: any }) => (
  <div className="h-64 w-full flex items-center justify-center bg-muted/20">
    <p className="text-muted-foreground">Chart: {type} (Placeholder)</p>
  </div>
);

// Placeholder for table component
const Table = ({ columns, rows }: { columns: any[]; rows: any[] }) => (
  <div className="h-64 w-full flex items-center justify-center bg-muted/20">
    <p className="text-muted-foreground">Table: {columns.length} columns, {rows.length} rows (Placeholder)</p>
  </div>
);

// Format metric value
const formatMetricValue = (value: number, format?: string, prefix?: string, suffix?: string): string => {
  let formattedValue = '';
  
  // Apply format
  if (format === 'percent') {
    formattedValue = `${(value * 100).toFixed(1)}%`;
  } else if (format === 'currency') {
    formattedValue = value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else if (format === 'compact') {
    formattedValue = value.toLocaleString('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    });
  } else if (format === 'duration') {
    // Convert seconds to a readable duration
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    formattedValue = minutes > 0
      ? `${minutes}m ${seconds}s`
      : `${seconds}s`;
  } else {
    formattedValue = value.toLocaleString('en-US');
  }
  
  // Apply prefix and suffix
  return `${prefix || ''}${formattedValue}${suffix || ''}`;
};

// Calculate percent change
const calculatePercentChange = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Format percent change
const formatPercentChange = (percentChange: number, higherIsBetter: boolean = true): JSX.Element => {
  const isPositive = percentChange > 0;
  const isNegative = percentChange < 0;
  const isGood = (isPositive && higherIsBetter) || (isNegative && !higherIsBetter);
  const isBad = (isNegative && higherIsBetter) || (isPositive && !higherIsBetter);
  
  const color = isGood ? 'text-green-500' : isBad ? 'text-red-500' : 'text-gray-500';
  const icon = isPositive ? '▲' : isNegative ? '▼' : '■';
  
  return (
    <span className={`${color} font-medium`}>
      {icon} {Math.abs(percentChange).toFixed(1)}%
    </span>
  );
};

// Metric Widget Component
const MetricWidget: React.FC<{
  title: string;
  subtitle?: string;
  config: MetricWidgetConfig;
  data: {
    value: number;
    previousValue?: number;
  };
  isLoading?: boolean;
}> = ({ title, subtitle, config, data, isLoading = false }) => {
  const { metric, format, prefix, suffix, showComparison = true, comparisonLabel = 'vs. previous period' } = config;
  const { value, previousValue } = data;
  
  // Whether a higher value is better (used for color coding)
  const higherIsBetter = metric !== BOUNCE_RATE && 
                        metric !== EXIT_RATE && 
                        metric !== CART_ABANDONMENT_RATE;
  
  // Calculate percent change if previous value is available
  const percentChange = previousValue !== undefined
    ? calculatePercentChange(value, previousValue)
    : undefined;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse bg-muted h-8 w-24 rounded-md"></div>
        ) : (
          <div className="space-y-1">
            <div className="text-2xl font-bold">
              {formatMetricValue(value, format, prefix, suffix)}
            </div>
            
            {showComparison && percentChange !== undefined && (
              <div className="text-sm flex items-center space-x-1">
                {formatPercentChange(percentChange, higherIsBetter)}
                <span className="text-muted-foreground text-xs">{comparisonLabel}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Chart Widget Component
const ChartWidget: React.FC<{
  title: string;
  subtitle?: string;
  config: ChartWidgetConfig;
  data: any;
  isLoading?: boolean;
}> = ({ title, subtitle, config, data, isLoading = false }) => {
  const { type, metrics, groupBy, stacked, showLegend } = config;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse bg-muted h-64 w-full rounded-md"></div>
        ) : (
          <Chart
            type={type}
            data={data}
            options={{
              stacked,
              showLegend,
              groupBy,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

// Table Widget Component
const TableWidget: React.FC<{
  title: string;
  subtitle?: string;
  config: TableWidgetConfig;
  data: any[];
  isLoading?: boolean;
}> = ({ title, subtitle, config, data, isLoading = false }) => {
  const { columns, rows, pagination, sortable } = config;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse bg-muted h-64 w-full rounded-md"></div>
        ) : (
          <Table columns={columns} rows={data.slice(0, rows)} />
        )}
      </CardContent>
    </Card>
  );
};

// Funnel Widget Component
const FunnelWidget: React.FC<{
  title: string;
  subtitle?: string;
  config: FunnelWidgetConfig;
  data: Array<{
    name: string;
    value: number;
  }>;
  isLoading?: boolean;
}> = ({ title, subtitle, config, data, isLoading = false }) => {
  const { steps, showConversionRates } = config;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse bg-muted h-64 w-full rounded-md"></div>
        ) : (
          <div className="space-y-2">
            {data.map((step, index) => {
              const width = index === 0 
                ? '100%' 
                : `${(step.value / data[0].value) * 100}%`;
              
              const conversionRate = index > 0
                ? (step.value / data[index - 1].value) * 100
                : 100;
              
              return (
                <div key={step.name} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{step.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {step.value.toLocaleString()}
                      {showConversionRates && index > 0 && (
                        <span className="ml-2 text-xs">
                          ({conversionRate.toFixed(1)}% from previous)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Text Widget Component
const TextWidget: React.FC<{
  title: string;
  subtitle?: string;
  config: TextWidgetConfig;
}> = ({ title, subtitle, config }) => {
  const { content } = config;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          {content}
        </div>
      </CardContent>
    </Card>
  );
};

// Widget Component (renders the appropriate widget based on type)
const Widget: React.FC<WidgetProps> = (props) => {
  const { type, ...rest } = props;
  
  switch (type) {
    case 'metric':
      return <MetricWidget {...rest} />;
    case 'chart':
      return <ChartWidget {...rest} />;
    case 'table':
      return <TableWidget {...rest} />;
    case 'funnel':
      return <FunnelWidget {...rest} />;
    case 'text':
      return <TextWidget {...rest} />;
    default:
      return (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{props.title}</CardTitle>
            {props.subtitle && <CardDescription>{props.subtitle}</CardDescription>}
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full flex items-center justify-center bg-muted/20">
              <p className="text-muted-foreground">Widget: {type} (Not implemented)</p>
            </div>
          </CardContent>
        </Card>
      );
  }
};

// Time Period Selector Component
const TimePeriodSelector: React.FC<{
  value: string;
  onChange: (value: string) => void;
  startDate?: Date;
  endDate?: Date;
  onCustomDateChange?: (startDate: Date, endDate: Date) => void;
}> = ({ value, onChange, startDate, endDate, onCustomDateChange }) => {
  const [isCustom, setIsCustom] = useState(value === 'custom');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: startDate,
    to: endDate,
  });

  // Handle time period change
  const handlePeriodChange = (newValue: string) => {
    setIsCustom(newValue === 'custom');
    onChange(newValue);
  };

  // Handle custom date change
  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range);
    
    if (range.from && range.to && onCustomDateChange) {
      onCustomDateChange(range.from, range.to);
    }
  };

  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
      <Select value={value} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select time period" />
        </SelectTrigger>
        <SelectContent>
          {TIME_PERIOD_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isCustom && (
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range: any) => handleDateRangeChange(range || { from: undefined, to: undefined })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

// Analytics Dashboard Component
export interface AnalyticsDashboardProps {
  /**
   * Dashboard configuration
   */
  config: DashboardConfig;
  
  /**
   * Dashboard data
   */
  data?: any;
  
  /**
   * Whether data is currently loading
   */
  isLoading?: boolean;
  
  /**
   * Callback when time period changes
   */
  onTimePeriodChange?: (timePeriod: ReportTimePeriod) => void;
  
  /**
   * Callback when dashboard is refreshed
   */
  onRefresh?: () => void;
  
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * Analytics Dashboard component
 */
export function AnalyticsDashboard({
  config,
  data = {},
  isLoading = false,
  onTimePeriodChange,
  onRefresh,
  className = '',
}: AnalyticsDashboardProps): React.ReactElement {
  // State for selected time period
  const [timePeriod, setTimePeriod] = useState('last_30_days');
  
  // State for comparison option
  const [comparison, setComparison] = useState('previous_period');
  
  // State for selected dashboard tab
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // State for custom date range
  const [customDateRange, setCustomDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});
  
  // Handle time period change
  const handleTimePeriodChange = (value: string) => {
    setTimePeriod(value);
    
    if (onTimePeriodChange) {
      // Convert selected time period to ReportTimePeriod
      // This is a simplified implementation
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      
      switch (value) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
          
        case 'yesterday':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
          
        case 'last_7_days':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
          
        case 'last_30_days':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          break;
          
        case 'custom':
          startDate = customDateRange.startDate || new Date();
          endDate = customDateRange.endDate || new Date();
          break;
          
        // Add other cases as needed
      }
      
      // Generate comparison period based on selection
      let comparisonStartDate: Date | undefined;
      let comparisonEndDate: Date | undefined;
      
      if (comparison === 'previous_period') {
        const periodLength = endDate.getTime() - startDate.getTime();
        comparisonStartDate = new Date(startDate.getTime() - periodLength);
        comparisonEndDate = new Date(endDate.getTime() - periodLength);
      } else if (comparison === 'previous_year') {
        comparisonStartDate = new Date(startDate);
        comparisonStartDate.setFullYear(comparisonStartDate.getFullYear() - 1);
        
        comparisonEndDate = new Date(endDate);
        comparisonEndDate.setFullYear(comparisonEndDate.getFullYear() - 1);
      }
      
      onTimePeriodChange({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        comparisonStartDate: comparisonStartDate?.toISOString(),
        comparisonEndDate: comparisonEndDate?.toISOString(),
      });
    }
  };
  
  // Handle custom date range change
  const handleCustomDateRangeChange = (startDate: Date, endDate: Date) => {
    setCustomDateRange({ startDate, endDate });
    
    if (timePeriod === 'custom' && onTimePeriodChange) {
      // Generate comparison period based on selection
      let comparisonStartDate: Date | undefined;
      let comparisonEndDate: Date | undefined;
      
      if (comparison === 'previous_period') {
        const periodLength = endDate.getTime() - startDate.getTime();
        comparisonStartDate = new Date(startDate.getTime() - periodLength);
        comparisonEndDate = new Date(endDate.getTime() - periodLength);
      } else if (comparison === 'previous_year') {
        comparisonStartDate = new Date(startDate);
        comparisonStartDate.setFullYear(comparisonStartDate.getFullYear() - 1);
        
        comparisonEndDate = new Date(endDate);
        comparisonEndDate.setFullYear(comparisonEndDate.getFullYear() - 1);
      }
      
      onTimePeriodChange({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        comparisonStartDate: comparisonStartDate?.toISOString(),
        comparisonEndDate: comparisonEndDate?.toISOString(),
      });
    }
  };
  
  // Handle comparison change
  const handleComparisonChange = (value: string) => {
    setComparison(value);
    
    // Trigger time period change to recalculate comparison dates
    handleTimePeriodChange(timePeriod);
  };
  
  // Generate tabs from dashboard config
  const tabs = Array.from(new Set(['overview', ...config.widgets.map(w => w.id.split('-')[0])]));
  
  return (
    <div className={`analytics-dashboard space-y-4 ${className}`}>
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:space-y-0">
        <h2 className="text-2xl font-bold">{config.name}</h2>
        
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <TimePeriodSelector
            value={timePeriod}
            onChange={handleTimePeriodChange}
            startDate={customDateRange.startDate}
            endDate={customDateRange.endDate}
            onCustomDateChange={handleCustomDateRangeChange}
          />
          
          <Select value={comparison} onValueChange={handleComparisonChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select comparison" />
            </SelectTrigger>
            <SelectContent>
              {COMPARISON_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </div>
      
      {tabs.length > 1 && (
        <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {tabs.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="capitalize">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {tabs.map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {config.widgets
                  .filter(widget => widget.id.startsWith(tab) || (tab === 'overview' && widget.id.includes('overview')))
                  .map(widget => {
                    // Find position info for the widget
                    const positionInfo = config.layout.find(item => item.widgetId === widget.id);
                    
                    // Determine column span based on width (approximate)
                    const colSpan = positionInfo?.position.width === 2 ? 'md:col-span-2' : '';
                    
                    return (
                      <div key={widget.id} className={colSpan}>
                        <Widget
                          id={widget.id}
                          type={widget.type}
                          title={widget.title}
                          subtitle={widget.subtitle}
                          config={widget.config}
                          data={data[widget.id] || {}}
                          isLoading={isLoading}
                          onRefresh={onRefresh}
                        />
                      </div>
                    );
                  })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
      
      {tabs.length === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.widgets.map(widget => {
            // Find position info for the widget
            const positionInfo = config.layout.find(item => item.widgetId === widget.id);
            
            // Determine column span based on width (approximate)
            const colSpan = positionInfo?.position.width === 2 ? 'md:col-span-2' : '';
            
            return (
              <div key={widget.id} className={colSpan}>
                <Widget
                  id={widget.id}
                  type={widget.type}
                  title={widget.title}
                  subtitle={widget.subtitle}
                  config={widget.config}
                  data={data[widget.id] || {}}
                  isLoading={isLoading}
                  onRefresh={onRefresh}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
