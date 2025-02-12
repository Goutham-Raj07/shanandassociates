"use client"

import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"

export default function Privacy() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar userType="guest" orgName="Shan & Associates" />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose max-w-none">
          <h2 className="text-xl font-semibold mt-6 mb-4">1. Information We Collect</h2>
          <p>We collect information that you provide directly to us, including:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>Name and contact information</li>
            <li>Business details</li>
            <li>Financial information</li>
            <li>Documents and records</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc ml-6 mb-4">
            <li>Provide our services</li>
            <li>Communicate with you</li>
            <li>Improve our services</li>
            <li>Comply with legal obligations</li>
          </ul>

          {/* Add more sections as needed */}
        </div>
      </main>
      <Footer />
    </div>
  )
} 