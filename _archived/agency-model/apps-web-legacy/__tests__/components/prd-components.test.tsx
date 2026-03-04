/**
 * Unit tests for PRD components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PRDGeneratorForm } from '@/components/prd-generator-form';
import { PRDGenerationProgress } from '@/components/prd-generation-progress';

describe('PRDGeneratorForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form fields', () => {
    render(<PRDGeneratorForm onSubmit={mockOnSubmit} isGenerating={false} />);

    expect(screen.getByLabelText(/Project Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Users/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Timeline/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Team Size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Existing Stack/i)).toBeInTheDocument();
  });

  it('should disable submit button when requirements are too short', () => {
    render(<PRDGeneratorForm onSubmit={mockOnSubmit} isGenerating={false} />);

    const submitButton = screen.getByRole('button', { name: /Generate PRD/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when requirements are valid', () => {
    render(<PRDGeneratorForm onSubmit={mockOnSubmit} isGenerating={false} />);

    const textarea = screen.getByLabelText(/Project Description/i);
    fireEvent.change(textarea, {
      target: {
        value:
          'Build a comprehensive task management app for remote teams with real-time collaboration',
      },
    });

    const submitButton = screen.getByRole('button', { name: /Generate PRD/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('should call onSubmit with correct data', () => {
    render(<PRDGeneratorForm onSubmit={mockOnSubmit} isGenerating={false} />);

    // Fill in form
    const requirements = 'Build a task management app with Kanban boards for remote teams';
    fireEvent.change(screen.getByLabelText(/Project Description/i), {
      target: { value: requirements },
    });

    fireEvent.change(screen.getByLabelText(/Target Users/i), {
      target: { value: 'Remote teams' },
    });

    fireEvent.change(screen.getByLabelText(/Timeline/i), {
      target: { value: '3 months' },
    });

    fireEvent.change(screen.getByLabelText(/Team Size/i), {
      target: { value: '2' },
    });

    fireEvent.change(screen.getByLabelText(/Existing Stack/i), {
      target: { value: 'Next.js, FastAPI' },
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Generate PRD/i });
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      requirements,
      context: {
        target_users: 'Remote teams',
        timeline: '3 months',
        team_size: 2,
        existing_stack: 'Next.js, FastAPI',
      },
    });
  });

  it('should disable all inputs when generating', () => {
    render(<PRDGeneratorForm onSubmit={mockOnSubmit} isGenerating={true} />);

    expect(screen.getByLabelText(/Project Description/i)).toBeDisabled();
    expect(screen.getByLabelText(/Target Users/i)).toBeDisabled();
    expect(screen.getByLabelText(/Timeline/i)).toBeDisabled();
    expect(screen.getByLabelText(/Team Size/i)).toBeDisabled();
    expect(screen.getByLabelText(/Existing Stack/i)).toBeDisabled();
  });

  it('should show generating state in submit button', () => {
    render(<PRDGeneratorForm onSubmit={mockOnSubmit} isGenerating={true} />);

    expect(screen.getByText(/Generating PRD/i)).toBeInTheDocument();
  });

  it('should show character count', () => {
    render(<PRDGeneratorForm onSubmit={mockOnSubmit} isGenerating={false} />);

    const textarea = screen.getByLabelText(/Project Description/i);
    fireEvent.change(textarea, {
      target: { value: 'Test requirements text' },
    });

    expect(screen.getByText(/22 \/ 50 characters minimum/i)).toBeInTheDocument();
  });

  it('should only submit if requirements >= 50 characters', () => {
    render(<PRDGeneratorForm onSubmit={mockOnSubmit} isGenerating={false} />);

    const textarea = screen.getByLabelText(/Project Description/i);

    // Too short
    fireEvent.change(textarea, { target: { value: 'Short' } });
    let submitButton = screen.getByRole('button', { name: /Generate PRD/i });
    expect(submitButton).toBeDisabled();

    // Just right
    fireEvent.change(textarea, {
      target: { value: 'A'.repeat(50) },
    });
    submitButton = screen.getByRole('button', { name: /Generate PRD/i });
    expect(submitButton).not.toBeDisabled();
  });
});

describe('PRDGenerationProgress', () => {
  it('should render progress bar with correct percentage', () => {
    render(<PRDGenerationProgress progress={50} currentStep="Analyzing requirements" />);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should display current step', () => {
    const currentStep = 'Generating technical specification';
    render(<PRDGenerationProgress progress={60} currentStep={currentStep} />);

    // Text appears in both current step box and phase list, so use getAllByText
    const elements = screen.getAllByText(currentStep);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should show completed phases with checkmarks', () => {
    const { container } = render(
      <PRDGenerationProgress progress={60} currentStep="Creating test plan" />
    );

    // First 3 phases should be completed (0-60%) - CheckCircle2 icons have text-green-500 class
    const checkmarks = container.querySelectorAll('.text-green-500');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('should show current phase with spinner', () => {
    const { container } = render(
      <PRDGenerationProgress progress={60} currentStep="Creating test plan" />
    );

    // Should have loading spinner (Loader2 with animate-spin class)
    const spinners = container.querySelectorAll('.animate-spin');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it('should show pending phases without decoration', () => {
    render(<PRDGenerationProgress progress={20} currentStep="Analyzing requirements" />);

    // Later phases should not have checkmarks
    const text = screen.getByText(/Planning implementation roadmap/i);
    expect(text).toHaveClass('text-muted-foreground');
  });

  it('should render all 5 generation phases', () => {
    render(<PRDGenerationProgress progress={0} currentStep={null} />);

    expect(screen.getByText(/Analyzing requirements/i)).toBeInTheDocument();
    expect(screen.getByText(/Decomposing features into user stories/i)).toBeInTheDocument();
    expect(screen.getByText(/Generating technical specification/i)).toBeInTheDocument();
    expect(screen.getByText(/Creating test plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Planning implementation roadmap/i)).toBeInTheDocument();
  });

  it('should show estimated time', () => {
    render(<PRDGenerationProgress progress={50} currentStep="Test" />);

    expect(screen.getByText(/Estimated time: 1-2 minutes/i)).toBeInTheDocument();
  });

  it('should handle null current step', () => {
    render(<PRDGenerationProgress progress={0} currentStep={null} />);

    // Should still render without error
    expect(screen.getByText(/Overall Progress/i)).toBeInTheDocument();
  });

  it('should show 100% progress when complete', () => {
    render(<PRDGenerationProgress progress={100} currentStep="Complete" />);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
