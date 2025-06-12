import React, { useState, useEffect } from 'react';
import { useReportBuilder } from '@/context/ReportBuilderContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import GridLayout from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

export default function ReportBuilder() {
  const {
    currentReport,
    createReport,
    saveReport,
    addComponent,
    removeComponent,
    dataSources,
    fetchDataSources
  } = useReportBuilder();

  const [reportName, setReportName] = useState('');
  const [selectedDataSource, setSelectedDataSource] = useState('');
  const [componentType, setComponentType] = useState<'table' | 'chart' | 'kpi'>('table');
  const [componentTitle, setComponentTitle] = useState('');

  useEffect(() => {
    fetchDataSources();
  }, [fetchDataSources]);

  const handleCreateReport = () => {
    if (!reportName) return;
    createReport(reportName);
    setReportName('');
  };

  const handleAddComponent = () => {
    if (!currentReport || !componentTitle) return;
    
    const newComponent = {
      id: `comp_${Date.now()}`,
      type: componentType,
      title: componentTitle,
      position: { x: 0, y: 0, w: 6, h: 4 },
      data: {
        dimensions: [],
        metrics: [],
      }
    };
    
    addComponent(newComponent);
    setComponentTitle('');
  };

  const handleLayoutChange = (layout: Layout[]) => {
    if (!currentReport) return;
    
    const updatedComponents = currentReport.components.map(comp => {
      const newLayout = layout.find(l => l.i === comp.id);
      if (newLayout) {
        return {
          ...comp,
          position: {
            x: newLayout.x,
            y: newLayout.y,
            w: newLayout.w,
            h: newLayout.h
          }
        };
      }
      return comp;
    });
    
    saveReport({
      ...currentReport,
      components: updatedComponents
    });
  };

  return (
    <div className="p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
        </CardHeader>
        <CardContent>
          {!currentReport ? (
            <div className="flex items-center space-x-2">
              <Input 
                Unite Group="New report name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
              <Button onClick={handleCreateReport}>Create Report</Button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{currentReport.name}</h2>
                <div className="flex space-x-2">
                  <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue Unite Group="Select data source" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSources.map(source => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input 
                    Unite Group="Component title"
                    value={componentTitle}
                    onChange={(e) => setComponentTitle(e.target.value)}
                    className="w-48"
                  />
                  
                  <Select value={componentType} onValueChange={(value) => setComponentType(value as 'table' | 'chart' | 'kpi')}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue Unite Group="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">Table</SelectItem>
                      <SelectItem value="chart">Chart</SelectItem>
                      <SelectItem value="kpi">KPI</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button onClick={handleAddComponent}>Add Component</Button>
                </div>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-lg min-h-[500px]">
                <GridLayout
                  className="layout"
                  layout={currentReport.components.map(comp => ({
                    i: comp.id,
                    x: comp.position.x,
                    y: comp.position.y,
                    w: comp.position.w,
                    h: comp.position.h,
                  }))}
                  onLayoutChange={handleLayoutChange}
                  cols={12}
                  rowHeight={30}
                  width={1200}
                >
                  {currentReport.components.map(comp => (
                    <div key={comp.id} className="bg-white border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{comp.title}</h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeComponent(comp.id)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="text-center text-gray-500">
                        {comp.type === 'table' && 'Table Preview'}
                        {comp.type === 'chart' && 'Chart Preview'}
                        {comp.type === 'kpi' && 'KPI Preview'}
                      </div>
                    </div>
                  ))}
                </GridLayout>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
