export default function OnboardingLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e]">
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-[#4ecdc4]"></div>
        <p className="mt-4 text-white">Loading your onboarding experience...</p>
      </div>
    </div>
  )
}
