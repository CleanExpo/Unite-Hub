import { Brain, Palette, Laptop, Users } from "lucide-react";

export default function Features() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="mb-12 text-center text-3xl font-bold text-agi-blue">
          Powerful Features
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Feature 1 */}
          <div className="rounded bg-agi-dark-light p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/20">
              <Brain className="h-6 w-6 text-pink-500" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-agi-blue">
              AI-Powered Development
            </h3>
            <p className="text-sm text-gray-300">
              Leverage the power of artificial intelligence to accelerate your
              development process and create innovative software solutions.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded bg-agi-dark-light p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20">
              <Palette className="h-6 w-6 text-orange-500" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-agi-blue">
              Visual Prototyping
            </h3>
            <p className="text-sm text-gray-300">
              Create interactive prototypes in minutes with our intuitive visual
              interface and smart component library.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded bg-agi-dark-light p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/20">
              <Laptop className="h-6 w-6 text-teal-500" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-agi-blue">
              Code Generation
            </h3>
            <p className="text-sm text-gray-300">
              Transform your ideas into production-ready code with our advanced
              code generation capabilities.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded bg-agi-dark-light p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
              <Users className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-agi-blue">
              Collaboration Tools
            </h3>
            <p className="text-sm text-gray-300">
              Work together seamlessly with team members using our real-time
              collaboration features and project management tools.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
