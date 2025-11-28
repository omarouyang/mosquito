
import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Cylinder, Sphere, Html, Box, Torus, Cone } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { SUCK_DISTANCE, ENEMY_STATS, DETECTION_ANGLE, DETECTION_DISTANCE_MAX, DETECTION_RATE, DETECTION_DECAY, HEARING_DISTANCE, HUMAN_SENSITIVITY_DISTANCE } from '../constants';
import { EnemyType } from '../types';

// --- Visual Components for Detail ---

const Eyes = () => (
  <group position={[0, 0.1, 0.45]}>
    <Sphere args={[0.07]} position={[-0.15, 0, 0]}>
        <meshBasicMaterial color="white" />
    </Sphere>
    <Sphere args={[0.03]} position={[-0.15, 0, 0.06]}>
        <meshBasicMaterial color="black" />
    </Sphere>
    <Sphere args={[0.07]} position={[0.15, 0, 0]}>
        <meshBasicMaterial color="white" />
    </Sphere>
    <Sphere args={[0.03]} position={[0.15, 0, 0.06]}>
        <meshBasicMaterial color="black" />
    </Sphere>
  </group>
);

interface VisualProps {
    isMoving: boolean;
    isAttacking: boolean;
    headRef?: React.RefObject<THREE.Mesh>;
}

const ElderVisuals = ({ isMoving, isAttacking, headRef: externalHeadRef }: VisualProps) => {
    // Internal refs for animation pivots
    const groupRef = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.Group>(null);
    const leftArmGroupRef = useRef<THREE.Group>(null);
    const rightArmGroupRef = useRef<THREE.Group>(null);
    const leftLegGroupRef = useRef<THREE.Group>(null);
    const rightLegGroupRef = useRef<THREE.Group>(null);
    const localHeadRef = useRef<THREE.Mesh>(null);
    
    // Use external ref if provided, otherwise use local
    const headRef = externalHeadRef || localHeadRef;

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;

        // --- ATTACK ANIMATION (SLAP) ---
        if (isAttacking) {
            // Stop walking animations
            if (leftLegGroupRef.current) leftLegGroupRef.current.rotation.x = THREE.MathUtils.lerp(leftLegGroupRef.current.rotation.x, 0, 0.1);
            if (rightLegGroupRef.current) rightLegGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightLegGroupRef.current.rotation.x, 0, 0.1);
            
            // Body twists towards the slap
            if (bodyRef.current) {
                bodyRef.current.rotation.y = THREE.MathUtils.lerp(bodyRef.current.rotation.y, -0.5, 0.1);
            }

            // Right Arm (Swatting motion)
            if (rightArmGroupRef.current) {
                // Raise arm rapidly
                // Simple slap loop: Raise -> Swat -> Reset
                // We use a simple Lerp to a target pose for simplicity in this framework
                
                // Animate a swat
                const swatPhase = (t * 5) % Math.PI; // Quick cycle
                
                rightArmGroupRef.current.rotation.z = THREE.MathUtils.lerp(rightArmGroupRef.current.rotation.z, Math.sin(swatPhase) > 0 ? 2.8 : 0.5, 0.2);
                rightArmGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightArmGroupRef.current.rotation.x, Math.sin(swatPhase) > 0 ? -1.5 : 0, 0.2);
            }
            return;
        }

        // --- WALK / IDLE ANIMATION ---
        
        // Body breathing/bobbing
        if (bodyRef.current) {
            const breathSpeed = isMoving ? 10 : 2;
            const breathAmp = isMoving ? 0.05 : 0.01;
            bodyRef.current.position.y = 2.3 + Math.sin(t * breathSpeed) * breathAmp;
            
            // Waddle (Side to side) when walking
            if (isMoving) {
                bodyRef.current.rotation.z = Math.sin(t * 5) * 0.05;
                bodyRef.current.rotation.y = Math.sin(t * 2) * 0.05;
            } else {
                bodyRef.current.rotation.z = THREE.MathUtils.lerp(bodyRef.current.rotation.z, 0, 0.1);
                bodyRef.current.rotation.y = THREE.MathUtils.lerp(bodyRef.current.rotation.y, 0, 0.1);
            }
        }

        // Head looking around (Idle only)
        if (headRef.current && !isMoving) {
            headRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;
            headRef.current.rotation.x = Math.sin(t * 0.3) * 0.05;
        } else if (headRef.current) {
            // Stabilize head when walking
            headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 0.1);
        }

        // Limbs Animation
        const walkSpeed = 6;
        const armAmp = 0.4;
        const legAmp = 0.6;

        if (isMoving) {
            // Legs (Opposite phases)
            if (leftLegGroupRef.current) leftLegGroupRef.current.rotation.x = Math.sin(t * walkSpeed) * legAmp;
            if (rightLegGroupRef.current) rightLegGroupRef.current.rotation.x = Math.sin(t * walkSpeed + Math.PI) * legAmp;

            // Arms (Opposite to legs)
            if (leftArmGroupRef.current) leftArmGroupRef.current.rotation.x = Math.sin(t * walkSpeed + Math.PI) * armAmp;
            // Right arm (with cane) - moves slightly less
            if (rightArmGroupRef.current) {
                rightArmGroupRef.current.rotation.x = Math.sin(t * walkSpeed) * armAmp;
                // Add a little lift to the cane arm
                rightArmGroupRef.current.rotation.z = 0.2 + Math.abs(Math.sin(t * walkSpeed)) * 0.1; 
            }
        } else {
            // Reset limbs to idle
            if (leftLegGroupRef.current) leftLegGroupRef.current.rotation.x = THREE.MathUtils.lerp(leftLegGroupRef.current.rotation.x, 0, 0.1);
            if (rightLegGroupRef.current) rightLegGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightLegGroupRef.current.rotation.x, 0, 0.1);
            if (leftArmGroupRef.current) leftArmGroupRef.current.rotation.x = THREE.MathUtils.lerp(leftArmGroupRef.current.rotation.x, 0, 0.1);
            if (rightArmGroupRef.current) {
                 rightArmGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightArmGroupRef.current.rotation.x, 0, 0.1);
                 rightArmGroupRef.current.rotation.z = THREE.MathUtils.lerp(rightArmGroupRef.current.rotation.z, 0, 0.1);
            }
        }
    });

    return (
        <group ref={groupRef}>
            {/* Body Group (Torso + Head + Arms attached) */}
            <group ref={bodyRef} position={[0, 2.3, 0]}>
                
                {/* Head - Attached to Body */}
                <group position={[0, 1.7, 0]}>
                    <Sphere ref={headRef} args={[0.5]} position={[0, 0, 0]} castShadow receiveShadow>
                        <meshStandardMaterial color="#ffccaa" roughness={0.6} />
                        <Eyes />
                        {/* Wrinkles */}
                        <group position={[0, 0.35, 0.4]}>
                            <Torus args={[0.2, 0.01, 8, 16, 1]} rotation={[0,0,-0.5]} position={[0, 0, 0]}>
                                <meshStandardMaterial color="#e0a890" />
                            </Torus>
                        </group>
                        {/* Eyebrows */}
                        <group position={[0, 0.22, 0.42]}>
                            <Box args={[0.15, 0.04, 0.02]} position={[-0.15, 0, 0]} rotation={[0, 0, 0.1]}>
                                <meshStandardMaterial color="#bdbdbd" />
                            </Box>
                            <Box args={[0.15, 0.04, 0.02]} position={[0.15, 0, 0]} rotation={[0, 0, -0.1]}>
                                <meshStandardMaterial color="#bdbdbd" />
                            </Box>
                        </group>
                        {/* Glasses */}
                        <group position={[0, 0.1, 0.4]}>
                            <Torus args={[0.12, 0.02, 16, 32]} position={[-0.15, 0, 0]}>
                                <meshStandardMaterial color="#333" roughness={0.2} metalness={0.5} />
                            </Torus>
                            <Torus args={[0.12, 0.02, 16, 32]} position={[0.15, 0, 0]}>
                                <meshStandardMaterial color="#333" roughness={0.2} metalness={0.5} />
                            </Torus>
                            <Box args={[0.1, 0.02, 0.02]} position={[0, 0, 0]}>
                                <meshStandardMaterial color="#333" roughness={0.2} metalness={0.5} />
                            </Box>
                        </group>
                        {/* Mouth */}
                        <Box args={[0.15, 0.02, 0.02]} position={[0, -0.2, 0.45]}>
                            <meshStandardMaterial color="#d88" />
                        </Box>
                        {/* Hair */}
                        <Sphere args={[0.52]} position={[0, 0.1, -0.1]} scale={[1, 0.8, 0.8]} castShadow>
                            <meshStandardMaterial color="#eeeeee" roughness={1} />
                        </Sphere>
                    </Sphere>
                </group>

                {/* Torso Geometry */}
                <group>
                    <Cylinder args={[0.6, 0.7, 2.2]} position={[0, 0, 0]} castShadow receiveShadow>
                        <meshStandardMaterial color="#5d4037" roughness={0.9} />
                        <Torus args={[0.6, 0.1, 16, 32]} position={[0, 1.1, 0]} rotation={[Math.PI/2, 0, 0]}>
                            <meshStandardMaterial color="#4e342e" roughness={0.9} />
                        </Torus>
                    </Cylinder>
                </group>

                {/* Left Arm Pivot (Shoulder) */}
                <group ref={leftArmGroupRef} position={[-0.7, 0.8, 0]} rotation={[0, 0, 0.2]}>
                    <group position={[0, -0.9, 0]}> 
                        <Cylinder args={[0.15, 0.12, 1.8]} position={[0, 0, 0]} castShadow>
                            <meshStandardMaterial color="#5d4037" roughness={0.9} />
                        </Cylinder>
                        <Sphere args={[0.15]} position={[0, -1.0, 0]} castShadow>
                            <meshStandardMaterial color="#ffccaa" roughness={0.6} />
                        </Sphere>
                    </group>
                </group>

                {/* Right Arm Pivot (Shoulder) */}
                <group ref={rightArmGroupRef} position={[0.7, 0.8, 0]} rotation={[0, 0, -0.2]}>
                     <group position={[0, -0.9, 0]}>
                         <Cylinder args={[0.15, 0.12, 1.8]} position={[0, 0, 0]} castShadow>
                            <meshStandardMaterial color="#5d4037" roughness={0.9} />
                         </Cylinder>
                         <Sphere args={[0.15]} position={[0, -1.0, 0]} castShadow>
                            <meshStandardMaterial color="#ffccaa" roughness={0.6} />
                         </Sphere>
                         {/* Cane */}
                         <Cylinder args={[0.05, 0.04, 3.5]} position={[0.1, -0.6, 0.5]} rotation={[0.2, 0, 0]} castShadow>
                            <meshStandardMaterial color="#3e2723" roughness={0.3} />
                         </Cylinder>
                    </group>
                </group>

            </group>
            
            {/* Legs */}
            <group ref={leftLegGroupRef} position={[-0.3, 1.2, 0]}>
                <group position={[0, -1, 0]}>
                    <Cylinder args={[0.18, 0.15, 2.0]} position={[0, 0, 0]} castShadow>
                         <meshStandardMaterial color="#424242" roughness={0.8} />
                    </Cylinder>
                    <Box args={[0.25, 0.1, 0.4]} position={[0, -1, 0.1]} castShadow>
                         <meshStandardMaterial color="black" roughness={0.4} />
                    </Box>
                </group>
            </group>
            
            <group ref={rightLegGroupRef} position={[0.3, 1.2, 0]}>
                <group position={[0, -1, 0]}>
                    <Cylinder args={[0.18, 0.15, 2.0]} position={[0, 0, 0]} castShadow>
                        <meshStandardMaterial color="#424242" roughness={0.8} />
                    </Cylinder>
                    <Box args={[0.25, 0.1, 0.4]} position={[0, -1, 0.1]} castShadow>
                        <meshStandardMaterial color="black" roughness={0.4} />
                    </Box>
                </group>
            </group>
        </group>
    )
}

const WorkerVisuals = ({ isMoving, isAttacking, headRef: externalHeadRef }: VisualProps) => {
    // Reused logic for skeleton animation, but different mesh props
    const groupRef = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.Group>(null);
    const leftArmGroupRef = useRef<THREE.Group>(null);
    const rightArmGroupRef = useRef<THREE.Group>(null);
    const leftLegGroupRef = useRef<THREE.Group>(null);
    const rightLegGroupRef = useRef<THREE.Group>(null);
    const localHeadRef = useRef<THREE.Mesh>(null);
    const headRef = externalHeadRef || localHeadRef;

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;
        if (isAttacking) {
            if (leftLegGroupRef.current) leftLegGroupRef.current.rotation.x = THREE.MathUtils.lerp(leftLegGroupRef.current.rotation.x, 0, 0.1);
            if (rightLegGroupRef.current) rightLegGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightLegGroupRef.current.rotation.x, 0, 0.1);
            if (bodyRef.current) bodyRef.current.rotation.y = THREE.MathUtils.lerp(bodyRef.current.rotation.y, -0.5, 0.1);
            if (rightArmGroupRef.current) {
                const swatPhase = (t * 5) % Math.PI; 
                rightArmGroupRef.current.rotation.z = THREE.MathUtils.lerp(rightArmGroupRef.current.rotation.z, Math.sin(swatPhase) > 0 ? 2.8 : 0.5, 0.2);
                rightArmGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightArmGroupRef.current.rotation.x, Math.sin(swatPhase) > 0 ? -1.5 : 0, 0.2);
            }
            return;
        }
        if (bodyRef.current) {
            const breathSpeed = isMoving ? 10 : 2;
            const breathAmp = isMoving ? 0.05 : 0.01;
            bodyRef.current.position.y = 2.3 + Math.sin(t * breathSpeed) * breathAmp;
            if (isMoving) {
                bodyRef.current.rotation.z = Math.sin(t * 5) * 0.05;
                bodyRef.current.rotation.y = Math.sin(t * 2) * 0.05;
            } else {
                bodyRef.current.rotation.z = THREE.MathUtils.lerp(bodyRef.current.rotation.z, 0, 0.1);
                bodyRef.current.rotation.y = THREE.MathUtils.lerp(bodyRef.current.rotation.y, 0, 0.1);
            }
        }
        if (headRef.current && !isMoving) {
            headRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;
            headRef.current.rotation.x = Math.sin(t * 0.3) * 0.05;
        } else if (headRef.current) {
            headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 0.1);
        }
        const walkSpeed = 6;
        const armAmp = 0.4;
        const legAmp = 0.6;
        if (isMoving) {
            if (leftLegGroupRef.current) leftLegGroupRef.current.rotation.x = Math.sin(t * walkSpeed) * legAmp;
            if (rightLegGroupRef.current) rightLegGroupRef.current.rotation.x = Math.sin(t * walkSpeed + Math.PI) * legAmp;
            if (leftArmGroupRef.current) leftArmGroupRef.current.rotation.x = Math.sin(t * walkSpeed + Math.PI) * armAmp;
            if (rightArmGroupRef.current) {
                rightArmGroupRef.current.rotation.x = Math.sin(t * walkSpeed) * armAmp;
                rightArmGroupRef.current.rotation.z = 0.1;
            }
        } else {
            if (leftLegGroupRef.current) leftLegGroupRef.current.rotation.x = THREE.MathUtils.lerp(leftLegGroupRef.current.rotation.x, 0, 0.1);
            if (rightLegGroupRef.current) rightLegGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightLegGroupRef.current.rotation.x, 0, 0.1);
            if (leftArmGroupRef.current) leftArmGroupRef.current.rotation.x = THREE.MathUtils.lerp(leftArmGroupRef.current.rotation.x, 0, 0.1);
            if (rightArmGroupRef.current) {
                 rightArmGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightArmGroupRef.current.rotation.x, 0, 0.1);
                 rightArmGroupRef.current.rotation.z = THREE.MathUtils.lerp(rightArmGroupRef.current.rotation.z, 0, 0.1);
            }
        }
    });

    return (
        <group ref={groupRef}>
            <group ref={bodyRef} position={[0, 2.3, 0]}>
                <group position={[0, 1.7, 0]}>
                    <Sphere ref={headRef} args={[0.5]} position={[0, 0, 0]} castShadow receiveShadow>
                        <meshStandardMaterial color="#ffccaa" roughness={0.6} />
                        <Eyes />
                        <Sphere args={[0.52]} position={[0, 0.1, -0.1]} scale={[1, 0.8, 0.8]} castShadow>
                            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
                        </Sphere>
                        <group position={[0, 0.1, 0.4]}>
                            <Torus args={[0.12, 0.02, 16, 32]} position={[-0.15, 0, 0]}>
                                <meshStandardMaterial color="#333" roughness={0.2} metalness={0.5} />
                            </Torus>
                            <Torus args={[0.12, 0.02, 16, 32]} position={[0.15, 0, 0]}>
                                <meshStandardMaterial color="#333" roughness={0.2} metalness={0.5} />
                            </Torus>
                            <Box args={[0.1, 0.02, 0.02]} position={[0, 0, 0]}>
                                <meshStandardMaterial color="#333" />
                            </Box>
                        </group>
                    </Sphere>
                </group>
                <group>
                    <Cylinder args={[0.55, 0.6, 2.2]} position={[0, 0, 0]} castShadow receiveShadow>
                        <meshStandardMaterial color="white" roughness={0.5} />
                    </Cylinder>
                    <Box args={[0.15, 1.5, 0.05]} position={[0, 0.2, 0.6]} castShadow>
                         <meshStandardMaterial color="#1565c0" roughness={0.6} />
                    </Box>
                    <Cone args={[0.15, 0.2, 4]} position={[0, -0.65, 0.6]} rotation={[0, 0, Math.PI]} castShadow>
                         <meshStandardMaterial color="#1565c0" roughness={0.6} />
                    </Cone>
                </group>
                <group ref={leftArmGroupRef} position={[-0.7, 0.8, 0]} rotation={[0, 0, 0.2]}>
                    <group position={[0, -0.9, 0]}> 
                        <Cylinder args={[0.14, 0.12, 1.8]} position={[0, 0, 0]} castShadow>
                            <meshStandardMaterial color="white" roughness={0.5} />
                        </Cylinder>
                        <Sphere args={[0.15]} position={[0, -1.0, 0]} castShadow>
                            <meshStandardMaterial color="#ffccaa" roughness={0.6} />
                        </Sphere>
                    </group>
                </group>
                <group ref={rightArmGroupRef} position={[0.7, 0.8, 0]} rotation={[0, 0, -0.2]}>
                     <group position={[0, -0.9, 0]}>
                         <Cylinder args={[0.14, 0.12, 1.8]} position={[0, 0, 0]} castShadow>
                            <meshStandardMaterial color="white" roughness={0.5} />
                         </Cylinder>
                         <Sphere args={[0.15]} position={[0, -1.0, 0]} castShadow>
                            <meshStandardMaterial color="#ffccaa" roughness={0.6} />
                         </Sphere>
                    </group>
                </group>
            </group>
            <group ref={leftLegGroupRef} position={[-0.3, 1.2, 0]}>
                <group position={[0, -1, 0]}>
                    <Cylinder args={[0.18, 0.15, 2.0]} position={[0, 0, 0]} castShadow>
                         <meshStandardMaterial color="#212121" roughness={0.8} />
                    </Cylinder>
                    <Box args={[0.25, 0.1, 0.4]} position={[0, -1, 0.1]} castShadow>
                         <meshStandardMaterial color="#111" roughness={0.4} />
                    </Box>
                </group>
            </group>
            <group ref={rightLegGroupRef} position={[0.3, 1.2, 0]}>
                <group position={[0, -1, 0]}>
                    <Cylinder args={[0.18, 0.15, 2.0]} position={[0, 0, 0]} castShadow>
                        <meshStandardMaterial color="#212121" roughness={0.8} />
                    </Cylinder>
                    <Box args={[0.25, 0.1, 0.4]} position={[0, -1, 0.1]} castShadow>
                        <meshStandardMaterial color="#111" roughness={0.4} />
                    </Box>
                </group>
            </group>
        </group>
    )
}

const ChildVisuals = ({ leftLegRef, rightLegRef, headRef }: any) => {
    return (
        <group>
             <Sphere ref={headRef} args={[0.5]} position={[0, 3.2, 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#ffccaa" roughness={0.6} />
                <Eyes />
                 <group position={[0, 0, 0.45]}>
                    <Sphere args={[0.015]} position={[-0.15, 0, 0]}>
                        <meshBasicMaterial color="#d88" />
                    </Sphere>
                    <Sphere args={[0.015]} position={[-0.12, -0.05, 0]}>
                        <meshBasicMaterial color="#d88" />
                    </Sphere>
                    <Sphere args={[0.015]} position={[0.15, 0, 0]}>
                        <meshBasicMaterial color="#d88" />
                    </Sphere>
                    <Sphere args={[0.015]} position={[0.12, -0.05, 0]}>
                        <meshBasicMaterial color="#d88" />
                    </Sphere>
                 </group>
                 <mesh position={[0, -0.15, 0.38]} rotation={[0.2, 0, 0]}>
                    <torusGeometry args={[0.1, 0.02, 8, 16, Math.PI]} />
                    <meshStandardMaterial color="#d88" />
                 </mesh>
                <Sphere args={[0.52]} position={[0, 0.2, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#d32f2f" roughness={0.7} />
                </Sphere>
                <Box args={[0.6, 0.1, 0.4]} position={[0, 0.2, 0.4]} castShadow>
                    <meshStandardMaterial color="#d32f2f" roughness={0.7} />
                </Box>
                <Sphere args={[0.08]} position={[0, 0.72, 0]}>
                     <meshStandardMaterial color="#b71c1c" />
                </Sphere>
            </Sphere>

            <group position={[0, 2, 0]}>
                <Cylinder args={[0.5, 0.5, 1.5]} position={[0, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#1976d2" roughness={0.8} />
                    <Torus args={[0.51, 0.05, 16, 32]} position={[0, 0.2, 0]} rotation={[Math.PI/2, 0, 0]}>
                         <meshStandardMaterial color="white" roughness={0.8} />
                    </Torus>
                    <Torus args={[0.51, 0.05, 16, 32]} position={[0, -0.3, 0]} rotation={[Math.PI/2, 0, 0]}>
                         <meshStandardMaterial color="white" roughness={0.8} />
                    </Torus>
                </Cylinder>
                <Sphere args={[0.15]} position={[0, 0.3, 0.5]} scale={[1,1,0.2]}>
                     <meshStandardMaterial color="#fbc02d" roughness={0.4} />
                </Sphere>
            </group>
            
            <group position={[0, 2.2, -0.4]}>
                <Box args={[0.8, 1.0, 0.5]} castShadow receiveShadow>
                    <meshStandardMaterial color="#fbc02d" roughness={0.6} />
                </Box>
                <Box args={[0.6, 0.4, 0.2]} position={[0, -0.1, 0.3]} castShadow>
                     <meshStandardMaterial color="#f9a825" roughness={0.6} />
                </Box>
                <Torus args={[0.3, 0.05, 16, 32]} position={[-0.2, 0, 0.3]} rotation={[0, Math.PI/2, 0]}>
                    <meshStandardMaterial color="#333" roughness={0.9} />
                </Torus>
                <Torus args={[0.3, 0.05, 16, 32]} position={[0.2, 0, 0.3]} rotation={[0, Math.PI/2, 0]}>
                     <meshStandardMaterial color="#333" roughness={0.9} />
                </Torus>
            </group>

            <group position={[-0.6, 2, 0]} rotation={[0, 0, 0.3]}>
                <Cylinder args={[0.12, 0.1, 1.2]} position={[0, 0, 0]} castShadow>
                     <meshStandardMaterial color="#ffccaa" roughness={0.6} />
                </Cylinder>
                <Cylinder args={[0.14, 0.14, 0.3]} position={[0, 0.45, 0]} castShadow>
                    <meshStandardMaterial color="#1976d2" roughness={0.8} />
                </Cylinder>
            </group>
            <group position={[0.6, 2, 0]} rotation={[0, 0, -0.3]}>
                <Cylinder args={[0.12, 0.1, 1.2]} position={[0, 0, 0]} castShadow>
                     <meshStandardMaterial color="#ffccaa" roughness={0.6} />
                </Cylinder>
                <Cylinder args={[0.14, 0.14, 0.3]} position={[0, 0.45, 0]} castShadow>
                     <meshStandardMaterial color="#1976d2" roughness={0.8} />
                </Cylinder>
            </group>

            <group ref={leftLegRef} position={[-0.25, 1.2, 0]}>
                <Cylinder args={[0.18, 0.18, 0.6]} position={[0, -0.1, 0]} castShadow>
                    <meshStandardMaterial color="#0d47a1" roughness={0.8} />
                </Cylinder>
                <Cylinder args={[0.12, 0.1, 1.0]} position={[0, -0.7, 0]} castShadow>
                    <meshStandardMaterial color="#ffccaa" roughness={0.6} />
                </Cylinder>
                <group position={[0, -1.2, 0.1]}>
                    <Box args={[0.2, 0.15, 0.35]} castShadow>
                         <meshStandardMaterial color="white" roughness={0.5} />
                    </Box>
                    <Box args={[0.22, 0.05, 0.36]} position={[0, -0.08, 0]}>
                         <meshStandardMaterial color="#333" roughness={0.9} />
                    </Box>
                    <Box args={[0.02, 0.02, 0.2]} position={[0, 0.08, 0]} rotation={[0, 0.2, 0]}>
                        <meshStandardMaterial color="#ccc" roughness={0.8} />
                    </Box>
                </group>
            </group>
            <group ref={rightLegRef} position={[0.25, 1.2, 0]}>
                <Cylinder args={[0.18, 0.18, 0.6]} position={[0, -0.1, 0]} castShadow>
                     <meshStandardMaterial color="#0d47a1" roughness={0.8} />
                </Cylinder>
                <Cylinder args={[0.12, 0.1, 1.0]} position={[0, -0.7, 0]} castShadow>
                     <meshStandardMaterial color="#ffccaa" roughness={0.6} />
                </Cylinder>
                 <group position={[0, -1.2, 0.1]}>
                    <Box args={[0.2, 0.15, 0.35]} castShadow>
                        <meshStandardMaterial color="white" roughness={0.5} />
                    </Box>
                    <Box args={[0.22, 0.05, 0.36]} position={[0, -0.08, 0]}>
                         <meshStandardMaterial color="#333" roughness={0.9} />
                    </Box>
                     <Box args={[0.02, 0.02, 0.2]} position={[0, 0.08, 0]} rotation={[0, 0.2, 0]}>
                         <meshStandardMaterial color="#ccc" roughness={0.8} />
                     </Box>
                </group>
            </group>
        </group>
    )
}

// --- Blood Suck Effect ---
const BloodSuckEffect = ({ targetRef, active }: { targetRef: React.RefObject<THREE.Mesh>, active: boolean }) => {
    const { camera } = useThree();
    const particleCount = 20; 
    
    // Create Refs and initial random offsets for particles
    const particles = useMemo(() => new Array(particleCount).fill(0).map(() => ({
        ref: React.createRef<THREE.Mesh>(),
        offset: Math.random() * Math.PI * 2,
        speed: 1.5 + Math.random() * 1.5,
        radiusOffset: Math.random() * 0.1
    })), []);

    useFrame((state, delta) => {
        if (!active || !targetRef.current) {
            // Hide particles if inactive
            particles.forEach(p => {
                if (p.ref.current) p.ref.current.scale.set(0,0,0);
            });
            return;
        }

        const targetWorldPos = new THREE.Vector3();
        targetRef.current.getWorldPosition(targetWorldPos);

        const camPos = camera.position.clone();
        // Target slightly below camera to simulate mouth position
        camPos.y -= 0.3; 

        // Compute basis for spiral around the path
        const dir = new THREE.Vector3().subVectors(camPos, targetWorldPos).normalize();
        let up = new THREE.Vector3(0, 1, 0);
        if (Math.abs(dir.dot(up)) > 0.9) up.set(0, 0, 1);
        const right = new THREE.Vector3().crossVectors(dir, up).normalize();
        const localUp = new THREE.Vector3().crossVectors(right, dir).normalize();

        particles.forEach((p, i) => {
            if (p.ref.current) {
                // Determine a "progress" based on time to animate flow
                const tRaw = (state.clock.elapsedTime * p.speed + p.offset);
                const t = tRaw % 1; // 0 (Source) -> 1 (Mouth)
                
                // Spiral Math
                const spiralRadius = (0.2 + p.radiusOffset) * (1 - t); // Tighter as it gets closer
                const angle = tRaw * 10;
                
                // Lerp position center
                const currentPos = new THREE.Vector3().lerpVectors(targetWorldPos, camPos, t);
                
                // Add spiral offset
                const xOff = Math.cos(angle) * spiralRadius;
                const yOff = Math.sin(angle) * spiralRadius;
                currentPos.addScaledVector(right, xOff);
                currentPos.addScaledVector(localUp, yOff);

                p.ref.current.position.copy(currentPos);
                
                // Scale based on proximity
                const scale = Math.sin(t * Math.PI) * 0.05; 
                p.ref.current.scale.set(scale, scale, scale);
            }
        });
    });

    return (
        <group>
            {particles.map((p, i) => (
                <Sphere key={i} ref={p.ref} args={[1, 4, 4]}>
                    <meshBasicMaterial color="#d32f2f" transparent opacity={0.8} />
                </Sphere>
            ))}
        </group>
    );
};

// --- Sensitivity Range Visual ---

const SensitivityIndicator = ({ radius, active }: { radius: number, active: boolean }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    
    useFrame((state) => {
        if(meshRef.current) {
            meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
            const material = meshRef.current.material as THREE.MeshBasicMaterial;
            material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
        }
        if(ringRef.current) {
            const material = ringRef.current.material as THREE.MeshBasicMaterial;
            material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        }
    });

    if (!active) return null;

    return (
        <group>
            {/* Ground Ring */}
            <mesh ref={ringRef} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.05, 0]}>
                <ringGeometry args={[radius - 0.1, radius, 64]} />
                <meshBasicMaterial color="#ff5252" transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>
            {/* Faint Dome/Sphere to show volume */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[radius, 32, 32]} />
                <meshBasicMaterial color="#ff5252" transparent opacity={0.1} wireframe />
            </mesh>
        </group>
    )
}

// --- Main Component ---

const Enemy = () => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  
  const { camera } = useThree();
  const [inRange, setInRange] = useState(false);
  const [canSuckState, setCanSuckState] = useState(false); // Track if we can specifically suck for UI
  
  const { 
      increaseAlert, decreaseAlert, suckBlood,
      enemyType, decoyActive, decoyPosition, phase, isSucking, gameOverReason, alertLevel, skillInvis
  } = useGameStore();
  
  const stats = ENEMY_STATS[enemyType];

  // AI Logic Refs
  const currentPos = useRef(new THREE.Vector3(0, -2, -5));
  const targetPos = useRef(new THREE.Vector3(0, -2, -5));
  const aiState = useRef<'IDLE' | 'MOVING'>('IDLE');
  const timer = useRef(0);

  // Pick a random spot in the room (assumed approx 16x16 playable area centered at 0,0)
  const pickNewTarget = () => {
      const x = (Math.random() * 12) - 6; // Range -6 to 6
      const z = (Math.random() * 12) - 6;
      targetPos.current.set(x, -2, z);
      
      // Calculate time needed to turn and prep, or just start moving
      aiState.current = 'MOVING';
  };

  useFrame((state, delta) => {
    // Keep rendering if game over to show the slap, but stop movement logic unless it's part of the end sequence
    if (phase !== 'PLAYING' && phase !== 'GAME_OVER') return;
    if (!groupRef.current) return;

    const isGameOverSlap = phase === 'GAME_OVER' && gameOverReason === 'slapped';
    if (isGameOverSlap) {
        // Look at player during slap
        const lookTarget = new THREE.Vector3(camera.position.x, groupRef.current.position.y, camera.position.z);
        groupRef.current.lookAt(lookTarget);
        return; 
    }
    
    // Stop processing AI movement if game over (time out)
    if (phase !== 'PLAYING') return;

    // --- AI MOVEMENT LOGIC ---
    // If decoy is active, override target
    if (decoyActive && decoyPosition) {
        targetPos.current.set(decoyPosition[0], -2, decoyPosition[2]);
        aiState.current = 'MOVING';
    }

    if (aiState.current === 'IDLE') {
        timer.current -= delta;
        if (timer.current <= 0) {
            pickNewTarget();
        }
        
        // Idle animation: breathing handled in visual component now
        
    } else if (aiState.current === 'MOVING') {
        const direction = new THREE.Vector3().subVectors(targetPos.current, currentPos.current);
        const distance = direction.length();
        
        if (distance < 0.2) {
            // Reached target
            if (!decoyActive) {
                aiState.current = 'IDLE';
                const waitTime = stats.idleTimeRange[0] + Math.random() * (stats.idleTimeRange[1] - stats.idleTimeRange[0]);
                timer.current = waitTime;
            } else {
                 // Reached decoy, stay there but look confused
                 timer.current = 1; // re-check frequently
            }
        } else {
            // Move
            direction.normalize();
            const moveStep = direction.multiplyScalar(stats.moveSpeed * delta);
            currentPos.current.add(moveStep);
            groupRef.current.position.copy(currentPos.current);

            // Rotate towards target
            const lookTarget = new THREE.Vector3(targetPos.current.x, groupRef.current.position.y, targetPos.current.z);
            groupRef.current.lookAt(lookTarget);

            // Walk Animation Logic: handled in visual components mostly
            if (enemyType === EnemyType.CHILD) {
                const walkSpeed = stats.moveSpeed * 5;
                if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(state.clock.elapsedTime * walkSpeed) * 0.5;
                if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(state.clock.elapsedTime * walkSpeed + Math.PI) * 0.5;
                groupRef.current.position.y = -2 + Math.abs(Math.sin(state.clock.elapsedTime * walkSpeed)) * 0.1;
            }
        }
    }

    // --- GAMEPLAY LOGIC (Sucking & Alert & Detection) ---
    
    // Determine actual world position of the "head" / weak point
    let suckTargetPos = new THREE.Vector3();
    let headWorldPos = new THREE.Vector3();
    let headWorldQuat = new THREE.Quaternion();

    if (headRef.current) {
        // FORCE MATRIX UPDATE before reading to ensure sync with current frame's movement
        headRef.current.updateMatrixWorld(true);
        headRef.current.getWorldPosition(headWorldPos);
        headRef.current.getWorldQuaternion(headWorldQuat);
        suckTargetPos.copy(headWorldPos);
    } else {
        suckTargetPos.copy(groupRef.current.position).add(new THREE.Vector3(0, 3, 0));
        headWorldPos.copy(suckTargetPos);
        groupRef.current.getWorldQuaternion(headWorldQuat);
    }

    const distToPlayer = camera.position.distanceTo(suckTargetPos);
    const scaleAdjustedDist = SUCK_DISTANCE * stats.visualScale;
    
    // Detection (Line of Sight + Hearing)
    if (!skillInvis.isActive) {
        const playerDir = new THREE.Vector3().subVectors(camera.position, headWorldPos).normalize();
        const headForward = new THREE.Vector3(0, 0, 1).applyQuaternion(headWorldQuat).normalize();
        
        const dot = headForward.dot(playerDir);
        const inVisualRange = distToPlayer < DETECTION_DISTANCE_MAX;
        const inHearingRange = distToPlayer < HEARING_DISTANCE;
        
        let isDetected = false;
        let detectionSpeed = 0;

        if (dot > DETECTION_ANGLE && inVisualRange) {
             isDetected = true;
             const distFactor = 1 - (distToPlayer / DETECTION_DISTANCE_MAX); 
             detectionSpeed = DETECTION_RATE * (0.5 + distFactor);
        } else if (inHearingRange) {
             isDetected = true;
             detectionSpeed = DETECTION_RATE * 0.5;
        }

        if (isDetected) {
            increaseAlert(detectionSpeed * delta);
        } else {
            decreaseAlert(DETECTION_DECAY * delta);
        }
    } else {
         decreaseAlert(DETECTION_DECAY * delta);
    }

    // Sucking Logic
    const inDistance = distToPlayer < scaleAdjustedDist;
    const canSuck = inDistance; 

    setInRange(inDistance);
    setCanSuckState(canSuck);

    if (isSucking && canSuck) {
        increaseAlert(stats.alertRate * delta);
        suckBlood(15 * delta);
        
        // Shake head/body when being sucked
        if (headRef.current) {
             headRef.current.position.x = Math.sin(state.clock.elapsedTime * 30) * 0.03;
        }
    } else {
        decreaseAlert(stats.decayRate * delta);
        if (headRef.current) headRef.current.position.x = 0;
    }
  });

  // Calculate distance specifically for visual indicator toggle (slightly larger range than actual sensitivity)
  const distForVisual = groupRef.current ? camera.position.distanceTo(groupRef.current.position) : 999;
  const showSensitivity = distForVisual < HUMAN_SENSITIVITY_DISTANCE * 2.5 && phase === 'PLAYING';

  // Render correct visual based on type
  const renderVisuals = () => {
      switch (enemyType) {
          case EnemyType.ELDER:
              return <ElderVisuals 
                  isMoving={aiState.current === 'MOVING'} 
                  isAttacking={gameOverReason === 'slapped'} 
                  headRef={headRef} 
              />;
          case EnemyType.CHILD:
              return <ChildVisuals leftLegRef={leftLegRef} rightLegRef={rightLegRef} headRef={headRef} />;
          case EnemyType.WORKER:
              return <WorkerVisuals 
                    isMoving={aiState.current === 'MOVING'} 
                    isAttacking={gameOverReason === 'slapped'} 
                    headRef={headRef} 
                />;
          default:
              return <ElderVisuals isMoving={aiState.current === 'MOVING'} isAttacking={false} headRef={headRef} />;
      }
  };

  return (
    <group ref={groupRef} position={[0, -2, -5]} scale={[stats.visualScale, stats.visualScale, stats.visualScale]}>
        {renderVisuals()}
        <BloodSuckEffect targetRef={headRef} active={isSucking && canSuckState} />
        <SensitivityIndicator radius={HUMAN_SENSITIVITY_DISTANCE} active={showSensitivity} />

        {/* Helper UI */}
        {inRange && phase === 'PLAYING' && (
            <Html position={[0, 5.5, 0]} center>
                <div className={`
                    px-3 py-1 rounded-full font-bold text-sm 
                    whitespace-nowrap border-2 border-white shadow-lg backdrop-blur-sm transition-all
                    ${isSucking ? 'scale-125 bg-red-800 text-white' : 'bg-red-600/90 text-white animate-pulse'}
                `}>
                    {isSucking ? '吸血中!!!' : '按住左鍵吸血!'}
                </div>
            </Html>
        )}
    </group>
  );
};

export default Enemy;