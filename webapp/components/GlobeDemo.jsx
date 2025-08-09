"use client";
import React, { memo } from "react";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
 
const World = dynamic(() => import("../components/ui/globe").then((m) => m.World), {
  ssr: false,
});
 
export const GlobeDemo = memo(function GlobeDemo() {
  const globeConfig = {
    pointSize: 3,
    globeColor: "#062056",
    showAtmosphere: true,
    atmosphereColor: "#FFFFFF",
    atmosphereAltitude: 0.1,
    emissive: "#062056",
    emissiveIntensity: 0.05,
    shininess: 0.7,
    polygonColor: "rgba(255,255,255,0.4)",
    ambientLight: "#38bdf8",
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
    arcTime: 2000,
    arcLength: 0.6,
    rings: 1,
    maxRings: 2,
    initialPosition: { lat: 22.3193, lng: 114.1694 },
    autoRotate: true,
    autoRotateSpeed: 0.3,
  };
  const colors = ["#06b6d4", "#3b82f6", "#6366f1"];
  const sampleArcs = [
    {
      order: 1,
      startLat: 40.7128,
      startLng: -74.006,
      endLat: 51.5072,
      endLng: -0.1276,
      arcAlt: 0.3,
      color: colors[0],
    },
    {
      order: 1,
      startLat: 28.6139,
      startLng: 77.209,
      endLat: 35.6762,
      endLng: 139.6503,
      arcAlt: 0.2,
      color: colors[1],
    },
    {
      order: 2,
      startLat: -33.8688,
      startLng: 151.2093,
      endLat: 22.3193,
      endLng: 114.1694,
      arcAlt: 0.4,
      color: colors[2],
    },
    {
      order: 2,
      startLat: 34.0522,
      startLng: -118.2437,
      endLat: 48.8566,
      endLng: 2.3522,
      arcAlt: 0.3,
      color: colors[0],
    },
    {
      order: 3,
      startLat: -22.9068,
      startLng: -43.1729,
      endLat: 1.3521,
      endLng: 103.8198,
      arcAlt: 0.5,
      color: colors[1],
    },
    {
      order: 3,
      startLat: 52.52,
      startLng: 13.405,
      endLat: 55.7558,
      endLng: 37.6176,
      arcAlt: 0.2,
      color: colors[2],
    },
    {
      order: 4,
      startLat: -34.6037,
      startLng: -58.3816,
      endLat: 31.2304,
      endLng: 121.4737,
      arcAlt: 0.6,
      color: colors[0],
    },
    {
      order: 4,
      startLat: 25.2048,
      startLng: 55.2708,
      endLat: -26.2041,
      endLng: 28.0473,
      arcAlt: 0.4,
      color: colors[1],
    },
  ];
 
  return (
    <div className="relative w-full">
      <div className="max-w-7xl mx-auto w-full relative h-[50rem] px-4">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 1,
          }}
          className="relative z-50 pt-16 pb-8 text-center"
        >
          <h2 className="text-xl md:text-4xl font-bold text-white mb-4">
            Used by people all over the world
          </h2>
          <p className="text-base md:text-lg font-normal text-gray-400 max-w-md mt-2 mx-auto mb-8">
            Our secure password vault protects users across all continents with cutting-edge blockchain technology.
          </p>
        </motion.div>
        <div className="absolute top-24 left-0 right-0 bottom-0 w-full z-10">
          <World data={sampleArcs} globeConfig={globeConfig} />
        </div>
      </div>
    </div>
  );
});
