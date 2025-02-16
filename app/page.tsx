"use client"

import { Header } from "./components/Header"
import { Footer } from "./components/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FileText, BarChart2, ShieldCheck, Mail, Phone, MapPin, Loader2, ChevronRight, Target, Eye, Check, ClipboardCheck, Briefcase, Clock, Users, CheckCircle, HeadphonesIcon, Award, Shield, TrendingUp, Quote, MessageSquare, Send } from "lucide-react"
import { Navbar } from "./components/Navbar"
import { useState, useEffect } from "react"
import { AuthDialog } from "./components/AuthDialog"
import { toast } from "sonner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface AuthState {
  mode: 'signin' | 'signup'
  loading: boolean
  isInitialized: boolean
  isHydrated: boolean
}

// Add interface for contact form
interface ContactFormData {
  name: string
  email: string
  mobile: string
  subject: string
  message: string
}

// Add interface for navbar props
interface NavbarProps {
  userType: 'guest' | 'client' | 'admin'
  orgName: string
}

export default function Home() {
  // Combine loading states into one
  const [pageState, setPageState] = useState({
    isLoading: true,
    isHydrated: false,
    isInitialized: false
  })
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: '',
    email: '',
    mobile: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle initial hydration
  useEffect(() => {
    // Set hydrated immediately
    setPageState(prev => ({ ...prev, isHydrated: true }))
  }, [])

  // Handle initialization after hydration
  useEffect(() => {
    if (!pageState.isHydrated) return

    const initializeApp = async () => {
      try {
        // Any initialization logic here
        await new Promise(resolve => setTimeout(resolve, 100)) // Small delay to ensure DOM is ready
        setPageState(prev => ({ 
          ...prev, 
          isInitialized: true,
          isLoading: false 
        }))
      } catch (error) {
        console.error('Initialization error:', error)
        toast.error('Failed to initialize')
      }
    }

    initializeApp()
  }, [pageState.isHydrated])

  // Combined ready state
  const isReady = pageState.isHydrated && pageState.isInitialized && !pageState.isLoading

  // Button click handler
  const handleAuthClick = (mode: 'signin' | 'signup') => {
    if (!isReady) return
    setAuthMode(mode)
    setShowAuthDialog(true)
  }

  // Update the handleContactSubmit function
  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Format the message to include mobile number at the end
      const formattedMessage = `
Name: ${contactForm.name}
Email: ${contactForm.email}
Subject: ${contactForm.subject}

Message:
${contactForm.message}

-------------------
Contact Number: ${contactForm.mobile}
      `.trim()

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contactForm,
          message: formattedMessage // Send the formatted message
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      // Show success message immediately
      toast.success('Message sent successfully!')
      // Clear the form
      setContactForm({
        name: '',
        email: '',
        mobile: '',
        subject: '',
        message: ''
      })
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add type-safe input handler
  const handleContactInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        userType="guest"
        orgName={
          <div className="flex items-center gap-3">
            <img 
              src="https://images.seeklogo.com/logo-png/13/1/the-institute-of-chartered-accountants-of-india-logo-png_seeklogo-138618.png" 
              alt="ICAI Logo" 
              className="h-10 w-10 object-contain"
            />
            <span className="font-semibold text-lg">Shan & Associates</span>
          </div>
        }
      />
      <main className="flex-grow">
        {/* Enhanced Hero Section */}
        <section id="home" className="relative bg-gradient-to-br from-blue-700 to-blue-900 text-white py-32">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-grid-8" />
          <div className="container mx-auto px-4 relative">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-100">
                S H A N & ASSOCIATES
              </h1>
              <p className="text-xl mb-8 text-gray-200 leading-relaxed">
                A chartered accountancy firm led by skilled and experienced young professional 
                chartered accountants founded in 2013. We provide comprehensive financial and 
                consulting services with consistent and practical solutions.
              </p>
              <Button 
                size="lg" 
                onClick={() => handleAuthClick('signup')}
                disabled={!isReady}
                className="bg-white text-blue-700 hover:bg-gray-100 hover:text-blue-800 transition-all duration-200 shadow-lg"
              >
                {!isReady ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Start Your Financial Journey</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Add this after the Hero Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: "10+", label: "Years Experience", icon: Clock },
                { number: "500+", label: "Happy Clients", icon: Users },
                { number: "1000+", label: "Projects Completed", icon: CheckCircle },
                { number: "24/7", label: "Support Available", icon: HeadphonesIcon }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="h-8 w-8 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</h3>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced About Section */}
        <section id="about" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">About Us</h2>
              <div className="mt-2 h-1 w-20 bg-blue-600 mx-auto rounded-full" />
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-50 p-8 rounded-lg shadow-sm border">
                <p className="text-gray-700 leading-relaxed">
                  The Firm provides Accounting, Audit, Assurance, Taxation and Consultancy Services. 
                  Our objective is to work with businesses as an extended arm primarily for managing 
                  in a manner that will increase profit, reduce cost and provide total control over 
                  the activity with the use of trained resources, well defined processes and mutually 
                  agreed productivity measures.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Add this after the About Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Why Choose Us</h2>
              <div className="mt-2 h-1 w-20 bg-blue-600 mx-auto rounded-full" />
            </div>
            <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Award,
                  title: "Expert Team",
                  description: "Qualified chartered accountants with years of experience"
                },
                {
                  icon: Clock,
                  title: "Timely Delivery",
                  description: "We respect deadlines and deliver on time, every time"
                },
                {
                  icon: Shield,
                  title: "Confidentiality",
                  description: "Your business information is safe with us"
                },
                {
                  icon: TrendingUp,
                  title: "Growth Focus",
                  description: "We help your business grow with strategic financial planning"
                }
              ].map((feature, index) => (
                <div key={index} className="text-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <feature.icon className="h-10 w-10 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Mission & Vision Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardHeader className="border-b bg-gray-50">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Target className="h-5 w-5" />
                    Mission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Our mission is to remain a pre-eminent chartered accounting firm by providing value added professional services on a cost effective basis by adhering to an uncompromising commitment to professionalism, integrity, creativity, competence, and quality of service.
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      <li>Deliver exceptional client service with integrity and professionalism</li>
                      <li>Provide innovative solutions to complex financial challenges</li>
                      <li>Maintain the highest standards of ethical conduct</li>
                      <li>Foster a culture of continuous learning and professional development</li>
                      <li>Build long-term relationships based on trust and mutual respect</li>
                      <li>Contribute to the growth and success of our clients' businesses</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardHeader className="border-b bg-gray-50">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Eye className="h-5 w-5" />
                    Vision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      To be the most respected, independent and premier auditing, tax and business consulting firm by offering excellent service and support to clients across the globe.
                    </p>
                    <h4 className="font-semibold text-gray-800">Our Core Values:</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      <li>Excellence in every aspect of our service delivery</li>
                      <li>Innovation in approaching complex financial challenges</li>
                      <li>Integrity in all our professional relationships</li>
                      <li>Commitment to continuous improvement and learning</li>
                      <li>Client-centric approach in all our endeavors</li>
                    </ul>
                    <p className="text-gray-600">
                      We strive to be recognized as a firm that:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      <li>Sets the standard for professional excellence</li>
                      <li>Attracts and retains the best talent in the industry</li>
                      <li>Consistently delivers innovative financial solutions</li>
                      <li>Maintains the highest ethical standards in the profession</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Enhanced Services Section */}
        <section id="services" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Our Services</h2>
              <div className="mt-2 h-1 w-20 bg-blue-600 mx-auto rounded-full" />
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  title: "Tax Services",
                  icon: FileText,
                  items: ["Income Tax Return Filing", "GST Registration & Filing", "Tax Planning & Advisory"]
                },
                {
                  title: "Audit & Assurance",
                  icon: ClipboardCheck,
                  items: ["Statutory Audit", "Internal Audit", "Compliance Audit"]
                },
                {
                  title: "Business Advisory",
                  icon: Briefcase,
                  items: ["Business Registration", "Financial Planning", "Business Consulting"]
                }
              ].map((service, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <service.icon className="h-5 w-5" />
                      {service.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {service.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-gray-600">
                          <Check className="h-4 w-4 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Add this before the Contact Form Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">What Our Clients Say</h2>
              <div className="mt-2 h-1 w-20 bg-blue-600 mx-auto rounded-full" />
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  name: "Rajesh Kumar",
                  company: "Tech Solutions Ltd",
                  content: "Outstanding service! Their expertise in tax planning saved us significant amounts and helped optimize our business operations.",
                  image: "/testimonials/client1.jpg" // Add placeholder images
                },
                {
                  name: "Priya Sharma",
                  company: "Retail Ventures",
                  content: "Professional, prompt and precise. They handle our auditing needs with exceptional attention to detail.",
                  image: "/testimonials/client2.jpg"
                },
                {
                  name: "Mohammed Ali",
                  company: "Global Exports",
                  content: "Their GST consultation services are top-notch. They've made compliance easy and hassle-free for us.",
                  image: "/testimonials/client3.jpg"
                }
              ].map((testimonial, index) => (
                <Card key={index} className="relative">
                  <CardContent className="pt-12 pb-8">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <div className="rounded-full bg-blue-600 p-1">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={testimonial.image} alt={testimonial.name} />
                          <AvatarFallback>
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <blockquote className="text-gray-600 text-center mb-4">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.company}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Contact Form Section */}
        <section id="contact" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Contact Us</h2>
              <div className="mt-2 h-1 w-20 bg-blue-600 mx-auto rounded-full" />
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div>
                <h3 className="text-xl font-semibold mb-4">Main Office</h3>
                <div className="space-y-4">
                  <p className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                    <span>
                      Plot No-C 10 F, Ground Floor, IIT Colony 4th Street,<br />
                      Narayanapuram, Pallikaranai,<br />
                      Chennai-600100
                    </span>
                  </p>
                  <p className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span>shanassociates2013@gmail.com</span>
                  </p>
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-blue-600 mt-1" />
                    <div className="space-y-1">
                      <p>+91 9940215112</p>
                      <p>+91 9442468305</p>
                      <p>+91 9551262704</p>
                      <p>+91 9171398999</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mt-8 mb-4">Branch Offices</h3>
                <div className="space-y-6">
                  <div>
                    <p className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                      <span>
                        FLAT S-3, A BLOCK, SRIPATHY TOWERS<br />
                        PLOT NO 1,2,3,4, SYCNDICATE BANK COLONY<br />
                        200FT PALLAVARAM-OMR RADIAL ROAD, KOVILAMBAKKAM<br />
                        CHENNAI-6000117<br />
                        +91-9551262704
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                      <span>
                        K.P.S VILLA, D NO. 16/5, S/F NO.97/A1<br />
                        DURAI ABDUL WAHAB STREET, REDHILLS<br />
                        CHENNAI-600052<br />
                        +91-7092798999
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    type="text" 
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactInput}
                    placeholder="Your Name" 
                    required 
                    className="bg-white"
                  />
                  <Input 
                    type="email" 
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactInput}
                    placeholder="Your Email" 
                    required 
                    className="bg-white"
                  />
                </div>
                
                <Input 
                  type="tel" 
                  name="mobile"
                  value={contactForm.mobile || ''}
                  onChange={handleContactInput}
                  placeholder="Mobile Number" 
                  required 
                  className="bg-white"
                />

                <Input 
                  type="text" 
                  name="subject"
                  value={contactForm.subject}
                  onChange={handleContactInput}
                  placeholder="Subject" 
                  required 
                  className="bg-white"
                />

                <Textarea 
                  name="message"
                  value={contactForm.message}
                  onChange={handleContactInput}
                  placeholder="Your Message" 
                  rows={4} 
                  required 
                  className="bg-white resize-none"
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send Message
                    </div>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <AuthDialog 
        open={showAuthDialog}
        onOpenChangeAction={setShowAuthDialog}
        initialMode={authMode}
      />

      {/* Add this right before closing main tag */}
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full"
          onClick={() => handleAuthClick('signup')}
        >
          <MessageSquare className="h-5 w-5 mr-2" />
          Get Started
        </Button>
      </div>
    </div>
  )
}

