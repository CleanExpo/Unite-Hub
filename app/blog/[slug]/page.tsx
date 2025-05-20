import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight, Calendar, Clock } from "lucide-react"
import { SocialShare } from "@/components/social-share"
import type { Metadata } from "next"

// Sample blog posts data
const blogPosts = [
  {
    id: "water-damage-restoration-tips",
    title: "Essential Water Damage Restoration Tips for Property Owners",
    excerpt:
      "Learn the critical first steps to take after water damage occurs and how professional restoration can save your property.",
    coverImage: "/blog/water-damage-restoration.png",
    category: "Restoration",
    author: "Sarah Johnson",
    authorRole: "Restoration Specialist",
    authorImage: "/team-member-1.png",
    date: "May 15, 2023",
    readTime: "8 min read",
    content: `
    <p>Water damage is one of the most common and potentially destructive problems that property owners face. Whether caused by a burst pipe, flooding, or a leaking roof, water damage can quickly lead to serious structural issues and mould growth if not addressed promptly and properly.</p>
    
    <h2>Immediate Steps After Water Damage</h2>
    
    <p>When water damage occurs, time is of the essence. Here are the critical first steps every property owner should take:</p>
    
    <ol>
      <li><strong>Ensure Safety First:</strong> Before entering a water-damaged area, make sure to turn off electricity to prevent electrical hazards. If the water level is high or you're unsure about safety, wait for professional help.</li>
      <li><strong>Stop the Water Source:</strong> If possible, identify and stop the source of water. This might involve turning off the main water supply, patching a roof leak, or blocking water entry points during flooding.</li>
      <li><strong>Document the Damage:</strong> Take photos and videos of all affected areas before beginning cleanup. This documentation is crucial for insurance claims.</li>
      <li><strong>Remove Standing Water:</strong> Use pumps, wet vacuums, or even buckets to remove as much standing water as possible. The longer water sits, the more damage it causes.</li>
      <li><strong>Begin Drying Process:</strong> Open windows, use fans, and dehumidifiers to start drying out the space. Air circulation is key to preventing mould growth.</li>
    </ol>
    
    <h2>Professional Restoration vs. DIY</h2>
    
    <p>While minor water incidents might be manageable on your own, significant water damage requires professional restoration services. Here's why:</p>
    
    <ul>
      <li><strong>Hidden Damage Assessment:</strong> Professionals use specialised equipment like moisture metres and thermal imaging cameras to detect water in hidden areas that might not be visible to the naked eye.</li>
      <li><strong>Proper Drying Techniques:</strong> Restoration experts have industrial-grade equipment that can dry spaces much more efficiently than consumer-grade tools.</li>
      <li><strong>Mould Prevention:</strong> Professional restoration includes antimicrobial treatments to prevent mould growth, which can begin within 24-48 hours after water exposure.</li>
      <li><strong>Structural Repairs:</strong> Water can compromise drywall, flooring, and even structural elements. Professionals can assess and address these issues properly.</li>
    </ul>
    
    <h2>The Professional Restoration Process</h2>
    
    <p>When you hire a professional restoration company, they typically follow these steps:</p>
    
    <ol>
      <li><strong>Assessment:</strong> Thorough inspection to determine the extent of water damage and develop a restoration plan.</li>
      <li><strong>Water Extraction:</strong> Removal of standing water using professional-grade pumps and vacuums.</li>
      <li><strong>Drying and Dehumidification:</strong> Using industrial air movers and dehumidifiers to thoroughly dry affected areas.</li>
      <li><strong>Cleaning and Sanitising:</strong> Cleaning all affected items and surfaces, and applying antimicrobial treatments.</li>
      <li><strong>Restoration:</strong> Repairing or replacing damaged materials such as drywall, insulation, flooring, etc.</li>
    </ol>
    
    <h2>Insurance Considerations</h2>
    
    <p>Water damage claims can be complex. Here are some tips for navigating the insurance process:</p>
    
    <ul>
      <li>Contact your insurance company immediately after discovering water damage.</li>
      <li>Document everything thoroughly with photos, videos, and detailed notes.</li>
      <li>Keep all receipts for emergency repairs and temporary accommodations if necessary.</li>
      <li>Consider hiring a public adjuster for significant claims to ensure fair settlement.</li>
      <li>Understand what your policy covers—many standard policies don't cover flood damage.</li>
    </ul>
    
    <h2>Preventing Future Water Damage</h2>
    
    <p>After experiencing water damage, take these preventive measures:</p>
    
    <ul>
      <li>Inspect and maintain your roof regularly, especially after severe weather.</li>
      <li>Check and maintain plumbing systems, including visible pipes and connections.</li>
      <li>Install water detection devices near water heaters, washing machines, and other potential leak sources.</li>
      <li>Ensure proper drainage around your property's foundation.</li>
      <li>Consider installing backflow prevention devices if you live in a flood-prone area.</li>
    </ul>
    
    <h2>Conclusion</h2>
    
    <p>Water damage restoration is a race against time. Quick action can significantly reduce the extent of damage and prevent secondary issues like mould growth. While DIY efforts can help in the immediate aftermath, professional restoration services provide the expertise, equipment, and thoroughness needed to properly restore your property and prevent future problems.</p>
    
    <p>Remember, the goal isn't just to dry out your property, but to restore it to a safe, healthy condition while preventing long-term issues that could affect both the structure and your health.</p>
  `,
    tags: ["Water Damage", "Property Restoration", "Flood Recovery", "Mould Prevention"],
    relatedPosts: ["mould-prevention-strategies", "insurance-claims-process", "restoration-technology-trends"],
  },
  {
    id: "mould-prevention-strategies",
    title: "Effective Mould Prevention Strategies for Humid Climates",
    excerpt:
      "Discover practical techniques to prevent mould growth in high-humidity environments and protect your property's value.",
    coverImage: "/blog/mould-prevention.png",
    category: "Prevention",
    author: "Michael Chen",
    authorRole: "Environmental Specialist",
    authorImage: "/team-member-2.png",
    date: "April 28, 2023",
    readTime: "6 min read",
    content: `
    <p>In humid climates, mould prevention is an ongoing challenge for property owners. High moisture levels create ideal conditions for mould growth, which can damage your property and potentially cause health issues for occupants. This article explores effective strategies to prevent mould growth in humid environments.</p>
    
    <h2>Understanding Mould Growth Factors</h2>
    
    <p>Mould requires three main elements to grow:</p>
    
    <ul>
      <li><strong>Moisture:</strong> The primary factor that enables mould growth</li>
      <li><strong>Food source:</strong> Organic materials like wood, drywall, carpet, and dust</li>
      <li><strong>Optimal temperature:</strong> Most moulds thrive between 60-80°F (15-27°C)</li>
    </ul>
    
    <p>In humid climates, controlling moisture becomes the key factor since the other elements are typically present in any building.</p>
    
    <h2>Effective Humidity Control</h2>
    
    <p>Maintaining indoor humidity levels between 30-50% is crucial for preventing mould growth. Here's how to achieve this:</p>
    
    <h3>Use Dehumidifiers Strategically</h3>
    
    <p>Dehumidifiers are essential tools in humid climates. Consider these tips:</p>
    
    <ul>
      <li>Place dehumidifiers in naturally damp areas like basements, crawl spaces, and bathrooms</li>
      <li>Choose the right size dehumidifier for your space (capacity is measured in pints of water removed per 24 hours)</li>
      <li>Empty and clean dehumidifiers regularly to prevent them from becoming mould sources themselves</li>
      <li>Consider whole-house dehumidifiers that connect to your HVAC system for comprehensive coverage</li>
    </ul>
    
    <h3>Optimise Your HVAC System</h3>
    
    <p>Your heating, ventilation, and air conditioning system plays a crucial role in humidity control:</p>
    
    <ul>
      <li>Ensure proper sizing of air conditioning units (oversized units cool quickly but don't run long enough to dehumidify effectively)</li>
      <li>Maintain clean air filters to ensure efficient operation</li>
      <li>Consider HVAC systems with built-in dehumidification features</li>
      <li>Schedule regular professional maintenance to ensure optimal performance</li>
    </ul>
    
    <h2>Improving Ventilation</h2>
    
    <p>Proper ventilation helps remove excess moisture and prevent condensation:</p>
    
    <ul>
      <li>Install and use exhaust fans in bathrooms, kitchens, and laundry rooms</li>
      <li>Ensure fans vent to the outside, not into attics or crawl spaces</li>
      <li>Use ceiling fans to improve air circulation</li>
      <li>Consider energy recovery ventilators (ERVs) that exchange indoor humidity with drier outdoor air while maintaining energy efficiency</li>
    </ul>
    
    <h2>Addressing Common Moisture Sources</h2>
    
    <h3>Plumbing and Water Intrusion</h3>
    
    <ul>
      <li>Regularly inspect for and repair plumbing leaks</li>
      <li>Ensure proper drainage around your foundation (gutters, downspouts, grading)</li>
      <li>Seal foundation cracks and other potential water entry points</li>
      <li>Consider waterproofing basements and crawl spaces</li>
    </ul>
    
    <h3>Everyday Activities</h3>
    
    <p>Many daily activities generate significant moisture:</p>
    
    <ul>
      <li>Cover pots when cooking to reduce steam</li>
      <li>Vent clothes dryers to the outside</li>
      <li>Avoid hanging wet clothes indoors to dry</li>
      <li>Take shorter, cooler showers and use bathroom exhaust fans</li>
      <li>Wipe down shower walls and doors after use</li>
    </ul>
    
    <h2>Mould-Resistant Building Materials</h2>
    
    <p>When renovating or building in humid climates, consider these materials:</p>
    
    <ul>
      <li>Mould-resistant drywall (paperless or treated with antimicrobial additives)</li>
      <li>Moisture-resistant flooring options like tile, luxury vinyl, or treated hardwood</li>
      <li>Mould-inhibiting paints and primers</li>
      <li>Closed-cell spray foam insulation that acts as a moisture barrier</li>
      <li>Composite decking materials for outdoor spaces</li>
    </ul>
    
    <h2>Regular Inspection and Maintenance</h2>
    
    <p>Preventive maintenance is key to mould prevention:</p>
    
    <ul>
      <li>Conduct regular inspections of potential problem areas (basements, attics, bathrooms)</li>
      <li>Check window seals and weatherstripping</li>
      <li>Inspect roof condition and attic ventilation</li>
      <li>Clean gutters and ensure proper drainage</li>
      <li>Monitor indoor humidity levels with hygrometers</li>
    </ul>
    
    <h2>Conclusion</h2>
    
    <p>Preventing mould in humid climates requires a multi-faceted approach focused primarily on moisture control. By implementing these strategies, property owners can significantly reduce the risk of mould growth, protect their investment, and maintain a healthier indoor environment.</p>
    
    <p>Remember that consistency is key—mould prevention is an ongoing process rather than a one-time effort. Regular monitoring, maintenance, and prompt addressing of any moisture issues will help keep your property mould-free even in the most challenging humid environments.</p>
  `,
    tags: ["Mould Prevention", "Humidity Control", "Indoor Air Quality", "Property Maintenance"],
    relatedPosts: ["water-damage-restoration-tips", "commercial-property-restoration", "restoration-technology-trends"],
  },
]

// Function to get post by slug
function getPostBySlug(slug: string) {
  return blogPosts.find((post) => post.id === slug)
}

// Function to get related posts
function getRelatedPosts(relatedSlugs: string[]) {
  return blogPosts.filter((post) => relatedSlugs.includes(post.id))
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getPostBySlug(params.slug)

  // Get the site URL from environment variable
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unitegroup.com.au"

  if (!post) {
    return {
      title: "Post Not Found | UNITE Group Blog",
      description: "The article you're looking for doesn't exist or has been moved.",
    }
  }

  return {
    title: `${post.title} | UNITE Group Blog`,
    description: post.excerpt,
    openGraph: {
      type: "article",
      url: `${siteUrl}/blog/${params.slug}`,
      title: post.title,
      description: post.excerpt,
      images: [
        {
          url: `${siteUrl}${post.coverImage}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [`${siteUrl}${post.coverImage}`],
    },
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">Post Not Found</h1>
            <p className="text-xl text-[#4ecdc4]/90 mb-6">
              The article you're looking for doesn't exist or has been moved.
            </p>
            <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">
              <Link href="/blog">Back to Blog</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const relatedPosts = post.relatedPosts ? getRelatedPosts(post.relatedPosts) : []

  // Get the current URL for sharing
  const currentUrl = `/blog/${params.slug}`

  return (
    <div className="flex flex-col min-h-screen">
      {/* Floating Social Share (visible on desktop) */}
      <div className="hidden lg:block">
        <SocialShare url={currentUrl} title={post.title} description={post.excerpt} variant="vertical" />
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <span className="inline-block bg-[#4ecdc4]/20 px-4 py-2 rounded-full text-[#4ecdc4] font-medium">
                  {post.category}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-6 mb-8">
                <div className="flex items-center">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3">
                    <Image
                      src={post.authorImage || "/placeholder.svg"}
                      alt={post.author}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{post.author}</p>
                    <p className="text-gray-400 text-xs">{post.authorRole}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-400 text-sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{post.date}</span>
                </div>
                <div className="flex items-center text-gray-400 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Image */}
        <section className="py-8 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="relative h-[300px] md:h-[500px] rounded-lg overflow-hidden">
              <Image src={post.coverImage || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <article className="prose prose-invert prose-lg max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </article>

                {/* Tags */}
                <div className="mt-12 pt-8 border-t border-[#4ecdc4]/20">
                  <h3 className="text-white font-medium mb-4">Tags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="bg-[#002a42] text-gray-300 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Share - Mobile & Tablet */}
                <div className="mt-8 pt-8 border-t border-[#4ecdc4]/20 lg:hidden">
                  <h3 className="text-white font-medium mb-4">Share this article:</h3>
                  <SocialShare
                    url={currentUrl}
                    title={post.title}
                    description={post.excerpt}
                    className="justify-center sm:justify-start"
                  />
                </div>

                {/* Author Bio */}
                <div className="mt-12 bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                  <div className="flex items-start space-x-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden">
                      <Image
                        src={post.authorImage || "/placeholder.svg"}
                        alt={post.author}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{post.author}</h3>
                      <p className="text-[#4ecdc4] mb-2">{post.authorRole}</p>
                      <p className="text-gray-300 text-sm">
                        An experienced professional with extensive knowledge in property restoration and environmental
                        remediation. Dedicated to sharing practical insights and helping property owners protect their
                        investments.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                {/* Related Posts */}
                <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 mb-8">
                  <h3 className="text-white font-bold text-lg mb-4">Related Articles</h3>
                  <div className="space-y-6">
                    {relatedPosts.map((relatedPost) => (
                      <div key={relatedPost.id} className="flex items-start space-x-4">
                        <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={relatedPost.coverImage || "/placeholder.svg"}
                            alt={relatedPost.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm line-clamp-2 mb-1">
                            <Link href={`/blog/${relatedPost.id}`} className="hover:text-[#4ecdc4] transition-colors">
                              {relatedPost.title}
                            </Link>
                          </h4>
                          <p className="text-gray-400 text-xs">{relatedPost.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Share - Desktop */}
                <div className="hidden lg:block bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 mb-8">
                  <h3 className="text-white font-bold text-lg mb-4">Share This Article</h3>
                  <SocialShare
                    url={currentUrl}
                    title={post.title}
                    description={post.excerpt}
                    className="justify-start"
                  />
                </div>

                {/* Categories */}
                <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 mb-8">
                  <h3 className="text-white font-bold text-lg mb-4">Categories</h3>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        href="/blog?category=restoration"
                        className="text-gray-300 hover:text-[#4ecdc4] transition-colors flex items-center justify-between"
                      >
                        <span>Restoration</span>
                        <span className="bg-[#001428] text-gray-400 text-xs px-2 py-1 rounded-full">8</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/blog?category=prevention"
                        className="text-gray-300 hover:text-[#4ecdc4] transition-colors flex items-center justify-between"
                      >
                        <span>Prevention</span>
                        <span className="bg-[#001428] text-gray-400 text-xs px-2 py-1 rounded-full">5</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/blog?category=technology"
                        className="text-gray-300 hover:text-[#4ecdc4] transition-colors flex items-center justify-between"
                      >
                        <span>Technology</span>
                        <span className="bg-[#001428] text-gray-400 text-xs px-2 py-1 rounded-full">4</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/blog?category=commercial"
                        className="text-gray-300 hover:text-[#4ecdc4] transition-colors flex items-center justify-between"
                      >
                        <span>Commercial</span>
                        <span className="bg-[#001428] text-gray-400 text-xs px-2 py-1 rounded-full">3</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/blog?category=insurance"
                        className="text-gray-300 hover:text-[#4ecdc4] transition-colors flex items-center justify-between"
                      >
                        <span>Insurance</span>
                        <span className="bg-[#001428] text-gray-400 text-xs px-2 py-1 rounded-full">2</span>
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Newsletter */}
                <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                  <h3 className="text-white font-bold text-lg mb-4">Subscribe to Our Newsletter</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Stay updated with our latest articles and industry insights.
                  </p>
                  <form className="space-y-4">
                    <input
                      type="email"
                      placeholder="Your email address"
                      className="w-full px-4 py-2 rounded-md bg-[#001428] border border-[#4ecdc4]/30 text-white focus:outline-none focus:border-[#4ecdc4]"
                      required
                    />
                    <Button className="w-full bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">
                      Subscribe
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="bg-gradient-to-r from-[#4ecdc4]/20 to-[#4ecdc4]/10 rounded-lg p-8 md:p-12 border border-[#4ecdc4]/30">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Need Professional Restoration Services?
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Our team of experts is ready to help with all your property restoration needs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                    Contact Us
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10" size="lg">
                    Our Services
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
