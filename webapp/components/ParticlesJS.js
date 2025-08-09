"use client";

import { useEffect, useRef } from 'react';

// Note: particles.js doesn't have proper ES modules, so we'll load it dynamically
const ParticlesJS = ({ className = "", config = null }) => {
  const containerRef = useRef(null);
  const particlesLoadedRef = useRef(false);

  useEffect(() => {
    const loadParticles = async () => {
      if (typeof window !== 'undefined' && !particlesLoadedRef.current) {
        try {
          // Dynamically import particles.js
          await import('particles.js');
          
          if (window.particlesJS && containerRef.current) {
            // Default config or use provided config
            const particlesConfig = config || {
              "particles": {
                "number": {
                  "value": 80,
                  "density": {
                    "enable": true,
                    "value_area": 800
                  }
                },
                "color": {
                  "value": "#ffffff"
                },
                "shape": {
                  "type": "circle",
                  "stroke": {
                    "width": 0,
                    "color": "#000000"
                  },
                  "polygon": {
                    "nb_sides": 5
                  },
                  "image": {
                    "src": "img/github.svg",
                    "width": 100,
                    "height": 100
                  }
                },
                "opacity": {
                  "value": 0.5,
                  "random": false,
                  "anim": {
                    "enable": false,
                    "speed": 1,
                    "opacity_min": 0.1,
                    "sync": false
                  }
                },
                "size": {
                  "value": 3,
                  "random": true,
                  "anim": {
                    "enable": false,
                    "speed": 40,
                    "size_min": 0.1,
                    "sync": false
                  }
                },
                "line_linked": {
                  "enable": true,
                  "distance": 150,
                  "color": "#ffffff",
                  "opacity": 0.4,
                  "width": 1
                },
                "move": {
                  "enable": true,
                  "speed": 6,
                  "direction": "none",
                  "random": false,
                  "straight": false,
                  "out_mode": "out",
                  "bounce": false,
                  "attract": {
                    "enable": false,
                    "rotateX": 600,
                    "rotateY": 1200
                  }
                }
              },
              "interactivity": {
                "detect_on": "canvas",
                "events": {
                  "onhover": {
                    "enable": true,
                    "mode": "repulse"
                  },
                  "onclick": {
                    "enable": true,
                    "mode": "push"
                  },
                  "resize": true
                },
                "modes": {
                  "grab": {
                    "distance": 400,
                    "line_linked": {
                      "opacity": 1
                    }
                  },
                  "bubble": {
                    "distance": 400,
                    "size": 40,
                    "duration": 2,
                    "opacity": 8,
                    "speed": 3
                  },
                  "repulse": {
                    "distance": 200,
                    "duration": 0.4
                  },
                  "push": {
                    "particles_nb": 4
                  },
                  "remove": {
                    "particles_nb": 2
                  }
                }
              },
              "retina_detect": true
            };

            // Initialize particles.js
            window.particlesJS('particles-js', particlesConfig);
            
            // Set canvas background if specified in config
            setTimeout(() => {
              const canvas = containerRef.current?.querySelector('canvas');
              if (canvas && particlesConfig.background?.color?.value) {
                canvas.style.backgroundColor = particlesConfig.background.color.value;
              }
            }, 100);
            
            particlesLoadedRef.current = true;
          }
        } catch (error) {
          console.error('Error loading particles.js:', error);
        }
      }
    };

    loadParticles();

    // Cleanup function
    return () => {
      if (window.pJSDom && window.pJSDom[0] && window.pJSDom[0].pJS) {
        window.pJSDom[0].pJS.fn.vendors.destroypJS();
        window.pJSDom = [];
        particlesLoadedRef.current = false;
      }
    };
  }, [config]);

  return (
    <div 
      id="particles-js" 
      ref={containerRef}
      className={`pointer-events-none ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        backgroundColor: 'transparent'
      }}
    />
  );
};

export default ParticlesJS;
