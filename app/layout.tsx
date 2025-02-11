import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import type React from "react" // Import React
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from 'sonner'
import { headers } from 'next/headers'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Shan Associations - Professional Business Services",
  description: "Expert business management and consulting services",
}

// Add cache control headers
export const revalidate = 0

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Force dynamic rendering
  headers()
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Add no-cache meta tags */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        
        {/* Add script to clear cache on load */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              window.onload = function() {
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    names.forEach(function(name) {
                      caches.delete(name);
                    });
                  });
                }
                // Clear local storage
                localStorage.clear();
                // Clear session storage
                sessionStorage.clear();
              }
            }
          `
        }} />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-center" richColors />
          <script 
            src="https://checkout.razorpay.com/v1/checkout.js"
            defer
          />
        </AuthProvider>
      </body>
    </html>
  )
}

