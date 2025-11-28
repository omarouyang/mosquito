import React, { useRef, useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { GamePhase, LevelType, EnemyType } from '../types';
import { ENEMY_STATS } from '../constants';
import { Play, RotateCcw, Thermometer, AlertTriangle, Clock, Ghost, Zap, MapPin, User, Utensils, Briefcase, Droplets, ChevronUp, ChevronDown } from 'lucide-react';

const Joystick = () => {
    const setMobileMove = useGameStore(state => state.setMobileMove);
    const containerRef = useRef<HTMLDivElement>(null);
    const stickRef = useRef<HTMLDivElement>(null);
    const [isActive, setIsActive] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleStart = (clientX: number, clientY: number) => {
        setIsActive(true);
        updatePosition(clientX, clientY);
    };

    const handleMove = (clientX: number, clientY: number) => {
        if (!isActive) return;
        updatePosition(clientX, clientY);
    };

    const handleEnd = () => {
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
        setMobileMove(0, 0);
    };

    const updatePosition = (clientX: number, clientY: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let dx = clientX - centerX;
        let dy = clientY - centerY;
        
        const maxDist = rect.width / 2 - 20; // Joystick radius
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > maxDist) {
            const angle = Math.atan2(dy, dx);
            dx = Math.cos(angle) * maxDist;
            dy = Math.sin(angle) * maxDist;
        }

        setPosition({ x: dx, y: dy });
        
        // Normalize output -1 to 1
        const normX = dx / maxDist;
        const normY = dy / maxDist;
        setMobileMove(normX, normY);
    };

    // Touch events
    const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
    
    // Mouse events for testing
    const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
    const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);

    return (
        <div 
            ref={containerRef}
            className="w-32 h-32 bg-white/10 rounded-full backdrop-blur-sm border-2 border-white/20 relative touch-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={handleEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
        >
            <div 
                ref={stickRef}
                className="w-12 h-12 bg-white/80 rounded-full shadow-lg absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 pointer-events-none"
                style={{ transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))` }}
            />
        </div>
    );
}

const HUD = () => {
  const { 
    phase, bloodLevel, alertLevel, detectionValue, timeLeft, gameOverReason, currentLevel,
    skillInvis, skillSpeed, decoyCount, decoyActive, decoyTimer, isSucking, lastActivatedSkill,
    startGame, resetGame, selectLevel,
    setSucking, activateSpeed, activateInvis, placeDecoy, setMobileVertical
  } = useGameStore();

  const isMobile = window.matchMedia("(pointer: coarse)").matches; // Simple check

  if (phase === GamePhase.MENU) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 text-white backdrop-blur-sm">
        <div className="bg-gray-900 p-8 rounded-2xl border-2 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)] max-w-2xl w-full text-center max-h-[90vh] overflow-y-auto">
          <h1 className="text-5xl font-bold mb-2 text-green-400">3D 蚊子模擬器</h1>
          <p className="text-gray-400 mb-6 text-lg">選擇一個場景，吸飽血並生存下去！</p>
          
          {/* Level Selection */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <button 
                onClick={() => selectLevel(LevelType.BEDROOM)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                    ${currentLevel === LevelType.BEDROOM ? 'border-green-500 bg-green-900/40 scale-105' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}
                `}
            >
                <User size={32} className="text-blue-300" />
                <span className="font-bold">臥室</span>
                <span className="text-xs text-gray-400">{ENEMY_STATS[EnemyType.ELDER].name}</span>
            </button>

            <button 
                onClick={() => selectLevel(LevelType.KITCHEN)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                    ${currentLevel === LevelType.KITCHEN ? 'border-green-500 bg-green-900/40 scale-105' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}
                `}
            >
                <Utensils size={32} className="text-orange-300" />
                <span className="font-bold">廚房</span>
                <span className="text-xs text-gray-400">{ENEMY_STATS[EnemyType.CHILD].name}</span>
            </button>

            <button 
                onClick={() => selectLevel(LevelType.OFFICE)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                    ${currentLevel === LevelType.OFFICE ? 'border-green-500 bg-green-900/40 scale-105' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}
                `}
            >
                <Briefcase size={32} className="text-gray-300" />
                <span className="font-bold">辦公室</span>
                <span className="text-xs text-gray-400">{ENEMY_STATS[EnemyType.WORKER].name}</span>
            </button>
          </div>

          <div className="space-y-2 text-left bg-gray-800 p-4 rounded-lg mb-8 text-sm">
            <h3 className="font-bold text-green-300 mb-2">技能與操作 ({isMobile ? '觸控' : '鍵盤'}):</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="flex items-center gap-2"><span className="bg-gray-700 px-2 rounded">{isMobile ? '左搖桿' : 'W/A/S/D'}</span> 移動</div>
              <div className="flex items-center gap-2"><span className="bg-gray-700 px-2 rounded">{isMobile ? '右側箭頭' : 'Space/Ctrl'}</span> 上升/下降</div>
              <div className="flex items-center gap-2"><span className="bg-gray-700 px-2 rounded">{isMobile ? '滑動右螢幕' : '滑鼠'}</span> 轉動視角</div>
              <div className="flex items-center gap-2"><span className="bg-gray-700 px-2 rounded">{isMobile ? '紅色按鈕' : '左鍵'}</span> 吸血</div>
            </div>
          </div>

          <button 
            onClick={startGame}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 active:scale-95"
          >
            <Play size={24} />
            開始任務
          </button>
        </div>
      </div>
    );
  }

  if (phase === GamePhase.WON || phase === GamePhase.GAME_OVER) {
    let title = '餓死了... 💀';
    let msg = '時間到了，任務失敗。';
    
    if (phase === GamePhase.WON) {
        title = '美味! 😋';
        msg = '你已經吸飽了血，可以去產卵了!';
    } else if (gameOverReason === 'slapped') {
        title = '啪!! 👋';
        msg = '你被拍死了!';
    } else if (gameOverReason === 'detected') {
        title = '被看見了! 👀';
        msg = '人類發現了你，並用電蚊拍把你烤焦了!';
    }

    return (
      <div className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${phase === GamePhase.WON ? 'bg-green-900/80' : 'bg-red-900/80'} text-white`}>
        <div className={`text-center p-8 rounded-2xl border ${phase === GamePhase.WON ? 'bg-green-950 border-green-500' : 'bg-red-950 border-red-500'}`}>
          <h1 className={`text-6xl font-bold mb-4 ${phase === GamePhase.WON ? 'text-yellow-300' : 'text-red-500'}`}>
            {title}
          </h1>
          <p className="text-2xl mb-8">
            {msg}
          </p>
          <button 
            onClick={resetGame}
            className={`flex items-center justify-center gap-2 font-bold py-3 px-8 rounded-full transition-colors mx-auto ${phase === GamePhase.WON ? 'bg-white text-green-800 hover:bg-gray-200' : 'bg-white text-red-900 hover:bg-gray-200'}`}
          >
            <RotateCcw size={20} />
            返回菜單
          </button>
        </div>
      </div>
    );
  }

  // In-Game HUD
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 pointer-events-none">
      
      {/* Sucking Blood Overlay */}
      {isSucking && (
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-red-600/10 animate-pulse" />
            <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-red-600/30 to-transparent" />
            <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-red-600/30 to-transparent" />
        </div>
      )}

      {/* Warning Overlay */}
      {detectionValue > 0 && (
          <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 z-50">
               {detectionValue > 50 && (
                   <div className="text-red-500 font-bold text-2xl md:text-4xl animate-pulse tracking-widest drop-shadow-[0_0_10px_red]">
                       被盯上了！
                   </div>
               )}
               <div className="w-48 md:w-64 h-3 md:h-4 bg-black/50 rounded-full border border-red-500/50 overflow-hidden">
                   <div 
                       className={`h-full transition-all duration-100 ${detectionValue > 80 ? 'bg-red-600' : 'bg-yellow-500'}`}
                       style={{ width: `${detectionValue}%` }}
                   />
               </div>
          </div>
      )}

      {/* Skill Text */}
      {lastActivatedSkill && (
        <div className="absolute top-[30%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
           <h2 className="text-2xl md:text-4xl font-bold text-yellow-300 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] animate-pulse tracking-wider whitespace-nowrap">
             {lastActivatedSkill}
           </h2>
        </div>
      )}

      {/* Top Bar: Stats */}
      <div className="flex justify-between items-start w-full relative z-10 pointer-events-auto">
         <div className={`flex items-center gap-2 px-4 py-1 md:px-6 md:py-2 rounded-full text-lg md:text-2xl font-mono font-bold border-2 ${timeLeft < 10 ? 'bg-red-900/80 border-red-500 text-red-200 animate-pulse' : 'bg-black/60 border-white/20 text-white'}`}>
            <Clock size={20} />
            <span>{timeLeft.toFixed(0)}s</span>
        </div>

        {/* Meters */}
        <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2">
                <div className="text-xs md:text-sm font-bold text-yellow-400 drop-shadow-md">{ENEMY_STATS[useGameStore.getState().enemyType].name}</div>
                <div className="w-32 md:w-48 h-4 bg-gray-900/80 rounded-full border border-gray-500 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-300 ${alertLevel > 80 ? 'bg-red-600 animate-pulse' : 'bg-yellow-500'}`}
                        style={{ width: `${alertLevel}%` }}
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="text-xs md:text-sm font-bold text-red-400 drop-shadow-md">飽食度</div>
                <div className="w-32 md:w-48 h-4 bg-gray-900/80 rounded-full border border-gray-500 overflow-hidden">
                    <div 
                        className={`h-full bg-gradient-to-r from-red-900 to-red-600 transition-all duration-100 ${isSucking ? 'brightness-125' : ''}`}
                        style={{ width: `${bloodLevel}%` }}
                    />
                </div>
            </div>
        </div>
      </div>

      {/* -- MOBILE CONTROLS -- */}
      
      {/* Bottom Left: Joystick */}
      <div className="absolute bottom-8 left-8 pointer-events-auto z-20">
          <Joystick />
      </div>

      {/* Bottom Right: Action Buttons */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-4 pointer-events-auto z-20 items-end">
          
          {/* Vertical Controls */}
          <div className="flex flex-col gap-2 mr-2">
              <button 
                className="p-3 bg-white/10 rounded-lg border-2 border-white/30 active:bg-white/30 backdrop-blur-md"
                onTouchStart={() => setMobileVertical(1)}
                onTouchEnd={() => setMobileVertical(0)}
                onMouseDown={() => setMobileVertical(1)}
                onMouseUp={() => setMobileVertical(0)}
              >
                  <ChevronUp className="text-white" size={24} />
              </button>
              <button 
                className="p-3 bg-white/10 rounded-lg border-2 border-white/30 active:bg-white/30 backdrop-blur-md"
                onTouchStart={() => setMobileVertical(-1)}
                onTouchEnd={() => setMobileVertical(0)}
                onMouseDown={() => setMobileVertical(-1)}
                onMouseUp={() => setMobileVertical(0)}
              >
                  <ChevronDown className="text-white" size={24} />
              </button>
          </div>

          <div className="flex gap-4 items-end">
              {/* Skills Row */}
              <div className="flex gap-2">
                  <button onClick={activateSpeed} className={`p-3 rounded-full border-2 backdrop-blur-md ${skillSpeed.isActive ? 'bg-yellow-500/50 border-yellow-300' : 'bg-black/40 border-white/20'}`}>
                      <Zap className={skillSpeed.isActive ? 'text-yellow-100' : 'text-white'} size={20} />
                  </button>
                  <button onClick={activateInvis} className={`p-3 rounded-full border-2 backdrop-blur-md ${skillInvis.isActive ? 'bg-purple-500/50 border-purple-300' : 'bg-black/40 border-white/20'}`}>
                      <Ghost className={skillInvis.isActive ? 'text-purple-100' : 'text-white'} size={20} />
                  </button>
                  <button onClick={() => placeDecoy([0,0,0])} className={`p-3 rounded-full border-2 backdrop-blur-md ${decoyActive ? 'bg-green-500/50 border-green-300' : 'bg-black/40 border-white/20'}`}>
                      <MapPin className={decoyActive ? 'text-green-100' : 'text-white'} size={20} />
                  </button>
              </div>

              {/* Main Suck Button */}
              <button 
                className={`w-20 h-20 rounded-full border-4 shadow-xl flex items-center justify-center transition-all ${isSucking ? 'bg-red-600 border-red-300 scale-95' : 'bg-red-500/80 border-red-400 active:scale-95'}`}
                onTouchStart={() => setSucking(true)}
                onTouchEnd={() => setSucking(false)}
                onMouseDown={() => setSucking(true)}
                onMouseUp={() => setSucking(false)}
              >
                  <Thermometer className="text-white" size={32} />
              </button>
          </div>
      </div>

      {/* Screen Effects */}
      {alertLevel > 50 && (
        <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-0"
            style={{ 
                background: `radial-gradient(circle, transparent 60%, rgba(255,0,0,${(alertLevel - 50) / 100}) 100%)`,
                opacity: (alertLevel - 50) / 50 
            }}
        />
      )}
      {detectionValue > 90 && (
          <div className="absolute inset-0 pointer-events-none bg-white/10 animate-pulse z-20" />
      )}
      {skillInvis.isActive && (
          <div className="absolute inset-0 pointer-events-none border-[20px] border-purple-500/30 shadow-[inset_0_0_50px_rgba(168,85,247,0.5)] z-0" />
      )}
    </div>
  );
};

export default HUD;