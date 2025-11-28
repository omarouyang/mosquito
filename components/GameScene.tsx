
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Stars, Sphere } from '@react-three/drei';
import Room from './Room';
import Enemy from './Human'; // Previously Human.tsx
import PlayerController from './PlayerController';
import { useGameStore } from '../store';
import { GamePhase } from '../types';

// Fix for R3F types not being picked up in this environment
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      pointLight: any;
      ambientLight: any;
      spotLight: any;
      fog: any;
      color: any;
      torusGeometry: any;
    }
  }
}

const GameLogic = () => {
    const tickTime = useGameStore(state => state.tickTime);
    
    React.useEffect(() => {
        const interval = setInterval(() => {
            tickTime(0.1);
        }, 100);
        return () => clearInterval(interval);
    }, [tickTime]);

    return null;
}

const GameScene = () => {
  const phase = useGameStore((state) => state.phase);
  const decoyActive = useGameStore((state) => state.decoyActive);
  const decoyPosition = useGameStore((state) => state.decoyPosition);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 5, 5], fov: 75 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 5, 30]} />
      
      {/* Lights */}
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 7, 0]} intensity={1.5} color="#ffffee" castShadow />
      <spotLight position={[-5, 5, 5]} angle={0.3} penumbra={1} intensity={1} castShadow />

      {/* Environment */}
      <Room />
      <Enemy />
      <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />

      {/* Decoy Mesh */}
      {decoyActive && decoyPosition && (
          <Sphere args={[0.3]} position={decoyPosition}>
              <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={2} />
              <pointLight color="#4ade80" distance={5} decay={2} />
          </Sphere>
      )}

      {/* Logic */}
      <GameLogic />
      
      {/* Player Controller - Only active when playing */}
      {phase === GamePhase.PLAYING && <PlayerController />}
    </Canvas>
  );
};

export default GameScene;
