
import React from 'react';
import GameScene from './components/GameScene';
import HUD from './components/HUD';
import { useGameStore } from './store';

// Added IntrinsicElements declaration to fix missing div type
declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: any;
    }
  }
}

const App = () => {
  const phase = useGameStore(state => state.phase);
  
  return (
    <div className="w-full h-full relative bg-black">
      {/* Crosshair - Only show when playing */}
      {phase === 'PLAYING' && <div className="crosshair" />}
      
      {/* UI Overlay */}
      <HUD />
      
      {/* 3D Scene */}
      <GameScene />
    </div>
  );
};

export default App;
