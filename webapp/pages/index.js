import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { motion } from "motion/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Define the Bento Grid features
const features = [
  {
    Icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    name: "Zero-Knowledge Security",
    description: "Your passwords are encrypted with Walrus and verified through Seal, ensuring complete privacy with mathematical certainty.",
    href: "#",
    cta: "Learn more",
    className: "col-span-1 md:col-span-1",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-50 group-hover:opacity-75 transition-opacity duration-300">
        <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-blue-500/20 animate-pulse"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-purple-500/20 animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-r from-blue-400/10 to-purple-400/10 animate-spin"></div>
      </div>
    ),
  },
  {
    Icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    name: "AI-Powered Insights",
    description: "Advanced algorithms analyze your password patterns to identify vulnerabilities and suggest improvements for optimal security.",
    href: "#",
    cta: "Learn more",
    className: "col-span-1 md:col-span-2",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 opacity-50 group-hover:opacity-75 transition-opacity duration-300">
        <div className="absolute top-8 left-8 w-3 h-3 bg-purple-400 rounded-full animate-ping"></div>
        <div className="absolute top-12 right-16 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-16 left-16 w-4 h-4 bg-purple-300 rounded-full animate-pulse"></div>
        <div className="absolute bottom-8 right-8 w-6 h-6 border border-pink-400/40 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-20 h-20 border-2 border-purple-400/30 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-2 border-pink-400/30 rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
        </div>
      </div>
    ),
  },
  {
    Icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
      </svg>
    ),
    name: "NFT Security Portrait", 
    description: "Mint unique NFTs that visualize your security posture, creating beautiful art from your digital protection status.",
    href: "#",
    cta: "Learn more",
    className: "col-span-1 md:col-span-3",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 to-cyan-600/20 opacity-50 group-hover:opacity-75 transition-opacity duration-300">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-pink-500/20 to-cyan-500/20 rounded-full transform rotate-45 animate-pulse"></div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-tl from-cyan-500/20 to-pink-500/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-pink-400/30 rounded-lg transform rotate-12 animate-bounce"></div>
          <div className="absolute bottom-1/3 left-1/4 w-12 h-12 border-2 border-cyan-400/30 rounded-lg transform -rotate-12 animate-bounce" style={{animationDelay: '0.5s'}}></div>
        </div>
      </div>
    ),
  },
];

export default function Home() {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Grand Warden Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-xl font-bold text-white">Grand Warden</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
          <a href="#security" className="text-gray-300 hover:text-white transition-colors">Security</a>
          <a href="#docs" className="text-gray-300 hover:text-white transition-colors">Docs</a>
          <Button size="lg" className="rounded-full">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        <motion.div
          initial={{ opacity: 0.0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="relative flex flex-col gap-4 items-center justify-center px-6 max-w-6xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Secure with
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Grand Warden
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Experience the future of password security with Grand Warden's blockchain-powered vault.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105 shadow-lg">
              Start Securing
            </Button>
            <Button variant="outline" size="lg" className="border-gray-400 hover:border-white text-gray-300 hover:text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105">
              View Demo →
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Security as you expect it
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Built with cutting-edge blockchain technology to ensure your passwords 
              are not just stored, but intelligently protected and visualized.
            </p>
          </div>
          
          <BentoGrid>
            {features.map((feature, idx) => (
              <BentoCard key={idx} {...feature} />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* Trust Section */}
      <section id="security" className="py-24 px-6 bg-gradient-to-r from-surface-primary/50 to-surface-secondary/50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Enhanced by cutting-edge technology
          </h2>
          <p className="text-xl text-gray-400 mb-16 max-w-3xl mx-auto">
            Built on the ROFL Network and Red Pill Phala infrastructure for 
            unparalleled security and trust in decentralized computing.
          </p>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-white mb-2">ROFL Integration</h3>
                  <p className="text-gray-400">Runtime OFfchain Logic for secure computation outside the blockchain while maintaining trust.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-white mb-2">Red Pill Phala Network</h3>
                  <p className="text-gray-400">Confidential computing infrastructure ensuring your data remains private even during processing.</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="w-full h-64 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                <div className="text-6xl">🔒</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
          <Image
                  src="/logo.png"
                  alt="Grand Warden Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-xl font-bold text-white">Grand Warden</span>
              </div>
              <p className="text-gray-400">
                The future of password security, powered by blockchain technology.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Features</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Security</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Pricing</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Developers</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Documentation</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">API Reference</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">GitHub</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Community</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Discord</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Twitter</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Blog</a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2025 Grand Warden. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
