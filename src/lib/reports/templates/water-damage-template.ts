export const waterDamageReportTemplate = {
  title: 'Water Damage Assessment Report',
  sections: [
    {
      id: 'executive-summary',
      title: 'Executive Summary',
      required: true,
      prompts: [
        'Provide brief overview of incident',
        'State primary causation',
        'Summarize key findings',
        'Highlight urgent recommendations'
      ]
    },
    {
      id: 'incident-details',
      title: 'Incident Details',
      required: true,
      fields: [
        { name: 'claimNumber', label: 'Claim Number', type: 'text' },
        { name: 'dateOfLoss', label: 'Date of Loss', type: 'date' },
        { name: 'dateOfInspection', label: 'Date of Inspection', type: 'date' },
        { name: 'propertyAddress', label: 'Property Address', type: 'address' },
        { name: 'propertyType', label: 'Property Type', type: 'select', options: ['Residential', 'Commercial', 'Industrial'] },
        { name: 'occupancyStatus', label: 'Occupancy Status', type: 'select', options: ['Owner Occupied', 'Tenant Occupied', 'Vacant'] }
      ]
    },
    {
      id: 'causation-analysis',
      title: 'Causation Analysis',
      required: true,
      subsections: [
        {
          id: 'primary-cause',
          title: 'Primary Cause',
          citationRequired: true,
          standardsReference: ['IICRC S500 Section 10.5.1']
        },
        {
          id: 'contributing-factors',
          title: 'Contributing Factors',
          multipleEntries: true
        },
        {
          id: 'water-category',
          title: 'Water Category Classification',
          options: [
            { value: 'category-1', label: 'Category 1 - Clean Water', citation: 'IICRC S500 10.5.3.1' },
            { value: 'category-2', label: 'Category 2 - Grey Water', citation: 'IICRC S500 10.5.3.2' },
            { value: 'category-3', label: 'Category 3 - Black Water', citation: 'IICRC S500 10.5.3.3' }
          ]
        }
      ]
    },
    {
      id: 'affected-areas',
      title: 'Affected Areas Assessment',
      required: true,
      areaTemplate: {
        fields: [
          { name: 'location', label: 'Location/Room', type: 'text' },
          { name: 'dimensions', label: 'Dimensions', type: 'measurement' },
          { name: 'affectedMaterials', label: 'Affected Materials', type: 'multiselect' },
          { name: 'moistureReadings', label: 'Moisture Readings', type: 'table' },
          { name: 'damageClass', label: 'Class of Water Damage', type: 'select', 
            options: ['Class 1', 'Class 2', 'Class 3', 'Class 4'],
            citation: 'IICRC S500 10.5.4' }
        ]
      }
    },
    {
      id: 'hvac-assessment',
      title: 'HVAC System Assessment',
      conditional: 'hasHVAC',
      subsections: [
        {
          id: 'system-impact',
          title: 'System Impact Assessment',
          prompts: [
            'Was HVAC system operating during water event?',
            'Evidence of water in ductwork?',
            'Contamination spread potential?'
          ],
          citation: 'IICRC S500 12.2.10'
        },
        {
          id: 'recommendations',
          title: 'HVAC Recommendations',
          standardOptions: [
            'Immediate system shutdown',
            'Seal all supply and return vents',
            'Professional HVAC inspection required',
            'Duct cleaning post-remediation'
          ]
        }
      ]
    },
    {
      id: 'microbial-assessment',
      title: 'Microbial Growth Assessment',
      subsections: [
        {
          id: 'visible-growth',
          title: 'Visible Microbial Growth',
          fields: [
            { name: 'growthPresent', label: 'Growth Present', type: 'boolean' },
            { name: 'affectedArea', label: 'Affected Area (m²)', type: 'number' },
            { name: 'condition', label: 'Condition', type: 'select', 
              options: ['Condition 1', 'Condition 2', 'Condition 3'],
              citation: 'IICRC S520 12.1' }
          ]
        },
        {
          id: 'sampling',
          title: 'Environmental Sampling',
          fields: [
            { name: 'samplesCollected', label: 'Samples Collected', type: 'boolean' },
            { name: 'laboratoryUsed', label: 'Laboratory', type: 'text' },
            { name: 'resultsAttached', label: 'Results Attached', type: 'boolean' }
          ]
        }
      ]
    },
    {
      id: 'contents-assessment',
      title: 'Contents Assessment',
      subsections: [
        {
          id: 'restoration-viability',
          title: 'Restoration Viability Analysis',
          itemTemplate: {
            fields: [
              { name: 'item', label: 'Item Description', type: 'text' },
              { name: 'material', label: 'Material Type', type: 'text' },
              { name: 'sentimentalValue', label: 'Sentimental Value', type: 'select', 
                options: ['High', 'Medium', 'Low', 'None'] },
              { name: 'restorationViable', label: 'Restoration Viable', type: 'boolean' },
              { name: 'restorationMethod', label: 'Restoration Method', type: 'text' },
              { name: 'costBenefit', label: 'Cost vs Replacement', type: 'comparison' }
            ]
          }
        }
      ]
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      required: true,
      subsections: [
        {
          id: 'immediate-actions',
          title: 'Immediate Actions (0-24 hours)',
          priority: 'critical',
          standardRecommendations: [
            'Extract standing water',
            'Establish containment if Category 2/3',
            'Begin controlled demolition of non-restorable materials',
            'Deploy drying equipment',
            'Document all affected areas'
          ]
        },
        {
          id: 'secondary-prevention',
          title: 'Secondary Damage Prevention',
          priority: 'high',
          prompts: [
            'Identify potential for hidden moisture',
            'Assess structural drying requirements',
            'Consider antimicrobial application needs',
            'Evaluate dehumidification requirements'
          ]
        },
        {
          id: 'restoration-plan',
          title: 'Restoration Plan',
          fields: [
            { name: 'dryingProtocol', label: 'Drying Protocol', citation: 'IICRC S500 Chapter 12' },
            { name: 'monitoringFrequency', label: 'Monitoring Frequency', type: 'schedule' },
            { name: 'completionCriteria', label: 'Drying Completion Criteria', type: 'checklist' }
          ]
        }
      ]
    },
    {
      id: 'health-safety',
      title: 'Health & Safety Considerations',
      required: true,
      subsections: [
        {
          id: 'occupant-health',
          title: 'Occupant Health Considerations',
          fields: [
            { name: 'sensitiveOccupants', label: 'Sensitive Occupants', type: 'multiselect',
              options: ['Elderly', 'Children', 'Immunocompromised', 'Respiratory Conditions', 'Allergies'] },
            { name: 'specialPrecautions', label: 'Special Precautions Required', type: 'textarea' }
          ]
        },
        {
          id: 'ppe-requirements',
          title: 'PPE Requirements',
          standardsReference: 'AS/NZS 1715:2009',
          categoryBased: true
        }
      ]
    },
    {
      id: 'limitations',
      title: 'Scope Limitations & Disclaimers',
      required: true,
      standardText: [
        'This assessment is based on visible and accessible areas only',
        'Destructive testing was not performed unless specifically noted',
        'Recommendations assume normal environmental conditions',
        'Additional damage may be discovered during remediation'
      ]
    },
    {
      id: 'references',
      title: 'Standards & References',
      required: true,
      autoPopulate: true,
      sources: [
        'IICRC S500 - Standard for Professional Water Damage Restoration',
        'IICRC S520 - Standard for Professional Mold Remediation',
        'AS/NZS 4849.1:2003 - Indoor Air Quality',
        'Queensland Building Code',
        'Work Health and Safety Act 2011 (Qld)'
      ]
    }
  ],
  calculations: {
    dryingTime: 'basedOnClassAndCategory',
    equipmentRequired: 'basedOnAffectedArea',
    costEstimate: 'basedOnScopeAndMaterials'
  },
  validationRules: {
    requiredPhotos: ['overview', 'causePoint', 'eachAffectedArea', 'moistureReadings'],
    requiredDocuments: ['labResults', 'moistureMaps', 'psychrometricData'],
    citationCheck: true,
    factualAccuracy: true
  }
}