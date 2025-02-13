"use client"

import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar 
        userType="guest"
        orgName="Shan & Associates"
      />
      <main className="flex-grow container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        {/* Add your privacy policy content here */}
      </main>
      <Footer />
    </div>
  )
} 