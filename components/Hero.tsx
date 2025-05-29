export default function Hero() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-8xl px-4 text-center">
        <h1 className="mb-6 text-5xl font-bold">
          <span className="text-agi-blue">AGI Auto </span>
          <span className="text-agi-green">Builder</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-xl">
          Build intelligent applications faster with AI-powered tools and
          automated development workflows
        </p>
        <div className="flex justify-center gap-4">
          <button className="rounded bg-agi-green px-6 py-2 font-medium text-agi-dark transition-all hover:bg-opacity-90 hover:shadow-lg">
            Get Started
          </button>
          <button className="rounded bg-agi-blue px-6 py-2 font-medium transition-all hover:bg-opacity-90 hover:shadow-lg">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}
