interface OnboardingProgressProps {
  progress: number
}

export function OnboardingProgress({ progress }: OnboardingProgressProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1 text-xs text-gray-300">
        <span>Getting Started</span>
        <span>{progress}% Complete</span>
      </div>
      <div className="w-full h-2 bg-[#001428] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#4ecdc4] to-[#4ecdc4]/80 transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  )
}
