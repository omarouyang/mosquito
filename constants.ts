
export const GAME_DURATION = 90; // Seconds
export const WIN_BLOOD_THRESHOLD = 100;
export const ALERT_DECAY_RATE = 10; // Per second
export const BLOOD_SUCK_RATE = 15; // Per second
export const HUMAN_SENSITIVITY_DISTANCE = 3.5; // Meters
export const SUCK_DISTANCE = 2.0; // Meters
export const MOVEMENT_SPEED = 4.0;

// Detection Constants
export const DETECTION_ANGLE = 0.5; // Cosine of view angle
export const DETECTION_DISTANCE_MAX = 8.0;
export const DETECTION_RATE = 25; // Alert gain per second when detected
export const DETECTION_DECAY = 10; // Detection falloff per second
export const HEARING_DISTANCE = 3.0;

// Skill Constants
export const SKILL_INVIS_DURATION = 5;
export const SKILL_INVIS_COOLDOWN = 15;
export const SKILL_SPEED_DURATION = 0.5; // Instant boost decay or hold? Let's do duration
export const SKILL_SPEED_COOLDOWN = 5;
export const SKILL_SPEED_MULTIPLIER = 2.5;

export const ITEM_DECOY_DURATION = 8;
export const ITEM_DECOY_COUNT = 2;

// Enemy Configurations
export const ENEMY_STATS = {
  ELDER: {
    name: "行動緩慢的老人",
    alertRate: 20, // Slower alert gain
    decayRate: 15, // Forgives faster
    slapTime: 1.5, // Time from 100% to slap
    visualScale: 1.0,
    moveSpeed: 1.2, // Slow movement
    idleTimeRange: [3, 7] // Seconds to wait before moving
  },
  CHILD: {
    name: "警覺的兒童",
    alertRate: 45, // Fast alert gain
    decayRate: 5, // Grudges longer
    slapTime: 0.5, // Very fast slap
    visualScale: 0.7,
    moveSpeed: 3.5, // Fast movement
    idleTimeRange: [1, 3]
  },
  WORKER: {
    name: "疲憊的上班族",
    alertRate: 35,
    decayRate: 10,
    slapTime: 0.9,
    visualScale: 1.0, 
    moveSpeed: 2.2,
    idleTimeRange: [2, 5]
  }
};
