"use client";
import React, { useEffect, useRef, useState, memo } from "react";
import { Color, Scene, Fog, PerspectiveCamera, Vector3 } from "three";
import ThreeGlobe from "three-globe";
import { useThree, Canvas, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import countries from "@/data/globe.json";

extend({ ThreeGlobe: ThreeGlobe });

const RING_PROPAGATION_SPEED = 3;
const cameraZ = 300;

let numbersOfRings = [0];

const Globe = memo(function Globe({ globeConfig, data }) {
  const globeRef = useRef(null);
  const groupRef = useRef();
  const [isInitialized, setIsInitialized] = useState(false);

  const defaultProps = {
    pointSize: 2,
    atmosphereColor: "#ffffff",
    showAtmosphere: true,
    atmosphereAltitude: 0.1,
    polygonColor: "rgba(255,255,255,0.3)",
    globeColor: "#1d072e",
    emissive: "#000000",
    emissiveIntensity: 0.05,
    shininess: 0.7,
    arcTime: 3000,
    arcLength: 0.7,
    rings: 1,
    maxRings: 2,
    ...globeConfig,
  };

  // Initialize globe only once with delay for performance
  useEffect(() => {
    if (!globeRef.current && groupRef.current) {
      // Use requestIdleCallback for better performance
      const initGlobe = () => {
        globeRef.current = new ThreeGlobe();
        groupRef.current.add(globeRef.current);
        setIsInitialized(true);
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(initGlobe);
      } else {
        setTimeout(initGlobe, 0);
      }
    }
  }, []);

  // Build material when globe is initialized or when relevant props change
  useEffect(() => {
    if (!globeRef.current || !isInitialized) return;

    const globeMaterial = globeRef.current.globeMaterial();
    globeMaterial.color = new Color(globeConfig.globeColor);
    globeMaterial.emissive = new Color(globeConfig.emissive);
    globeMaterial.emissiveIntensity = globeConfig.emissiveIntensity || 0.1;
    globeMaterial.shininess = globeConfig.shininess || 0.9;
  }, [
    isInitialized,
    globeConfig.globeColor,
    globeConfig.emissive,
    globeConfig.emissiveIntensity,
    globeConfig.shininess,
  ]);

  // Build data when globe is initialized or when data changes
  useEffect(() => {
    if (!globeRef.current || !isInitialized || !data) return;

    // Use requestIdleCallback to prevent blocking main thread
    const buildGlobeData = () => {
      const arcs = data;
      let points = [];
      for (let i = 0; i < arcs.length; i++) {
        const arc = arcs[i];
        points.push({
          size: defaultProps.pointSize,
          order: arc.order,
          color: arc.color,
          lat: arc.startLat,
          lng: arc.startLng,
        });
        points.push({
          size: defaultProps.pointSize,
          order: arc.order,
          color: arc.color,
          lat: arc.endLat,
          lng: arc.endLng,
        });
      }

      // remove duplicates for same lat and lng
      const filteredPoints = points.filter(
        (v, i, a) =>
          a.findIndex((v2) =>
            ["lat", "lng"].every(
              (k) => v2[k] === v[k],
            ),
          ) === i,
      );

      // Load countries data progressively - start with minimal set
      globeRef.current
        .hexPolygonsData(countries.features.slice(0, 20)) // Load only first 20 countries for fastest initial render
        .hexPolygonResolution(1) // Lower resolution initially
        .hexPolygonMargin(0.9)
        .showAtmosphere(defaultProps.showAtmosphere)
        .atmosphereColor(defaultProps.atmosphereColor)
        .atmosphereAltitude(defaultProps.atmosphereAltitude)
        .hexPolygonColor(() => defaultProps.polygonColor);

      globeRef.current
        .arcsData(data)
        .arcStartLat((d) => d.startLat * 1)
        .arcStartLng((d) => d.startLng * 1)
        .arcEndLat((d) => d.endLat * 1)
        .arcEndLng((d) => d.endLng * 1)
        .arcColor((e) => e.color)
        .arcAltitude((e) => e.arcAlt * 1)
        .arcStroke(() => 0.3) // Fixed stroke for performance
        .arcDashLength(defaultProps.arcLength)
        .arcDashInitialGap((e) => e.order * 1)
        .arcDashGap(15)
        .arcDashAnimateTime(() => defaultProps.arcTime);

      globeRef.current
        .pointsData(filteredPoints)
        .pointColor((e) => e.color)
        .pointsMerge(true)
        .pointAltitude(0.0)
        .pointRadius(2);

      globeRef.current
        .ringsData([])
        .ringColor(() => defaultProps.polygonColor)
        .ringMaxRadius(defaultProps.maxRings)
        .ringPropagationSpeed(RING_PROPAGATION_SPEED)
        .ringRepeatPeriod(
          (defaultProps.arcTime * defaultProps.arcLength) / defaultProps.rings,
        );

      // Progressive loading of more countries
      setTimeout(() => {
        if (globeRef.current) {
          globeRef.current
            .hexPolygonsData(countries.features.slice(0, 100))
            .hexPolygonResolution(2); // Increase resolution
        }
      }, 1000);

      // Load all countries with full resolution
      setTimeout(() => {
        if (globeRef.current) {
          globeRef.current
            .hexPolygonsData(countries.features)
            .hexPolygonResolution(2)
            .hexPolygonMargin(0.8);
        }
      }, 3000);
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(buildGlobeData);
    } else {
      setTimeout(buildGlobeData, 100);
    }
  }, [
    isInitialized,
    data,
    defaultProps.pointSize,
    defaultProps.showAtmosphere,
    defaultProps.atmosphereColor,
    defaultProps.atmosphereAltitude,
    defaultProps.polygonColor,
    defaultProps.arcLength,
    defaultProps.arcTime,
    defaultProps.rings,
    defaultProps.maxRings,
  ]);

  // Handle rings animation with cleanup - delayed start
  useEffect(() => {
    if (!globeRef.current || !isInitialized || !data) return;

    // Delay rings animation to prevent initial freeze
    const startRings = setTimeout(() => {
      const interval = setInterval(() => {
        if (!globeRef.current) return;

        const newNumbersOfRings = genRandomNumbers(
          0,
          data.length,
          Math.floor((data.length * 1) / 5), // Reduced ring count
        );

        const ringsData = data
          .filter((d, i) => newNumbersOfRings.includes(i))
          .map((d) => ({
            lat: d.startLat,
            lng: d.startLng,
            color: d.color,
          }));

        globeRef.current.ringsData(ringsData);
      }, 6000); // Increased interval

      return () => {
        clearInterval(interval);
      };
    }, 3000); // Wait 3 seconds before starting rings

    return () => {
      clearTimeout(startRings);
    };
  }, [isInitialized, data]);

  return <group ref={groupRef} />;
});

export { Globe };

export function WebGLRendererConfig() {
  const { gl, size } = useThree();

  useEffect(() => {
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    gl.setSize(size.width, size.height);
    gl.setClearColor(0x000000, 0); // Completely transparent background
    gl.autoClear = false;
    gl.clear();
    
    // Performance optimizations
    gl.shadowMap.enabled = false;
    gl.antialias = false;
    gl.powerPreference = "high-performance";
  }, [gl, size]);

  return null;
}

export function World(props) {
  const { globeConfig } = props;
  const scene = new Scene();
  // Removed fog for complete transparency
  
  return (
          <Canvas 
      scene={scene} 
      camera={{ fov: 50, near: 180, far: 1800, position: [0, 0, cameraZ] }}
      style={{ background: 'transparent' }}
      gl={{ 
        alpha: true, 
        antialias: false, 
        powerPreference: "high-performance",
        stencil: false,
        depth: false,
        preserveDrawingBuffer: false
      }}
      frameloop="always"
      dpr={[1, 1.5]}
    >
      <WebGLRendererConfig />
      <ambientLight color={globeConfig.ambientLight} intensity={0.6} />
      <directionalLight
        color={globeConfig.directionalLeftLight}
        position={new Vector3(-400, 100, 400)}
      />
      <directionalLight
        color={globeConfig.directionalTopLight}
        position={new Vector3(-200, 500, 200)}
      />
      <pointLight
        color={globeConfig.pointLight}
        position={new Vector3(-200, 500, 200)}
        intensity={0.8}
      />
      <Globe {...props} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minDistance={cameraZ}
        maxDistance={cameraZ}
        autoRotateSpeed={1}
        autoRotate={true}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI - Math.PI / 3}
      />
    </Canvas>
  );
}

export function hexToRgb(hex) {
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function genRandomNumbers(min, max, count) {
  const arr = [];
  while (arr.length < count) {
    const r = Math.floor(Math.random() * (max - min)) + min;
    if (arr.indexOf(r) === -1) arr.push(r);
  }

  return arr;
}
