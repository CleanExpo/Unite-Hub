import { Send } from "lucide-react";

export default function Newsletter() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-lg bg-gradient-to-r from-agi-dark-light to-agi-dark p-8 text-center border border-agi-border">
          <h2 className="mb-4 text-2xl font-bold text-agi-blue">
            Stay Updated
          </h2>
          <p className="mb-6 text-gray-300 max-w-lg mx-auto">
            Subscribe to our newsletter for the latest updates, tips, and
            insights on AI-powered development.
          </p>

          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-grow rounded bg-agi-dark border border-agi-border px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-agi-blue"
              required
            />
            <button
              type="submit"
              className="rounded bg-agi-blue px-6 py-2 font-medium hover:bg-opacity-90 flex items-center justify-center"
            >
              Subscribe
              <Send className="ml-2 h-4 w-4" />
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-400">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
}
