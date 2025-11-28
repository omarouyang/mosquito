
import { create } from 'zustand';
import { GamePhase, GameState, LevelType, EnemyType } from './types';
import { 
  GAME_DURATION, 
  WIN_BLOOD_THRESHOLD, 
  ITEM_DECOY_COUNT, 
  ITEM_DECOY_DURATION,
  SKILL_INVIS_COOLDOWN,
  SKILL_INVIS_DURATION,
  SKILL_SPEED_COOLDOWN,
  SKILL_SPEED_DURATION
} from './constants';

export const useGameStore = create<GameState>((set, get) => ({
  phase: GamePhase.MENU,
  currentLevel: LevelType.BEDROOM,
  enemyType: EnemyType.ELDER,
  
  bloodLevel: 0,
  alertLevel: 0,
  detectionValue: 0,
  timeLeft: GAME_DURATION,
  isSucking: false,
  gameOverReason: null,

  gyroEnabled: false,

  skillInvis: { isActive: false, cooldownTimer: 0, durationTimer: 0 },
  skillSpeed: { isActive: false, cooldownTimer: 0, durationTimer: 0 },
  decoyActive: false,
  decoyTimer: 0,
  decoyCount: ITEM_DECOY_COUNT,
  decoyPosition: null,

  mobileInput: {
      move: { x: 0, y: 0 },
      vertical: 0,
      turn: 0
  },

  lastActivatedSkill: null,

  selectLevel: (level) => {
    let enemy = EnemyType.ELDER;
    if (level === LevelType.KITCHEN) enemy = EnemyType.CHILD;
    if (level === LevelType.OFFICE) enemy = EnemyType.WORKER;
    
    set({ currentLevel: level, enemyType: enemy });
  },

  startGame: () => set({
    phase: GamePhase.PLAYING,
    bloodLevel: 0,
    alertLevel: 0,
    detectionValue: 0,
    timeLeft: GAME_DURATION,
    isSucking: false,
    skillInvis: { isActive: false, cooldownTimer: 0, durationTimer: 0 },
    skillSpeed: { isActive: false, cooldownTimer: 0, durationTimer: 0 },
    decoyActive: false,
    decoyTimer: 0,
    decoyCount: ITEM_DECOY_COUNT,
    decoyPosition: null,
    lastActivatedSkill: null,
    mobileInput: { move: { x: 0, y: 0 }, vertical: 0, turn: 0 }
  }),

  resetGame: () => set({
    phase: GamePhase.MENU,
    bloodLevel: 0,
    alertLevel: 0,
    detectionValue: 0,
    timeLeft: GAME_DURATION,
    isSucking: false,
    lastActivatedSkill: null
  }),

  suckBlood: (amount) => {
    const { bloodLevel, phase } = get();
    if (phase !== GamePhase.PLAYING) return;

    const newLevel = Math.min(bloodLevel + amount, WIN_BLOOD_THRESHOLD);
    set({ bloodLevel: newLevel });

    if (newLevel >= WIN_BLOOD_THRESHOLD) {
      get().triggerWin();
    }
  },

  increaseAlert: (amount) => {
    const { alertLevel, phase, skillInvis, decoyActive } = get();
    if (phase !== GamePhase.PLAYING) return;

    // If invisible, alert doesn't rise significantly (or at all)
    if (skillInvis.isActive) return;

    // If decoy is active, alert rises much slower on player
    const modifier = decoyActive ? 0.2 : 1.0;

    const newLevel = Math.min(alertLevel + (amount * modifier), 100);
    set({ alertLevel: newLevel });

    if (newLevel >= 100) {
      get().triggerGameOver('slapped');
    }
  },

  decreaseAlert: (amount) => {
    const { alertLevel } = get();
    set({ alertLevel: Math.max(alertLevel - amount, 0) });
  },

  setDetection: (amount) => {
      const { phase } = get();
      if (phase !== GamePhase.PLAYING) return;
      
      const newVal = Math.max(0, Math.min(100, amount));
      set({ detectionValue: newVal });

      if (newVal >= 100) {
          get().triggerGameOver('detected');
      }
  },

  tickTime: (delta) => {
    const state = get();
    if (state.phase !== GamePhase.PLAYING) return;

    // Game Timer
    const newTime = state.timeLeft - delta;
    if (newTime <= 0) {
      set({ timeLeft: 0 });
      get().triggerGameOver('time');
      return;
    }

    // Skill: Invisibility
    let invis = { ...state.skillInvis };
    if (invis.isActive) {
        invis.durationTimer -= delta;
        if (invis.durationTimer <= 0) {
            invis.isActive = false;
            invis.cooldownTimer = SKILL_INVIS_COOLDOWN;
        }
    } else if (invis.cooldownTimer > 0) {
        invis.cooldownTimer -= delta;
    }

    // Skill: Speed
    let speed = { ...state.skillSpeed };
    if (speed.isActive) {
        speed.durationTimer -= delta;
        if (speed.durationTimer <= 0) {
            speed.isActive = false;
            speed.cooldownTimer = SKILL_SPEED_COOLDOWN;
        }
    } else if (speed.cooldownTimer > 0) {
        speed.cooldownTimer -= delta;
    }

    // Item: Decoy
    let decoyTimer = state.decoyTimer;
    let decoyActive = state.decoyActive;
    let decoyPos = state.decoyPosition;
    
    if (decoyActive) {
        decoyTimer -= delta;
        if (decoyTimer <= 0) {
            decoyActive = false;
            decoyPos = null;
        }
    }

    set({ 
        timeLeft: newTime,
        skillInvis: invis,
        skillSpeed: speed,
        decoyTimer: Math.max(0, decoyTimer),
        decoyActive,
        decoyPosition: decoyPos
    });
  },

  setSucking: (isSucking) => set({ isSucking }),

  triggerGameOver: (reason) => set({ phase: GamePhase.GAME_OVER, gameOverReason: reason }),
  triggerWin: () => set({ phase: GamePhase.WON }),

  setGyroEnabled: (enabled) => set({ gyroEnabled: enabled }),

  activateInvis: () => {
      const { skillInvis } = get();
      if (!skillInvis.isActive && skillInvis.cooldownTimer <= 0) {
          set({ 
              skillInvis: { 
                  isActive: true, 
                  durationTimer: SKILL_INVIS_DURATION, 
                  cooldownTimer: SKILL_INVIS_COOLDOWN 
              },
              lastActivatedSkill: "👻 隱形模式啟動" 
          });
          setTimeout(() => set({ lastActivatedSkill: null }), 2000);
      }
  },

  activateSpeed: () => {
      const { skillSpeed } = get();
      if (!skillSpeed.isActive && skillSpeed.cooldownTimer <= 0) {
          set({ 
              skillSpeed: { 
                  isActive: true, 
                  durationTimer: SKILL_SPEED_DURATION, 
                  cooldownTimer: SKILL_SPEED_COOLDOWN 
              },
              lastActivatedSkill: "⚡ 急速飛行！"
          });
          setTimeout(() => set({ lastActivatedSkill: null }), 2000);
      }
  },

  placeDecoy: (position) => {
      const { decoyCount, decoyActive } = get();
      if (decoyCount > 0 && !decoyActive) {
          set({
              decoyActive: true,
              decoyTimer: ITEM_DECOY_DURATION,
              decoyCount: decoyCount - 1,
              decoyPosition: position,
              lastActivatedSkill: "🥗 氣味誘餌已放置"
          });
          setTimeout(() => set({ lastActivatedSkill: null }), 2000);
      }
  },

  setMobileMove: (x, y) => set({ mobileInput: { ...get().mobileInput, move: { x, y } } }),
  setMobileVertical: (val) => set({ mobileInput: { ...get().mobileInput, vertical: val } }),
  setMobileTurn: (val) => set({ mobileInput: { ...get().mobileInput, turn: val } }),
}));
