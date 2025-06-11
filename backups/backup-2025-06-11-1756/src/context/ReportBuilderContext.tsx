import React, { createContext, useContext, useState, useCallback } from 'react';
import { Report, ReportComponent, DataSource, Dimension, Metric } from '@/types/reports';

interface ReportBuilderContextType {
  currentReport: Report | null;
  reports: Report[];
  dataSources: DataSource[];
  dimensions: Dimension[];
  metrics: Metric[];
  createReport: (name: string) => void;
  saveReport: (report: Report) => void;
  addComponent: (component: ReportComponent) => void;
  updateComponent: (id: string, updates: Partial<ReportComponent>) => void;
  removeComponent: (id: string) => void;
  fetchDataSources: () => Promise<void>;
}

const ReportBuilderContext = createContext<ReportBuilderContextType>({
  currentReport: null,
  reports: [],
  dataSources: [],
  dimensions: [],
  metrics: [],
  createReport: () => {},
  saveReport: () => {},
  addComponent: () => {},
  updateComponent: () => {},
  removeComponent: () => {},
  fetchDataSources: () => Promise.resolve(),
});

export const ReportBuilderProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);

  const createReport = useCallback((name: string) => {
    const newReport: Report = {
      id: `report_${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      components: [],
      dataSourceId: '',
    };
    setCurrentReport(newReport);
    setReports(prev => [...prev, newReport]);
  }, []);

  const saveReport = useCallback((report: Report) => {
    setReports(prev => 
      prev.map(r => r.id === report.id ? {...report, updatedAt: new Date().toISOString()} : r)
    );
    setCurrentReport(report);
  }, []);

  const addComponent = useCallback((component: ReportComponent) => {
    if (!currentReport) return;
    const updatedReport = {
      ...currentReport,
      components: [...currentReport.components, component],
      updatedAt: new Date().toISOString()
    };
    setCurrentReport(updatedReport);
    saveReport(updatedReport);
  }, [currentReport, saveReport]);

  const updateComponent = useCallback((id: string, updates: Partial<ReportComponent>) => {
    if (!currentReport) return;
    const updatedReport = {
      ...currentReport,
      components: currentReport.components.map(comp => 
        comp.id === id ? {...comp, ...updates} : comp
      ),
      updatedAt: new Date().toISOString()
    };
    setCurrentReport(updatedReport);
    saveReport(updatedReport);
  }, [currentReport, saveReport]);

  const removeComponent = useCallback((id: string) => {
    if (!currentReport) return;
    const updatedReport = {
      ...currentReport,
      components: currentReport.components.filter(comp => comp.id !== id),
      updatedAt: new Date().toISOString()
    };
    setCurrentReport(updatedReport);
    saveReport(updatedReport);
  }, [currentReport, saveReport]);

  const fetchDataSources = useCallback(async () => {
    // This will be implemented once we have the API route
// Replaced mock data with API call
await fetch('/api/data-sources')
  .then(response => response.json())
  .then(data => setDataSources(data))
  .catch(error => console.error('Failed to fetch data sources:', error));
  }, []);

  return (
    <ReportBuilderContext.Provider value={{
      currentReport,
      reports,
      dataSources,
      dimensions,
      metrics,
      createReport,
      saveReport,
      addComponent,
      updateComponent,
      removeComponent,
      fetchDataSources,
    }}>
      {children}
    </ReportBuilderContext.Provider>
  );
};

export const useReportBuilder = () => useContext(ReportBuilderContext);
