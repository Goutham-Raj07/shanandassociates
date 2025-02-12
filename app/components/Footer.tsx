import Link from "next/link"
import { Facebook, Twitter, LinkedinIcon as LinkedIn, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Shan Associations</h3>
            <p className="text-sm text-gray-600">
              Professional business services for all your organizational needs.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-gray-600 hover:text-blue-600">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-blue-600">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-sm text-gray-600 hover:text-blue-600">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-blue-600">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="hover:text-blue-400">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-400">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-blue-600">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600">
                <LinkedIn size={20} />
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600">
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">&copy; 2024 Shan Associations. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

