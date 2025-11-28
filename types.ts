
export enum GamePhase {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  WON = 'WON',
  GAME_OVER = 'GAME_OVER'
}

export enum LevelType {
  BEDROOM = 'BEDROOM',
  KITCHEN = 'KITCHEN',
  OFFICE = 'OFFICE'
}

export enum EnemyType {
  ELDER = 'ELDER', // Slow, low sensitivity
  CHILD = 'CHILD', // Fast, high sensitivity
  WORKER = 'WORKER' // Average, tired but angry
}

export interface SkillState {
  isActive: boolean;
  cooldownTimer: number;
  durationTimer: number;
}

export interface GameState {
  phase: GamePhase;
  currentLevel: LevelType;
  enemyType: EnemyType;
  
  bloodLevel: number; // 0 to 100
  alertLevel: number; // 0 to 100
  detectionValue: number; // 0 to 100
  timeLeft: number;
  isSucking: boolean;
  
  // Settings
  gyroEnabled: boolean;

  // Skills & Items
  skillInvis: SkillState;
  skillSpeed: SkillState;
  decoyActive: boolean;
  decoyTimer: number;
  decoyCount: number;
  decoyPosition: [number, number, number] | null;

  // Mobile Inputs
  mobileInput: {
      move: { x: number, y: number }; // Joystick vector
      vertical: number; // -1 (down), 0, 1 (up)
      turn: number; // -1 (left), 0, 1 (right)
  };

  // UI Feedback
  lastActivatedSkill: string | null;

  gameOverReason: 'time' | 'slapped' | 'detected' | null;
  
  // Actions
  selectLevel: (level: LevelType) => void;
  startGame: () => void;
  resetGame: () => void;
  suckBlood: (amount: number) => void;
  increaseAlert: (amount: number) => void;
  decreaseAlert: (amount: number) => void;
  setDetection: (amount: number) => void;
  tickTime: (delta: number) => void;
  setSucking: (isSucking: boolean) => void;
  triggerGameOver: (reason: 'time' | 'slapped' | 'detected') => void;
  triggerWin: () => void;
  
  // Settings Actions
  setGyroEnabled: (enabled: boolean) => void;
  
  // Skill Actions
  activateInvis: () => void;
  activateSpeed: () => void;
  placeDecoy: (position: [number, number, number]) => void;

  // Mobile Input Actions
  setMobileMove: (x: number, y: number) => void;
  setMobileVertical: (val: number) => void;
  setMobileTurn: (val: number) => void;
}

// Fix for R3F types not being picked up in this environment
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Three.js elements
      group: any;
      mesh: any;
      scene: any;
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      meshPhongMaterial: any;
      pointLight: any;
      ambientLight: any;
      spotLight: any;
      directionalLight: any;
      fog: any;
      color: any;
      
      // Geometries
      boxGeometry: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      torusGeometry: any;
      ringGeometry: any;
      planeGeometry: any;
      coneGeometry: any;
      circleGeometry: any;
      
      // HTML elements
      div: any;
      span: any;
      h1: any;
      h2: any;
      h3: any;
      p: any;
      button: any;
      input: any;
      label: any;
      form: any;
      ul: any;
      li: any;
      a: any;
      img: any;
    }
  }
}
