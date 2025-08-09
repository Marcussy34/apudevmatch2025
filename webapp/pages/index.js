import Image from "next/image";
import { Inter } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { motion } from "motion/react";
import { Shield, Brain, Palette, Video } from "lucide-react";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalTrigger } from "@/components/ui/animated-modal";
import { useState, useEffect } from "react";
import ParticlesJS from "@/components/ParticlesJS";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: 'swap',
});

const interTight = Inter({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: 'swap',
});

// Define the Bento Grid features
const features = [
  {
    Icon: Shield,
    name: "Zero-Knowledge Security",
    description: "Your passwords are encrypted with Walrus and verified through Seal, ensuring complete privacy with mathematical certainty.",
    href: "#",
    cta: "Learn more",
    className: "col-span-1 md:col-span-1",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-gray-700/30 to-gray-800/40 opacity-60 group-hover:opacity-80 transition-opacity duration-300">
        <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-gray-600/20 animate-pulse"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-gray-500/20 animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-r from-gray-500/10 to-gray-600/10 animate-spin"></div>
      </div>
    ),
  },
  {
    Icon: Brain,
    name: "AI-Powered Insights",
    description: "Advanced algorithms analyze your password patterns to identify vulnerabilities and suggest improvements for optimal security.",
    href: "#",
    cta: "Learn more",
    className: "col-span-1 md:col-span-1",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-gray-700/30 to-gray-800/40 opacity-60 group-hover:opacity-80 transition-opacity duration-300">
        <div className="absolute top-8 left-8 w-3 h-3 bg-gray-400 rounded-full animate-ping"></div>
        <div className="absolute top-12 right-16 w-2 h-2 bg-gray-500 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-16 left-16 w-4 h-4 bg-gray-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-8 right-8 w-6 h-6 border border-gray-400/40 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-20 h-20 border-2 border-gray-400/30 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-2 border-gray-500/30 rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
        </div>
      </div>
    ),
  },
  {
    Icon: Palette,
    name: "NFT Security Portrait", 
    description: "Mint unique NFTs that visualize your security posture, creating beautiful art from your digital protection status.",
    href: "#",
    cta: "Learn more",
    className: "col-span-1 md:col-span-2",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-gray-700/30 to-gray-800/40 opacity-60 group-hover:opacity-80 transition-opacity duration-300">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-full transform rotate-45 animate-pulse"></div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-tl from-gray-600/20 to-gray-500/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-gray-400/30 rounded-lg transform rotate-12 animate-bounce"></div>
          <div className="absolute bottom-1/3 left-1/4 w-12 h-12 border-2 border-gray-500/30 rounded-lg transform -rotate-12 animate-bounce" style={{animationDelay: '0.5s'}}></div>
        </div>
      </div>
    ),
  },
];

export default function Home() {
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [particlesConfig, setParticlesConfig] = useState(null);

  // Load particles configuration
  useEffect(() => {
    const loadParticlesConfig = async () => {
      try {
        const response = await fetch('/particlesjs-config.json');
        const config = await response.json();
        setParticlesConfig(config);
      } catch (error) {
        console.error('Error loading particles config:', error);
      }
    };

    loadParticlesConfig();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px
        setIsScrollingDown(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsScrollingDown(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  return (
    <div className={`${inter.variable} ${interTight.variable} font-sans relative min-h-screen bg-black`}>
      {/* Particles Background */}
      {particlesConfig && (
        <ParticlesJS 
          className="fixed inset-0 z-0"
          config={particlesConfig}
        />
      )}
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex items-center justify-between py-4 px-6 lg:px-8 bg-[#040612]/80 backdrop-blur-sm border-b border-gray-700/60">
        <div className="flex items-center gap-2 ml-4">
          <Image
            src="/logo.png"
            alt="Grand Warden Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <motion.span 
            className="text-xl brand-text text-white overflow-hidden whitespace-nowrap"
            initial={{ width: "auto", opacity: 1 }}
            animate={{ 
              width: isScrollingDown ? "0px" : "auto",
              opacity: isScrollingDown ? 0 : 1
            }}
            transition={{ 
              duration: 0.3, 
              ease: "easeInOut" 
            }}
          >
            Grand Warden
          </motion.span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-white hover:text-gray-200 transition-colors">Features</a>
          <a href="#security" className="text-white hover:text-gray-200 transition-colors">Security</a>
          <a href="#docs" className="text-white hover:text-gray-200 transition-colors">Docs</a>
          <Button size="lg" className="rounded-full">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden z-10">
        <div className="relative flex flex-col gap-4 items-center justify-center px-6 max-w-6xl mx-auto text-center">
          <motion.h1 
            className="text-5xl md:text-7xl heading-modern text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
            >
              Secure with
            </motion.span>
            <br />
            <motion.span 
              className="text-blue-600"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
            >
              Grand Warden
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
          >
            Experience the future of password security with blockchain-powered vault.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
          >
            <Button size="lg" className="rounded-full px-8 py-3 text-lg font-medium transition-all hover:scale-105 shadow-lg min-w-[140px] h-[52px]">
              Get Started
            </Button>
            <Modal>
              <ModalTrigger className="border border-gray-400 hover:border-white text-gray-300 hover:text-white rounded-full px-8 py-3 text-lg font-medium transition-all hover:scale-105 bg-transparent flex justify-center group/modal-btn min-w-[140px] h-[52px]">
                <span className="group-hover/modal-btn:translate-x-40 text-center transition duration-500">
                  View Demo
                </span>
                <div className="-translate-x-40 group-hover/modal-btn:translate-x-0 flex items-center justify-center absolute inset-0 transition duration-500 text-white z-20">
                  <Video className="h-5 w-5" />
                </div>
              </ModalTrigger>
              <ModalBody>
                <ModalContent>
                  <h4 className="text-lg md:text-2xl text-neutral-800 dark:text-neutral-100 font-bold text-center mb-6">
                    Product Demo
                  </h4>
                  <div className="flex items-center justify-center">
                    <div className="w-full max-w-2xl h-64 md:h-80 bg-gradient-to-br from-gray-800/30 to-gray-600/20 border border-gray-700/40 rounded-xl flex items-center justify-center">
                      <Video className="h-10 w-10 text-white/80" />
                    </div>
                  </div>
                </ModalContent>
                <ModalFooter>
                  <span className="text-sm text-gray-500 mr-auto pl-2">Demo preview</span>
                </ModalFooter>
              </ModalBody>
            </Modal>
          </motion.div>
          
          <motion.div 
            className="flex items-center justify-center gap-6 mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
          >
            <span className="text-white text-lg">Built on</span>
            <div className="flex items-center gap-6">
              <Image
                src="/sui_logo.png"
                alt="Sui Logo"
                width={40}
                height={40}
                className="opacity-90 hover:opacity-100 transition-opacity hover:scale-110 transition-transform duration-200"
              />
              <Image
                src="/oasis_logo.png"
                alt="Oasis Logo"
                width={40}
                height={40}
                className="opacity-90 hover:opacity-100 transition-opacity hover:scale-110 transition-transform duration-200"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="security" className="relative pt-32 pb-40 px-6 z-10">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl heading-modern text-white mb-8">
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
                  <h3 className="text-xl heading-bold text-white mb-2">ROFL Integration</h3>
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
                  <h3 className="text-xl heading-bold text-white mb-2">Red Pill Phala Network</h3>
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

      {/* Features Section */}
      <section id="features" className="relative pt-24 pb-44 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl heading-modern text-white mb-6">
              Security as you expect it
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Built with cutting-edge technology.
            </p>
          </div>
          
          <BentoGrid>
            {features.map((feature, idx) => (
              <BentoCard key={idx} {...feature} />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 border-t border-gray-700/60 bg-[#040612] z-10">
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
                <span className="text-xl brand-text text-white">Grand Warden</span>
              </div>
              <p className="text-gray-400">
                The future of password security, powered by blockchain technology.
              </p>
            </div>
            
            <div>
              <h4 className="text-white heading-bold mb-4">Product</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Features</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Security</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Pricing</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white heading-bold mb-4">Developers</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Documentation</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">API Reference</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">GitHub</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white heading-bold mb-4">Community</h4>
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
