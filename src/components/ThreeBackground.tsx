import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';

const Bubble = ({ position, size, speed }: { position: [number, number, number], size: number, speed: number }) => {
  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere args={[size, 16, 16]} position={position}>
        <MeshDistortMaterial
          color="#7dd3fc"
          attach="material"
          distort={0.3}
          speed={speed}
          roughness={0}
          transparent
          opacity={0.3}
        />
      </Sphere>
    </Float>
  );
};

const UnderwaterScene = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#0ea5e9" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0284c7" />
        
        <Bubble position={[-2, -3, 0]} size={0.3} speed={2} />
        <Bubble position={[3, -2, -1]} size={0.4} speed={1.5} />
        <Bubble position={[-1, 2, -2]} size={0.2} speed={3} />
        <Bubble position={[4, 3, 0]} size={0.5} speed={1.2} />
        <Bubble position={[-4, 1, -1]} size={0.3} speed={2.5} />
        
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
};

export default UnderwaterScene;
