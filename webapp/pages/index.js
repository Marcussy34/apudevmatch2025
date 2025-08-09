import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import { Particles } from "../components/Particles";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-xl font-bold text-white">SecureVault</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
          <a href="#security" className="text-gray-300 hover:text-white transition-colors">Security</a>
          <a href="#docs" className="text-gray-300 hover:text-white transition-colors">Docs</a>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-all hover:scale-105">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        {/* White Particles */}
        <Particles
          className="absolute inset-0"
          quantity={150}
          ease={80}
          color="#ffffff"
          refresh
        />

        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Secure Beyond
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Imagination
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Experience the future of password security with SUI blockchain technology, 
            Walrus storage, and AI-powered insights that transform your digital vault into an NFT masterpiece.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105 shadow-lg">
              Start Securing
            </button>
            <button className="border border-gray-400 hover:border-white text-gray-300 hover:text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105">
              View Demo →
            </button>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-16 flex items-center justify-center gap-8 opacity-70">
            <div className="text-sm text-gray-400">Powered by</div>
            <div className="flex items-center gap-6">
              <span className="text-blue-400 font-semibold">SUI</span>
              <span className="text-purple-400 font-semibold">Walrus</span>
              <span className="text-pink-400 font-semibold">Seal</span>
              <span className="text-cyan-400 font-semibold">ROFL</span>
            </div>
          </div>
        </div>
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
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/50 to-purple-900/50 p-8 border border-blue-500/20 hover:border-blue-400/40 transition-all hover:scale-105 float-effect">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Zero-Knowledge Security</h3>
                <p className="text-gray-300 leading-relaxed">
                  Your passwords are encrypted with Walrus and verified through Seal, 
                  ensuring complete privacy with mathematical certainty.
                </p>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-8 border border-purple-500/20 hover:border-purple-400/40 transition-all hover:scale-105 float-effect" style={{animationDelay: '2s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">AI-Powered Insights</h3>
                <p className="text-gray-300 leading-relaxed">
                  Advanced algorithms analyze your password patterns to identify 
                  vulnerabilities and suggest improvements for optimal security.
                </p>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-900/50 to-cyan-900/50 p-8 border border-pink-500/20 hover:border-pink-400/40 transition-all hover:scale-105 float-effect" style={{animationDelay: '4s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">NFT Security Portrait</h3>
                <p className="text-gray-300 leading-relaxed">
                  Mint unique NFTs that visualize your security posture, 
                  creating beautiful art from your digital protection status.
                </p>
              </div>
            </div>
          </div>
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
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="text-xl font-bold text-white">SecureVault</span>
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
            <p className="text-gray-400">© 2025 SecureVault. All rights reserved.</p>
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
