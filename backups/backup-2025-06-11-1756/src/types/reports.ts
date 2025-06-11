export interface DataSource {
  id: string;
  name: string;
  description: string;
}

export interface Dimension {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  dataSourceId: string;
}

export interface Metric {
  id: string;
  name: string;
  type: 'count' | 'sum' | 'avg' | 'min' | 'max';
  field?: string;
  dataSourceId: string;
}

export interface ReportComponent {
  id: string;
  type: 'table' | 'chart' | 'kpi' | 'text';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  data: {
    dimensions: string[];
    metrics: string[];
    filters?: Array<{
      dimension: string;
      operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
      value: string | number;
    }>;
    sort?: Array<{
      field: string;
      direction: 'asc' | 'desc';
    }>;
  };
}

export interface Report {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  dataSourceId: string;
  components: ReportComponent[];
}
