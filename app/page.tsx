"use client"

import { Header } from "./components/Header"
import { Footer } from "./components/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FileText, BarChart2, ShieldCheck, Mail, Phone, MapPin } from "lucide-react"
import { Navbar } from "./components/Navbar"
import { useState, useEffect } from "react"
import { AuthDialog } from "./components/AuthDialog"
import { toast } from "sonner"

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
    subject: '',
    message: ''
  })

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

  // Add type-safe form handler
  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Contact form submission logic
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
        orgName="Shan & Associates"
      />
      <main className="flex-grow">
        {/* Hero Section */}
        <section id="home" className="bg-blue-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">S H A N & ASSOCIATES</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              A chartered accountancy firm led by skilled and experienced young professional chartered accountants founded in 2013. 
              We provide comprehensive financial and consulting services with consistent and practical solutions.
            </p>
            <Button 
              size="lg" 
              onClick={() => handleAuthClick('signup')}
              disabled={!isReady}
            >
              {!isReady ? 'Loading...' : 'Get Started'}
            </Button>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">About Us</h2>
            <div className="max-w-4xl mx-auto space-y-6">
              <p className="text-gray-600">
                The Firm provides Accounting, Audit, Assurance, Taxation and Consultancy Services. Our objective is to work with businesses as an extended arm primarily for managing in a manner that will increase profit, reduce cost and provide total control over the activity with the use of trained resources, well defined processes and mutually agreed productivity measures.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Mission</h3>
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
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Vision</h3>
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

        {/* Services Section */}
        <section id="services" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Tax Services */}
              <Card className="text-center p-6">
                <CardHeader>
                  <CardTitle>Tax Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-gray-600 space-y-2">
                    <li>Income Tax Return Filing</li>
                    <li>GST Registration & Filing</li>
                    <li>Tax Planning & Advisory</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Audit & Assurance */}
              <Card className="text-center p-6">
                <CardHeader>
                  <CardTitle>Audit & Assurance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-gray-600 space-y-2">
                    <li>Statutory Audit</li>
                    <li>Internal Audit</li>
                    <li>Compliance Audit</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Business Advisory */}
              <Card className="text-center p-6">
                <CardHeader>
                  <CardTitle>Business Advisory</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-gray-600 space-y-2">
                    <li>Business Registration</li>
                    <li>Financial Planning</li>
                    <li>Business Consulting</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section id="contact" className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Contact Us</h2>
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

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <Input 
                  type="text" 
                  name="name"
                  value={contactForm.name}
                  onChange={handleContactInput}
                  placeholder="Your Name" 
                  required 
                />
                <Input 
                  type="email" 
                  name="email"
                  value={contactForm.email}
                  onChange={handleContactInput}
                  placeholder="Your Email" 
                  required 
                />
                <Input 
                  type="text" 
                  name="subject"
                  value={contactForm.subject}
                  onChange={handleContactInput}
                  placeholder="Subject" 
                  required 
                />
                <Textarea 
                  name="message"
                  value={contactForm.message}
                  onChange={handleContactInput}
                  placeholder="Message" 
                  rows={4} 
                  required 
                />
                <Button type="submit" className="w-full">
                  Send Message
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
    </div>
  )
}

