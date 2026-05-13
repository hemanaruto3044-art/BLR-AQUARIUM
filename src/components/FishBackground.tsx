import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

function CameraRig() {
  const { camera } = useThree();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Gentle floating motion for the "underwater camera"
    camera.position.x = Math.sin(t * 0.3) * 1.5;
    camera.position.y = Math.cos(t * 0.2) * 1.2;
    camera.rotation.z = Math.sin(t * 0.1) * 0.02;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Bubbles({ count = 50 }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      
      // Bubbles moving slowly upwards
      particle.yFactor += speed * 20;
      if (particle.yFactor > 50) particle.yFactor = -50;

      dummy.position.set(
        xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        particle.yFactor,
        zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10
      );
      dummy.scale.set(s * 0.2, s * 0.2, s * 0.2);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
    </instancedMesh>
  );
}

function SingleFish({ position, speed, color }: { position: [number, number, number], speed: number, color: string }) {
  const group = useRef<THREE.Group>(null!);
  const t = useRef(Math.random() * 100);

  useFrame((state, delta) => {
    t.current += delta * speed;
    
    // Complex swimming path
    const x = position[0] + Math.sin(t.current * 0.4) * 25;
    const y = position[1] + Math.cos(t.current * 0.25) * 15;
    const z = position[2] + Math.sin(t.current * 0.5) * 10;

    group.current.position.set(x, y, z);
    
    // Look ahead to orient the fish
    const nextT = t.current + 0.1;
    const nextX = position[0] + Math.sin(nextT * 0.4) * 25;
    const nextY = position[1] + Math.cos(nextT * 0.25) * 15;
    const nextZ = position[2] + Math.sin(nextT * 0.5) * 10;
    
    const target = new THREE.Vector3(nextX, nextY, nextZ);
    group.current.lookAt(target);
    
    // Tail animation - second child is the tail
    const tail = group.current.children[1] as THREE.Mesh;
    if (tail) {
      tail.rotation.y = Math.sin(t.current * 8) * 0.8;
    }
  });

  return (
    <group ref={group}>
      {/* Body */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <capsuleGeometry args={[0.4, 1.2, 4, 8]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.4} 
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* Tail */}
      <mesh position={[0, 0, -0.8]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.3, 0.7, 3]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.4}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

function Starfish({ position, color, speed }: { position: [number, number, number], color: string, speed: number }) {
  const group = useRef<THREE.Group>(null!);
  const t = useRef(Math.random() * 100);

  useFrame((state, delta) => {
    t.current += delta * speed;
    // Slight breathing/pulsing animation
    const pulse = 1 + Math.sin(t.current) * 0.1;
    group.current.scale.set(pulse, pulse, pulse);
    // Slow rotation on the "ground"
    group.current.rotation.y += delta * 0.2;
  });

  return (
    <group ref={group} position={position} rotation={[-Math.PI / 2.5, 0, 0]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 5]}>
          <capsuleGeometry args={[0.15, 0.7, 4, 8]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={0.3}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
      {/* Center point */}
      <mesh>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.4}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

export default function FishBackground() {
  const fishes = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20
      ] as [number, number, number],
      speed: 0.3 + Math.random() * 0.7,
      color: ['#0ea5e9', '#06b6d4', '#22d3ee', '#38bdf8', '#7dd3fc'][Math.floor(Math.random() * 5)]
    }));
  }, []);

  const starfish = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 50,
        -15 + Math.random() * 5, // Near the bottom
        (Math.random() - 0.5) * 20
      ] as [number, number, number],
      speed: 0.5 + Math.random() * 0.5,
      color: ['#f43f5e', '#fb7185', '#fda4af', '#fca5a5', '#f87171'][Math.floor(Math.random() * 5)]
    }));
  }, []);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-gradient-to-b from-[#082f49] to-[#011627]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#0ea5e955,transparent_70%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-black/20 z-[1] pointer-events-none" /> {/* Vignette feel */}
      
      <Canvas camera={{ position: [0, 0, 40], fov: 60 }}>
        <CameraRig />
        <fog attach="fog" args={['#082f49', 10, 100]} />
        <ambientLight intensity={0.4} />
        
        {/* Dynamic lighting for caustics effect */}
        <pointLight position={[20, 30, 10]} intensity={2} color="#7dd3fc">
          <MovingLight />
        </pointLight>
        <pointLight position={[-20, -20, -20]} intensity={0.5} color="#0ea5e9" />
        
        <Bubbles count={100} />
        
        {fishes.map((fish, i) => (
          <SingleFish key={i} {...fish} />
        ))}

        {starfish.map((sf, i) => (
          <Starfish key={i} {...sf} />
        ))}
      </Canvas>
    </div>
  );
}

function MovingLight() {
  const ref = useRef<THREE.PointLight>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ref.current.position.x = Math.sin(t * 0.5) * 20;
    ref.current.intensity = 1.5 + Math.sin(t * 2) * 0.5;
  });
  return <pointLight ref={ref} />;
}
