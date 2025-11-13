# Email Sequences Components

React components for building and managing email sequences in Unite-Hub.

## Components

### SequenceList
Main list view showing all email sequences with metrics and actions.

```tsx
import { SequenceList } from "@/components/sequences";

<SequenceList
  sequences={sequences}
  onSelect={(id) => navigate(`/sequences/${id}`)}
  onStatusChange={(id, status) => updateStatus(id, status)}
  onDuplicate={(id) => duplicateSequence(id)}
  onDelete={(id) => deleteSequence(id)}
  onAnalyze={(id) => showAnalytics(id)}
/>
```

### SequenceBuilder
Visual builder for creating and editing sequences.

```tsx
import { SequenceBuilder } from "@/components/sequences";

<SequenceBuilder
  sequence={currentSequence}
  steps={sequenceSteps}
  onSave={(data) => saveSequence(data)}
  onAddStep={() => addNewStep()}
  onUpdateStep={(stepId, data) => updateStep(stepId, data)}
  onRegenerateStep={(stepId) => regenerateWithAI(stepId)}
  onDeleteStep={(stepId) => removeStep(stepId)}
  isEditing={true}
/>
```

### EmailStepCard
Individual email step with inline editing.

```tsx
import { EmailStepCard } from "@/components/sequences";

<EmailStepCard
  step={step}
  stepNumber={1}
  onUpdate={(data) => updateStep(data)}
  onRegenerate={() => regenerateStep()}
  onDelete={() => deleteStep()}
/>
```

### EmailPreview
Desktop and mobile email preview.

```tsx
import { EmailPreview } from "@/components/sequences";

<EmailPreview
  step={currentStep}
  senderName="John Doe"
  senderEmail="john@company.com"
/>
```

### SequenceTimeline
Visual timeline view of sequence flow.

```tsx
import { SequenceTimeline } from "@/components/sequences";

<SequenceTimeline
  steps={steps}
  onSelectStep={(stepId) => openStepEditor(stepId)}
/>
```

### SequenceStats
Analytics and performance metrics.

```tsx
import { SequenceStats } from "@/components/sequences";

<SequenceStats
  sequence={sequence}
  stepMetrics={stepPerformance}
  recommendations={aiRecommendations}
/>
```

### SubjectLineTester
A/B testing tool for subject lines.

```tsx
import { SubjectLineTester } from "@/components/sequences";

<SubjectLineTester
  currentSubject="Quick question about {company}"
  onGenerate={() => generateVariations()}
  onSelect={(variation) => useSubjectLine(variation)}
/>
```

## Usage Example

Full implementation example:

```tsx
"use client";

import React, { useState } from "react";
import {
  SequenceList,
  SequenceBuilder,
  SequenceStats,
} from "@/components/sequences";

export default function SequencesPage() {
  const [view, setView] = useState<"list" | "builder" | "analytics">("list");
  const [selectedSequence, setSelectedSequence] = useState<string | null>(null);

  return (
    <div>
      {view === "list" && (
        <SequenceList
          sequences={sequences}
          onSelect={(id) => {
            setSelectedSequence(id);
            setView("builder");
          }}
          onStatusChange={handleStatusChange}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onAnalyze={(id) => {
            setSelectedSequence(id);
            setView("analytics");
          }}
        />
      )}

      {view === "builder" && selectedSequence && (
        <SequenceBuilder
          sequence={getSequence(selectedSequence)}
          steps={getSteps(selectedSequence)}
          onSave={handleSave}
          onAddStep={handleAddStep}
          onUpdateStep={handleUpdateStep}
          onRegenerateStep={handleRegenerateStep}
          onDeleteStep={handleDeleteStep}
        />
      )}

      {view === "analytics" && selectedSequence && (
        <SequenceStats
          sequence={getSequence(selectedSequence)}
          stepMetrics={getStepMetrics(selectedSequence)}
          recommendations={getRecommendations(selectedSequence)}
        />
      )}
    </div>
  );
}
```

## Features

- AI-powered sequence generation
- Visual timeline builder
- Real-time email preview
- Step-by-step analytics
- A/B subject line testing
- Personalization tags
- Performance recommendations

## Dependencies

- React 18+
- Tailwind CSS
- Shadcn UI components
- Lucide React icons

## Notes

All components are fully typed with TypeScript and follow React best practices. They integrate seamlessly with the Convex backend.
