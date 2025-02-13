"use client"

import { Navbar } from "../components/Navbar"
import { Footer } from "../components/Footer"
import { Clock } from "lucide-react"

export default function Terms() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar userType="guest" orgName="Shan & Associates" />
      <main className="flex-grow container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Terms & Conditions</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Last Updated Section */}
            <div className="flex items-center space-x-2 text-gray-600 mb-6">
              <Clock className="w-5 h-5" />
              <span>Last updated on 12-02-2025 16:04:28</span>
            </div>

            {/* Introduction */}
            <div className="prose max-w-none">
              <p className="mb-4">
                These Terms and Conditions, along with privacy policy or other terms ("Terms") constitute a binding 
                agreement by and between KUMAR GOUTHAM RAJ, ("Website Owner" or "we" or "us" or "our") 
                and you ("you" or "your") and relate to your use of our website, goods (as applicable) or services (as 
                applicable) (collectively, "Services").
              </p>

              <p className="mb-4">
                By using our website and availing the Services, you agree that you have read and accepted these Terms 
                (including the Privacy Policy). We reserve the right to modify these Terms at any time and without 
                assigning any reason. It is your responsibility to periodically review these Terms to stay informed of 
                updates.
              </p>

              <p className="mb-4">
                The use of this website or availing of our Services is subject to the following terms of use:
              </p>

              {/* Terms List */}
              <ul className="list-disc pl-6 space-y-4">
                <li>
                  To access and use the Services, you agree to provide true, accurate and complete information to us 
                  during and after registration, and you shall be responsible for all acts done through the use of your 
                  registered account.
                </li>
                <li>
                  Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, 
                  performance, completeness or suitability of the information and materials offered on this website 
                  or through the Services, for any specific purpose.
                </li>
                <li>
                  Your use of our Services and the website is solely at your own risk and discretion. You are 
                  required to independently assess and ensure that the Services meet your requirements.
                </li>
                <li>
                  The contents of the Website and the Services are proprietary to Us and you will not have any 
                  authority to claim any intellectual property rights, title, or interest in its contents.
                </li>
                <li>
                  You agree to pay us the charges associated with availing the Services.
                </li>
                <li>
                  You agree not to use the website and/or Services for any purpose that is unlawful, illegal or 
                  forbidden by these Terms, or Indian or local laws that might apply to you.
                </li>
                <li>
                  You understand that upon initiating a transaction for availing the Services you are entering into a 
                  legally binding and enforceable contract with us for the Services.
                </li>
                <li>
                  You shall be entitled to claim a refund of the payment made by you in case we are not able to 
                  provide the Service.
                </li>
              </ul>

              {/* Jurisdiction */}
              <div className="mt-6">
                <p className="font-semibold mb-2">Jurisdiction</p>
                <p>
                  All disputes arising out of or in connection with these Terms shall be subject to the exclusive 
                  jurisdiction of the courts in Redhills, Tamil Nadu.
                </p>
              </div>

              {/* Contact */}
              <div className="mt-6">
                <p>
                  All concerns or communications relating to these Terms must be communicated to us using the 
                  contact information provided on this website.
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