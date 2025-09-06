import {cn} from '@/lib/utils';
import {UploadCloud, ScanFace, CheckCircle} from 'lucide-react';

interface Step {
  id: string;
  name: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  {id: 'upload', name: 'Upload ID', icon: UploadCloud},
  {id: 'selfie', name: 'Take Selfie', icon: ScanFace},
  {id: 'verified', name: 'Verified', icon: CheckCircle},
];

interface StepIndicatorProps {
  currentStep: 'upload' | 'selfie' | 'verified';
}

export function StepIndicator({currentStep}: StepIndicatorProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <nav aria-label="Verification progress">
      <ol role="list" className="flex items-center justify-center">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className={cn('relative flex-1', {'flex-none': stepIdx === steps.length - 1})}>
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300',
                  stepIdx <= currentStepIndex ? 'bg-primary' : 'bg-border'
                )}
                aria-hidden="true"
              >
                <step.icon className={cn('h-6 w-6', stepIdx <= currentStepIndex ? 'text-primary-foreground' : 'text-muted-foreground')} />
              </span>
              <div className="flex flex-col text-center sm:ml-4 sm:text-left">
                <span className="text-sm font-medium">{step.name}</span>
              </div>
            </div>

            {stepIdx !== steps.length - 1 ? (
              <div className="absolute inset-0 left-0 top-5 -z-10 hidden w-full items-center sm:flex" aria-hidden="true">
                <div
                  className={cn('h-0.5 w-full bg-border', {
                    'ml-[4.5rem]': stepIdx === 0,
                    'mx-4': stepIdx > 0,
                  })}
                >
                  <div
                    className={cn('h-full bg-primary transition-all duration-300', stepIdx < currentStepIndex ? 'w-full' : 'w-0')}
                  />
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
