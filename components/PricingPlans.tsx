import { Check } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "$0",
    description: "Perfect for exploring and small projects",
    features: ["AI-powered requirements analysis", "Basic prototyping tools", "1 project", "Community support"],
    buttonText: "Start Free",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$49",
    period: "/month",
    description: "Ideal for professionals and growing teams",
    features: [
      "Everything in Starter",
      "Advanced code generation",
      "10 projects",
      "Priority support",
      "Team collaboration",
    ],
    buttonText: "Start 14-Day Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations with advanced needs",
    features: [
      "Everything in Professional",
      "Unlimited projects",
      "Custom integrations",
      "Dedicated support",
      "Advanced security features",
    ],
    buttonText: "Contact Sales",
    highlighted: false,
  },
]

export default function PricingPlans() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="mb-4 text-center text-3xl font-bold text-agi-blue">Pricing Plans</h2>
        <p className="mb-12 text-center text-gray-300 max-w-2xl mx-auto">
          Choose the perfect plan for your needs. All plans include core features with different levels of access and
          support.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-lg p-6 ${plan.highlighted ? "bg-gradient-to-br from-agi-dark-light to-agi-dark border border-agi-blue" : "bg-agi-dark-light"}`}
            >
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-end mb-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-gray-400 ml-1">{plan.period}</span>}
              </div>
              <p className="text-gray-300 text-sm mb-6">{plan.description}</p>

              <ul className="mb-6 space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-agi-green mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2 rounded font-medium ${
                  plan.highlighted
                    ? "bg-agi-green text-agi-dark hover:bg-opacity-90"
                    : "bg-agi-blue hover:bg-opacity-90"
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
