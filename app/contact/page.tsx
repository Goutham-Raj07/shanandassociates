"use client"

import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { Mail, Phone, MapPin, Clock } from "lucide-react"

export default function Contact() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar userType="guest" orgName="Shan & Associates" />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Last updated on</p>
                <p>12-02-2025 16:03:49</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Merchant Legal entity name</p>
                <p className="font-semibold">KUMAR GOUTHAM RAJ</p>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Registered & Operational Address:</p>
                  <p className="mt-1">
                    NO 150 B, LAKSHMI AMMAN STREET<br />
                    THIRUMALAI VASA NAGAR,<br />
                    NEAR KUMARAN HOSPITAL<br />
                    REDHILLS BYPASS SERVICE ROAD,<br />
                    Redhills, Tamil Nadu,<br />
                    PIN: 600052
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Telephone No</p>
                <p className="hover:text-blue-600">
                  <a href="tel:+919445662399">+91 94456 62399</a>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <p className="text-sm text-gray-500">E-Mail ID</p>
                <p className="hover:text-blue-600">
                  <a href="mailto:iamgouthamraj2005@gmail.com">
                    iamgouthamraj2005@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 