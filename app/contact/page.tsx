import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Phone, MapPin, Clock } from "lucide-react"
import { ContactForm } from "@/components/contact-form"

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">Contact Us</h1>
              <p className="text-xl text-[#4ecdc4]/90 mb-6">We'd love to hear from you. Get in touch with our team.</p>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Get In Touch</h2>
                <p className="text-gray-300 mb-8">
                  Have a question, need a quote, or want to discuss how we can help your business? Fill out the form
                  below, and one of our team members will get back to you as soon as possible.
                </p>

                <ContactForm />
              </div>

              <div className="space-y-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Contact Information</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-[#002a42] to-[#00395d] border-[#4ecdc4]/30">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="bg-[#4ecdc4]/10 p-3 rounded-full">
                          <Mail className="h-6 w-6 text-[#4ecdc4]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">Email Us</h3>
                          <p className="text-gray-300">info@unitegroup.com</p>
                          <p className="text-gray-300">support@unitegroup.com</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-[#002a42] to-[#00395d] border-[#4ecdc4]/30">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="bg-[#4ecdc4]/10 p-3 rounded-full">
                          <Phone className="h-6 w-6 text-[#4ecdc4]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">Call Us</h3>
                          <p className="text-gray-300">+1 (555) 123-4567</p>
                          <p className="text-gray-300">+1 (555) 987-6543</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-[#002a42] to-[#00395d] border-[#4ecdc4]/30">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="bg-[#4ecdc4]/10 p-3 rounded-full">
                          <MapPin className="h-6 w-6 text-[#4ecdc4]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">Visit Us</h3>
                          <p className="text-gray-300">123 Business Avenue</p>
                          <p className="text-gray-300">Suite 456</p>
                          <p className="text-gray-300">New York, NY 10001</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-[#002a42] to-[#00395d] border-[#4ecdc4]/30">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="bg-[#4ecdc4]/10 p-3 rounded-full">
                          <Clock className="h-6 w-6 text-[#4ecdc4]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">Business Hours</h3>
                          <p className="text-gray-300">Monday - Friday: 9am - 5pm</p>
                          <p className="text-gray-300">Saturday: 10am - 2pm</p>
                          <p className="text-gray-300">Sunday: Closed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-bold text-white mb-4">Connect With Us</h3>
                  <p className="text-gray-300 mb-6">
                    Follow us on social media to stay updated with our latest news, events, and insights.
                  </p>
                  <div className="flex space-x-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                      <span className="sr-only">Facebook</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                      </svg>
                      <span className="sr-only">Twitter</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                      </svg>
                      <span className="sr-only">Instagram</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                        <rect width="4" height="12" x="2" y="9"></rect>
                        <circle cx="4" cy="4" r="2"></circle>
                      </svg>
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Find Us</h2>
              <p className="text-gray-300">
                Visit our office to meet our team and discuss your business needs in person.
              </p>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden border border-[#4ecdc4]/30">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9663095343008!2d-74.0059418!3d40.7127847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM40zMDc2JzQ2LjAiTiA3NMKwMjUnMzcuNCJX!5e0!3m2!1sen!2sus!4v1621436761410!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                title="UNITE Group Office Location"
              ></iframe>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
