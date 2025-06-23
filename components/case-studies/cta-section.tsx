import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function CtaSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-r from-cyan-600 to-sky-700 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Write Your Success Story?</h2>
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-sky-100">
          Let's discuss how Unite Group can partner with you to overcome your challenges and achieve your business
          ambitions.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-white text-sky-700 hover:bg-sky-50 font-semibold px-10 py-3 text-lg shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          <Link href="/contact">
            Get In Touch <ArrowRight size={20} className="ml-2" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
