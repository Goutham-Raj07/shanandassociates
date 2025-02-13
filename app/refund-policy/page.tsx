"use client"

import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"

export default function RefundPolicy() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        userType="guest"
        orgName="Shan & Associates"
      />
      <main className="flex-grow container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Refund & Return Policy</h1>
        
        <div className="prose max-w-none">
          <p className="text-lg mb-4">
            At Shan & Associates, we are committed to providing high-quality professional services to our clients. Due to the nature of our services:
          </p>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">No Refund Policy</h2>
            <p>
              Please be informed that we do not offer refunds for any of our professional services, including but not limited to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>Tax Services</li>
              <li>Audit & Assurance Services</li>
              <li>Business Advisory Services</li>
              <li>Consulting Services</li>
              <li>Any other professional services rendered</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Important Notice</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>All services are non-refundable once initiated</li>
              <li>We encourage clients to thoroughly discuss their requirements before engaging our services</li>
              <li>Any concerns regarding our services should be communicated immediately to our team</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 