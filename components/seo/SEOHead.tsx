import { JsonLd } from './JsonLd';

interface SEOHeadProps {
  structuredData?: Record<string, any> | Record<string, any>[];
  children?: React.ReactNode;
}

export function SEOHead({ structuredData, children }: SEOHeadProps) {
  const structuredDataArray = Array.isArray(structuredData) 
    ? structuredData 
    : structuredData 
    ? [structuredData] 
    : [];

  return (
    <>
      {structuredDataArray.map((data, index) => (
        <JsonLd key={index} data={data} />
      ))}
      {children}
    </>
  );
}