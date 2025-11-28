
import React from 'react';
import GameScene from './components/GameScene';
import HUD from './components/HUD';
import { useGameStore } from './store';

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