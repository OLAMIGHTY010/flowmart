interface OnboardingStepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
}

const STEP_LABELS: Record<number, string> = {
  1: 'Registration',
  2: 'Email Verification',
  3: 'Profile Setup',
  4: 'KYC Details',
  5: 'Documents',
  6: 'Review',
};

const TOTAL_STEPS = 6;

export default function OnboardingStepIndicator({ currentStep }: OnboardingStepIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-3 w-full max-w-md mx-auto">
      {/* Progress bars */}
      <div className="flex items-center gap-1.5 w-full">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const step = i + 1;
          const isCompleted = step <= currentStep;
          return (
            <div
              key={step}
              className={`flex-1 h-[5px] rounded-full transition-all duration-500 ${
                isCompleted
                  ? 'bg-[#16a34a]'
                  : 'bg-[#e5e7eb]'
              }`}
            />
          );
        })}
      </div>

      {/* Label */}
      <p className="text-xs font-semibold text-[#16a34a] tracking-wide text-center">
        Step {currentStep} of {TOTAL_STEPS} — {STEP_LABELS[currentStep]}
      </p>
    </div>
  );
}
