export const buildTasks = [
  // Pages - DeepSeek first, Claude enhance
  {
    id: 'contact-page',
    deepseekPrompt: 'Create contact page with form',
    claudeEnhance: 'Add validation, accessibility, SEO',
    output: 'src/app/contact/page.tsx'
  },
  {
    id: 'about-page',
    deepseekPrompt: 'Create about page for Brisbane consultants',
    claudeEnhance: 'Add animations, optimize performance',
    output: 'src/app/about/page.tsx'
  },
  {
    id: 'consultation-service',
    deepseekPrompt: 'Service page for $550 consultation',
    claudeEnhance: 'Add schema markup, conversion optimization',
    output: 'src/app/services/initial-consultation/page.tsx'
  },
  {
    id: 'software-service',
    deepseekPrompt: 'Software development service page',
    claudeEnhance: 'Add portfolio section, tech stack showcase',
    output: 'src/app/services/software-development/page.tsx'
  }
]
