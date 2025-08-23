import type { LucideIcon } from "lucide-react"
import {
  Briefcase,
  ShieldCheck,
  Search,
  Users,
  CloudCog,
  Code2,
  LightbulbIcon,
  DollarSign,
  LineChart,
  Users2,
  Palette,
  Workflow,
  TrendingUp,
  Database,
  Server,
  Smartphone,
  BarChartHorizontal,
} from "lucide-react"

export interface Technology {
  name: string
  icon?: LucideIcon
  category: string
}

export interface CaseStudy {
  id: string
  client: string
  industry: string
  logoUrl: string
  heroImageUrl?: string
  avatarUrl?: string
  services: {
    name: string
    icon: LucideIcon
  }[]
  challenge: string
  challengeDetails: string[]
  projectGoals: {
    goal: string
    icon?: LucideIcon
  }[]
  solutionIntro: string
  solutionPoints: {
    title: string
    description: string
    icon?: LucideIcon
  }[]
  solutionHighlights?: {
    title: string
    description: string
    imageUrl: string
  }[]
  approach: {
    phase: string
    description: string
    icon?: LucideIcon
  }[]
  collaborationDetails?: string
  technologies: Technology[]
  testimonial: {
    quote: string
    author: string
    role: string
  }
  results: {
    value: string
    label: string
    icon?: LucideIcon
  }[]
  futureOutlook: {
    point: string
    icon?: LucideIcon
  }[]
  overview: string
}

export const caseStudies: CaseStudy[] = [
  {
    id: "techstart-solutions",
    client: "TechStart Solutions",
    industry: "SaaS & Technology",
    logoUrl: "/techstart-solutions-logo.png",
    heroImageUrl: "/modern-saas-dashboard.png",
    avatarUrl: "/jessica-lee-avatar.png",
    services: [
      { name: "Custom Software Development", icon: Code2 },
      { name: "Quality Assurance & Testing", icon: ShieldCheck },
      { name: "Cloud Solutions", icon: CloudCog },
    ],
    challenge: "Legacy SaaS platform struggling with scalability, dated UI, and high customer churn.",
    challengeDetails: [
      "The monolithic architecture was a significant bottleneck, making updates slow and risky. A single bug could bring down the entire system.",
      "User feedback consistently pointed to a confusing and outdated interface, leading to high churn rates and an increasing number of support tickets.",
      "Infrastructure costs were spiraling out of control due to inefficient resource utilization on dedicated servers.",
      "The inability to quickly deploy new features meant falling behind more agile competitors in a fast-paced market.",
    ],
    projectGoals: [
      { goal: "Reduce customer churn by at least 30%.", icon: Users2 },
      { goal: "Improve platform scalability to handle 5x user growth.", icon: TrendingUp },
      { goal: "Modernize UI/UX to enhance user satisfaction.", icon: Palette },
      { goal: "Decrease infrastructure costs by 20%.", icon: DollarSign },
    ],
    solutionIntro:
      "We engineered a complete platform overhaul, migrating to a scalable microservices architecture on AWS, redesigning the UI/UX, and implementing robust CI/CD pipelines.",
    solutionPoints: [
      {
        title: "Microservices Architecture",
        description: "Re-architected the platform using microservices on AWS for enhanced scalability and resilience.",
        icon: CloudCog,
      },
      {
        title: "Intuitive UI/UX Redesign",
        description:
          "Conducted user research to design a modern, intuitive interface, improving task completion rates by 40%.",
        icon: Palette,
      },
      {
        title: "Automated CI/CD & Testing",
        description:
          "Implemented CI/CD with comprehensive automated testing, reducing bug reports by 75% and enabling weekly deployments.",
        icon: ShieldCheck,
      },
      {
        title: "Serverless Optimization",
        description:
          "Migrated key services to serverless, reducing infrastructure costs by 30% and improving auto-scaling capabilities.",
        icon: Code2,
      },
    ],
    solutionHighlights: [
      {
        title: "Modern User Dashboard",
        description: "A completely redesigned, component-based dashboard that is both powerful and easy to navigate.",
        imageUrl: "/solution-highlight-ui-ux.png",
      },
      {
        title: "Scalable Cloud Architecture",
        description:
          "A visual representation of the new microservices architecture, showcasing its scalability and resilience.",
        imageUrl: "/solution-highlight-architecture.png",
      },
      {
        title: "Automated Deployment Pipeline",
        description: "The CI/CD pipeline that increased deployment speed by 4x and improved platform stability.",
        imageUrl: "/solution-highlight-cicd.png",
      },
    ],
    approach: [
      {
        phase: "Discovery & Audit (Weeks 1-2)",
        description:
          "Comprehensive audit of existing platform, codebase, and infrastructure. Stakeholder interviews to define pain points and objectives.",
        icon: Search,
      },
      {
        phase: "Architecture & Design (Weeks 3-5)",
        description:
          "Designed new microservices architecture, UI/UX wireframes and mockups, and defined technology stack. Security and scalability planning.",
        icon: Palette,
      },
      {
        phase: "Development & QA (Weeks 6-16)",
        description:
          "Agile development sprints for backend and frontend. Continuous integration and rigorous QA cycles. Regular client demos and feedback incorporation.",
        icon: Code2,
      },
      {
        phase: "Deployment & Go-Live (Week 17)",
        description:
          "Phased deployment strategy. Data migration. Post-launch monitoring and support. Performance benchmarking.",
        icon: CloudCog,
      },
    ],
    collaborationDetails:
      "Our engagement with TechStart was a true partnership. We embedded our developers with their product team, participating in daily stand-ups and weekly strategy sessions. This close collaboration ensured constant alignment, rapid feedback loops, and a final product that was deeply integrated with their business goals. We used shared Slack channels and a transparent Jira board to maintain open communication at all times.",
    technologies: [
      { name: "React", icon: Code2, category: "Frontend" },
      { name: "Node.js", icon: Server, category: "Backend" },
      { name: "AWS (Lambda, S3, RDS, API Gateway)", icon: CloudCog, category: "Cloud & DevOps" },
      { name: "Docker & Kubernetes", icon: CloudCog, category: "Cloud & DevOps" },
      { name: "PostgreSQL", icon: Database, category: "Database" },
      { name: "Jest & Cypress", icon: ShieldCheck, category: "Testing" },
    ],
    testimonial: {
      quote:
        "Unite Group didn't just build us a new platform; they engineered a new future for our company. Their expertise is unmatched, and the results speak for themselves. Our investors are thrilled, and our team is more productive than ever.",
      author: "Jessica Lee",
      role: "CEO, TechStart Solutions",
    },
    results: [
      { value: "50%", label: "Reduction in Customer Churn", icon: Users2 },
      { value: "4x", label: "Faster Deployment Cycles", icon: CloudCog },
      { value: "3x", label: "Increase in User Engagement", icon: LineChart },
      { value: "A$1.2M", label: "Projected Annual Revenue Uplift", icon: DollarSign },
      { value: "30%", label: "Reduction in Infrastructure Costs", icon: DollarSign },
    ],
    futureOutlook: [
      {
        point: "Positioned for rapid feature expansion and market adaptation due to modular architecture.",
        icon: TrendingUp,
      },
      {
        point: "Enhanced ability to attract and retain enterprise-level clients with SOC 2 compliance.",
        icon: ShieldCheck,
      },
      { point: "Scalable infrastructure ready to support international growth.", icon: CloudCog },
    ],
    overview:
      "Transformed a struggling legacy SaaS platform into a scalable, modern solution, drastically reducing churn and boosting revenue.",
  },
  // --- UrbanBloom Retail ---
  {
    id: "urbanbloom-retail",
    client: "UrbanBloom Retail",
    industry: "E-commerce & Retail",
    logoUrl: "/urbanbloom-retail-logo.png",
    heroImageUrl: "/ecommerce-analytics-dashboard.png",
    avatarUrl: "/david-chen-avatar.png",
    services: [
      { name: "Strategic SEO Services", icon: Search },
      { name: "Business Strategy Consulting", icon: LightbulbIcon },
    ],
    challenge:
      "Online store invisible on search engines, overly reliant on expensive paid ads with diminishing returns.",
    challengeDetails: [
      "Poor organic search visibility for key product categories.",
      "High customer acquisition cost due to paid ad dependency.",
      "Lack of a cohesive content strategy to attract and engage target audience.",
      "Technical SEO issues hindering crawlability and indexing.",
    ],
    projectGoals: [
      { goal: "Increase organic search traffic by 200% within 12 months.", icon: LineChart },
      { goal: "Achieve top 5 rankings for 15 primary keywords.", icon: Search },
      { goal: "Reduce reliance on paid advertising by 50%.", icon: DollarSign },
      { goal: "Improve organic sales conversion rate by 20%.", icon: TrendingUp },
    ],
    solutionIntro:
      "We executed a comprehensive SEO and content strategy, resolving technical issues, building high-quality content, and securing authoritative backlinks to dominate organic search.",
    solutionPoints: [
      {
        title: "Technical SEO Audit & Fixes",
        description:
          "Resolved over 200 critical technical SEO issues, improving site speed (Core Web Vitals), crawlability, and mobile-friendliness.",
        icon: ShieldCheck,
      },
      {
        title: "Data-Driven Content Strategy",
        description:
          "Developed and executed a content plan targeting high-intent keywords, creating 50+ engaging blog posts, buying guides, and optimized product descriptions.",
        icon: Palette,
      },
      {
        title: "Authoritative Link Building",
        description:
          "Secured high-quality backlinks from industry publications, blogs, and influencers, boosting domain authority by 15 points.",
        icon: Search,
      },
      {
        title: "Local SEO Optimization",
        description:
          "Optimized Google My Business for all 5 locations, increasing local search traffic by 70% and direct calls by 40%.",
        icon: Users2,
      },
    ],
    approach: [
      {
        phase: "SEO Audit & Keyword Research (Month 1)",
        description:
          "In-depth technical audit, competitor analysis, and comprehensive keyword research to identify opportunities.",
        icon: Search,
      },
      {
        phase: "On-Page & Technical Optimization (Months 2-3)",
        description:
          "Implementation of technical fixes, on-page optimization (titles, metas, content), and internal linking strategy.",
        icon: Code2,
      },
      {
        phase: "Content Creation & Off-Page SEO (Months 4-9)",
        description:
          "Consistent creation of high-quality, SEO-optimized content. Strategic outreach for link building and brand mentions.",
        icon: Palette,
      },
      {
        phase: "Monitoring, Reporting & Refinement (Ongoing)",
        description:
          "Continuous monitoring of rankings, traffic, and conversions. Monthly reporting and strategy adjustments based on performance data.",
        icon: BarChartHorizontal,
      },
    ],
    technologies: [
      { name: "Google Analytics", icon: BarChartHorizontal, category: "Analytics" },
      { name: "SEMrush / Ahrefs", icon: Search, category: "SEO Tools" },
      { name: "WordPress / Shopify (Assumed CMS)", icon: Smartphone, category: "Platform" },
      { name: "Google Search Console", icon: Search, category: "SEO Tools" },
    ],
    testimonial: {
      quote:
        "The impact of Unite Group's SEO work was transformative. We went from being buried on page 10 to dominating the first page. Our organic revenue has skyrocketed.",
      author: "David Chen",
      role: "Founder, UrbanBloom Retail",
    },
    results: [
      { value: "350%", label: "Increase in Organic Traffic", icon: LineChart },
      { value: "Top 3", label: "Rankings for 25+ Keywords", icon: Search },
      { value: "7:1", label: "ROI from SEO Efforts", icon: DollarSign },
      { value: "60%", label: "Reduction in Ad Spend", icon: DollarSign },
      { value: "45%", label: "Increase in Organic Sales Conversion", icon: LineChart },
    ],
    futureOutlook: [
      {
        point: "Established a sustainable channel for long-term organic growth, reducing marketing volatility.",
        icon: TrendingUp,
      },
      { point: "Strong brand authority and online presence in their niche.", icon: LightbulbIcon },
      { point: "Empowered internal team with SEO knowledge for ongoing success.", icon: Users2 },
    ],
    overview:
      "Catapulted an e-commerce store from search obscurity to first-page dominance, massively increasing organic traffic and sales.",
  },
  // --- Dynamic Logistics ---
  {
    id: "dynamic-logistics",
    client: "Dynamic Logistics",
    industry: "Logistics & Supply Chain",
    logoUrl: "/dynamic-logistics-logo.png",
    heroImageUrl: "/logistics-supply-chain-dashboard.png",
    avatarUrl: "/sarah-mitchell-avatar.png",
    services: [
      { name: "Business Strategy Consulting", icon: Briefcase },
      { name: "Custom Software Development", icon: Code2 },
      { name: "Initial Business Consultation", icon: Users },
    ],
    challenge:
      "Operational bottlenecks from outdated manual processes and disparate systems, leading to errors and delays.",
    challengeDetails: [
      "Lack of real-time visibility across the supply chain.",
      "High error rates in data entry and order processing.",
      "Inefficient route planning leading to increased fuel costs.",
      "Poor client communication due to delayed reporting.",
    ],
    projectGoals: [
      { goal: "Increase overall operational efficiency by 30%.", icon: Workflow },
      { goal: "Reduce data entry errors by 80%.", icon: ShieldCheck },
      { goal: "Provide real-time shipment tracking to all clients.", icon: Smartphone },
      { goal: "Achieve annual operational cost savings of A$300k.", icon: DollarSign },
    ],
    solutionIntro:
      "Through strategic consultation and custom software development, we unified their operations into a real-time management platform, automating key processes and providing end-to-end visibility.",
    solutionPoints: [
      {
        title: "Unified Logistics Platform",
        description:
          "Developed a custom cloud-based platform integrating all operational data (shipping, warehousing, client orders) into a single real-time dashboard.",
        icon: CloudCog,
      },
      {
        title: "Process Automation",
        description:
          "Automated order intake, route optimization (15% fuel cost reduction), and client reporting, saving 200+ man-hours weekly.",
        icon: Code2,
      },
      {
        title: "IoT Shipment Tracking",
        description:
          "Integrated IoT for real-time tracking of high-value shipments, enhancing security and client satisfaction.",
        icon: Smartphone,
      },
      {
        title: "Comprehensive Training & Support",
        description:
          "Ensured smooth adoption across 150+ employees with tailored training programs and ongoing support.",
        icon: Users2,
      },
    ],
    approach: [
      {
        phase: "Initial Consultation & Process Mapping (Weeks 1-3)",
        description:
          "Deep-dive workshops with all departments to map existing processes, identify pain points, and define system requirements.",
        icon: Users,
      },
      {
        phase: "Platform Design & Prototyping (Weeks 4-6)",
        description:
          "Architecting the custom platform, designing database schemas, and creating interactive prototypes for key modules. User feedback sessions.",
        icon: Palette,
      },
      {
        phase: "Agile Development & Integration (Weeks 7-20)",
        description:
          "Iterative development of platform modules. Integration with existing systems (accounting, carrier APIs). Regular QA and UAT.",
        icon: Code2,
      },
      {
        phase: "Rollout, Training & Optimization (Weeks 21-24)",
        description:
          "Phased rollout across departments. Comprehensive user training. Post-launch performance monitoring and system optimization.",
        icon: CloudCog,
      },
    ],
    technologies: [
      { name: "Python (Django)", icon: Code2, category: "Backend" },
      { name: "Vue.js", icon: Code2, category: "Frontend" },
      { name: "Microsoft Azure (VMs, SQL Database, IoT Hub)", icon: CloudCog, category: "Cloud & DevOps" },
      { name: "RabbitMQ", icon: Server, category: "Messaging" },
      { name: "Power BI", icon: BarChartHorizontal, category: "Analytics" },
    ],
    testimonial: {
      quote:
        "Unite Group's strategic approach was a game-changer. They understood our complex business challenges deeply and delivered a solution that has fundamentally improved how we operate.",
      author: "Sarah Mitchell",
      role: "COO, Dynamic Logistics",
    },
    results: [
      { value: "40%", label: "Increase in Operational Efficiency", icon: LineChart },
      { value: "90%", label: "Reduction in Data Entry Errors", icon: ShieldCheck },
      { value: "Real-time", label: "Client Shipment Tracking", icon: CloudCog },
      { value: "A$450k", label: "Annual Operational Cost Savings", icon: DollarSign },
      { value: "25%", label: "Improvement in On-Time Delivery", icon: LineChart },
    ],
    futureOutlook: [
      {
        point: "Scalable platform ready to support company growth and expansion into new service areas.",
        icon: TrendingUp,
      },
      {
        point: "Data-driven insights enabling proactive decision-making and continuous process improvement.",
        icon: LightbulbIcon,
      },
      { point: "Enhanced competitive advantage through superior technology and client service.", icon: ShieldCheck },
    ],
    overview:
      "Revolutionized logistics operations with a custom platform, achieving significant efficiency gains and cost savings.",
  },
  // --- Nova Exports ---
  {
    id: "nova-exports",
    client: "Nova Exports",
    industry: "International Trade & Manufacturing",
    logoUrl: "/nova-exports-logo.png",
    heroImageUrl: "/global-trade-network.png",
    avatarUrl: "/professional-male-headshot.png",
    services: [
      { name: "Business Strategy Consulting", icon: Briefcase },
      { name: "Cloud Solutions", icon: CloudCog },
    ],
    challenge:
      "Struggling to manage complex international supply chains and compliance requirements, hindering growth into new markets.",
    challengeDetails: [
      "Difficulty in tracking shipments across multiple carriers and countries.",
      "Manual compliance documentation leading to delays and potential fines.",
      "Lack of centralized data for strategic decision-making.",
      "Scalability issues with existing IT infrastructure.",
    ],
    projectGoals: [
      { goal: "Improve supply chain visibility by 50%.", icon: Search },
      { goal: "Reduce compliance processing time by 40%.", icon: ShieldCheck },
      { goal: "Enable data-driven expansion into 2 new international markets.", icon: TrendingUp },
      { goal: "Centralize trade data for better analytics.", icon: Database },
    ],
    solutionIntro:
      "We implemented a cloud-based supply chain visibility platform and streamlined compliance processes through strategic automation and data integration.",
    solutionPoints: [
      {
        title: "Cloud Visibility Platform",
        description: "Deployed a scalable cloud platform providing end-to-end visibility of shipments and inventory.",
        icon: CloudCog,
      },
      {
        title: "Automated Compliance Workflows",
        description:
          "Automated generation and tracking of customs and trade documents, reducing processing time by 60%.",
        icon: ShieldCheck,
      },
      {
        title: "Data Analytics & Reporting",
        description:
          "Integrated data sources to provide actionable insights for market expansion and operational improvements.",
        icon: LineChart,
      },
      {
        title: "Supplier Collaboration Portal",
        description: "Developed a portal for seamless communication and document sharing with international suppliers.",
        icon: Users2,
      },
    ],
    approach: [
      {
        phase: "Needs Analysis & Compliance Review (Month 1)",
        description:
          "Detailed review of current trade processes, compliance requirements for target markets, and existing technology landscape.",
        icon: Briefcase,
      },
      {
        phase: "Platform Customization & Integration (Months 2-3)",
        description:
          "Customizing a SaaS trade management platform and integrating it with existing ERP and financial systems.",
        icon: CloudCog,
      },
      {
        phase: "Workflow Automation & Portal Development (Months 4-5)",
        description:
          "Building automated workflows for compliance documentation and developing the supplier collaboration portal.",
        icon: Code2,
      },
      {
        phase: "User Training & System Go-Live (Month 6)",
        description:
          "Training staff on the new platform and processes. Phased go-live and post-implementation support.",
        icon: Users2,
      },
    ],
    technologies: [
      { name: "Salesforce (Custom Cloud App)", icon: CloudCog, category: "Platform" },
      { name: "MuleSoft (Integration)", icon: Server, category: "Integration" },
      { name: "Tableau (Analytics)", icon: BarChartHorizontal, category: "Analytics" },
      { name: "AWS S3 (Document Storage)", icon: Database, category: "Storage" },
    ],
    testimonial: {
      quote:
        "Unite Group helped us navigate the complexities of global trade with an elegant and powerful solution. Our efficiency has soared, and we're now confidently expanding into new territories.",
      author: "Rajesh Kumar",
      role: "Director of Operations, Nova Exports",
    },
    results: [
      { value: "30%", label: "Reduction in Shipment Delays", icon: LineChart },
      { value: "50%", label: "Faster Compliance Processing", icon: ShieldCheck },
      { value: "15%", label: "Growth in New Market Penetration", icon: LineChart },
      { value: "A$200k", label: "Annual Savings from Efficiency", icon: DollarSign },
    ],
    futureOutlook: [
      { point: "Enhanced agility to respond to changing trade regulations and market conditions.", icon: TrendingUp },
      { point: "Improved supplier relationships through better collaboration and transparency.", icon: Users2 },
      { point: "Foundation for leveraging AI in predictive logistics and risk management.", icon: LightbulbIcon },
    ],
    overview:
      "Streamlined international trade operations for an exporter, enhancing visibility, compliance, and market expansion capabilities.",
  },
  // --- HealthPlus Clinics ---
  {
    id: "healthplus-clinics",
    client: "HealthPlus Clinics",
    industry: "Healthcare Services",
    logoUrl: "/healthplus-clinics-logo.png",
    heroImageUrl: "/modern-clinic-interior.png",
    avatarUrl: "/professional-female-doctor-headshot.png",
    services: [
      { name: "Custom Software Development", icon: Code2 },
      { name: "Initial Business Consultation", icon: Users },
      { name: "Quality Assurance & Testing", icon: ShieldCheck },
    ],
    challenge:
      "Managing patient records, appointments, and billing across multiple clinic locations with outdated, non-integrated systems, leading to inefficiencies and potential data privacy risks.",
    challengeDetails: [
      "Fragmented patient data leading to incomplete medical histories.",
      "Manual appointment scheduling causing booking errors and long wait times.",
      "Inefficient billing processes resulting in revenue leakage.",
      "Concerns about HIPAA/HITECH compliance with existing systems.",
    ],
    projectGoals: [
      { goal: "Implement a unified, HIPAA-compliant Electronic Health Record (EHR) system.", icon: ShieldCheck },
      { goal: "Reduce appointment scheduling errors by 90% and no-shows by 15%.", icon: Users2 },
      { goal: "Improve billing cycle time by 20%.", icon: DollarSign },
      { goal: "Enhance patient data security and accessibility for authorized staff.", icon: Database },
    ],
    solutionIntro:
      "Developed a centralized, HIPAA-compliant Clinic Management System (CMS) with modules for patient records (EHR), scheduling, billing, and reporting, accessible across all locations.",
    solutionPoints: [
      {
        title: "Centralized Patient Records (EHR)",
        description:
          "Built a secure EHR module for unified patient data access, improving care coordination and data integrity.",
        icon: Database,
      },
      {
        title: "Automated Appointment Scheduling",
        description:
          "Implemented an online booking system with automated reminders, reducing no-shows by 20% and staff workload.",
        icon: Smartphone,
      },
      {
        title: "Integrated Billing & Claims",
        description:
          "Streamlined billing workflows and automated claims submission, improving revenue cycle by 25% and reducing errors.",
        icon: DollarSign,
      },
      {
        title: "Secure Telehealth Module",
        description:
          "Added a secure, encrypted telehealth feature to expand service accessibility and patient convenience.",
        icon: Code2,
      },
    ],
    approach: [
      {
        phase: "Clinical Workflow Analysis & Compliance Assessment (Weeks 1-4)",
        description:
          "Detailed analysis of clinical workflows, patient journey mapping, and rigorous HIPAA/HITECH compliance assessment. Requirement gathering from medical staff.",
        icon: Briefcase,
      },
      {
        phase: "System Architecture & EHR Design (Weeks 5-8)",
        description:
          "Designing the secure, scalable architecture for the CMS. Detailed design of EHR modules, database schema, and security protocols. UX design for clinical staff.",
        icon: Palette,
      },
      {
        phase: "Iterative Development & Testing (Weeks 9-24)",
        description:
          "Agile development of CMS modules. Rigorous testing including security penetration testing, performance testing, and UAT with clinical staff.",
        icon: Code2,
      },
      {
        phase: "Data Migration, Training & Go-Live (Weeks 25-28)",
        description:
          "Secure migration of existing patient data. Comprehensive training for all staff. Phased rollout across clinics with on-site support.",
        icon: CloudCog,
      },
    ],
    technologies: [
      { name: ".NET Core (C#)", icon: Code2, category: "Backend" },
      { name: "Angular", icon: Code2, category: "Frontend" },
      { name: "Microsoft SQL Server", icon: Database, category: "Database" },
      { name: "Azure Cloud (App Service, SQL Database, Blob Storage)", icon: CloudCog, category: "Cloud & DevOps" },
      { name: "HL7 FHIR (Interoperability Standards)", icon: Server, category: "Healthcare Standards" },
    ],
    testimonial: {
      quote:
        "The custom CMS from Unite Group has revolutionized how we manage our clinics. It's secure, efficient, and our staff love it. Most importantly, it allows us to provide better patient care.",
      author: "Dr. Emily Carter",
      role: "Medical Director, HealthPlus Clinics",
    },
    results: [
      { value: "30%", label: "Reduction in Admin Time", icon: LineChart },
      { value: "20%", label: "Decrease in Patient No-Shows", icon: Users2 },
      { value: "100%", label: "HIPAA Compliance Achieved", icon: ShieldCheck },
      { value: "15%", label: "Increase in Patient Satisfaction", icon: LineChart },
    ],
    futureOutlook: [
      {
        point: "Platform ready for integration with advanced diagnostic tools and patient portals.",
        icon: LightbulbIcon,
      },
      {
        point: "Improved data analytics capabilities for clinical research and operational insights.",
        icon: BarChartHorizontal,
      },
      { point: "Foundation for expanding telehealth services and remote patient monitoring.", icon: Smartphone },
    ],
    overview:
      "Developed a custom, HIPAA-compliant Clinic Management System, streamlining operations and improving patient care for a multi-location healthcare provider.",
  },
]
