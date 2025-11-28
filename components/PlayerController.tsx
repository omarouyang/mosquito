
import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { DeviceOrientationControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store';
import { MOVEMENT_SPEED, SKILL_SPEED_MULTIPLIER } from '../constants';

const PlayerController = () => {
  const { camera, scene, gl } = useThree();
  const setSucking = useGameStore((state) => state.setSucking);
  const activateInvis = useGameStore((state) => state.activateInvis);
  const placeDecoy = useGameStore((state) => state.placeDecoy);
  const activateSpeed = useGameStore((state) => state.activateSpeed);
  const skillSpeed = useGameStore((state) => state.skillSpeed);
  const gyroEnabled = useGameStore((state) => state.gyroEnabled);
  
  const phase = useGameStore((state) => state.phase);
  
  const moveForward = useRef(false);
  const moveBackward = useRef(false);
  const moveLeft = useRef(false);
  const moveRight = useRef(false);
  const moveUp = useRef(false);
  const moveDown = useRef(false);

  // Manual Camera Control State (Euler YXZ prevents gimbal lock)
  const lookEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));

  // --- Collision & Feedback Refs ---
  const raycaster = useRef(new THREE.Raycaster());
  const lastCollisionTime = useRef(0);
  const shakeIntensity = useRef(0);
  const collisionCooldown = 0.5;

  // --- Audio Refs ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const suckOscRef = useRef<OscillatorNode | null>(null);
  const suckGainRef = useRef<GainNode | null>(null);
  const suckLfoRef = useRef<OscillatorNode | null>(null);

  // --- Touch Look Refs ---
  const touchLookRef = useRef({ 
      active: false, 
      lastX: 0, 
      lastY: 0, 
      id: -1 
  });

  // Initialize Audio & Camera Setup
  useEffect(() => {
    // Force camera order and up vector
    camera.rotation.order = 'YXZ';
    camera.up.set(0, 1, 0);
    lookEuler.current.setFromQuaternion(camera.quaternion);
    lookEuler.current.reorder('YXZ');

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const mainOsc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      mainOsc.type = 'sawtooth'; 
      mainOsc.frequency.value = 450; 

      mainOsc.connect(gainNode);
      gainNode.connect(ctx.destination);
      gainNode.gain.value = 0; // Start silent

      mainOsc.start();
      
      oscillatorRef.current = mainOsc;
      gainNodeRef.current = gainNode;

    } catch (e) {
      console.error("Audio init error:", e);
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [camera]);

  // Sync back when gyro is disabled to prevent jumps
  useEffect(() => {
    if (!gyroEnabled) {
        lookEuler.current.setFromQuaternion(camera.quaternion);
        lookEuler.current.z = 0; // Flatten roll
        lookEuler.current.reorder('YXZ');
    }
  }, [gyroEnabled, camera]);

  // Unlock cursor on Game Over
  useEffect(() => {
    if (phase !== 'PLAYING') {
       if (document.pointerLockElement === gl.domElement) {
           document.exitPointerLock();
       }
    }
  }, [phase, gl]);

  const playCollisionSound = () => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state === 'suspended') return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

    gain.connect(ctx.destination);
    osc.connect(gain);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  };

  const playSuckSound = (type: 'start' | 'end') => {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'suspended') return;
      const now = ctx.currentTime;

      if (type === 'start') {
          if (suckOscRef.current) return;

          const pierceOsc = ctx.createOscillator();
          const pierceGain = ctx.createGain();
          pierceOsc.connect(pierceGain);
          pierceGain.connect(ctx.destination);

          pierceOsc.frequency.setValueAtTime(800, now);
          pierceOsc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
          pierceGain.gain.setValueAtTime(0.3, now);
          pierceGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

          pierceOsc.start(now);
          pierceOsc.stop(now + 0.1);

          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(150, now);

          lfo.type = 'sine';
          lfo.frequency.setValueAtTime(8, now); 
          lfoGain.gain.setValueAtTime(20, now); 

          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);

          osc.connect(gain);
          gain.connect(ctx.destination);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.2, now + 0.1);

          osc.start(now);
          lfo.start(now);

          suckOscRef.current = osc;
          suckGainRef.current = gain;
          suckLfoRef.current = lfo;

      } else {
          if (suckOscRef.current && suckGainRef.current && suckLfoRef.current) {
              const stopTime = now + 0.15;
              suckGainRef.current.gain.setValueAtTime(suckGainRef.current.gain.value, now);
              suckGainRef.current.gain.linearRampToValueAtTime(0, stopTime);
              suckOscRef.current.stop(stopTime);
              suckLfoRef.current.stop(stopTime);
              suckOscRef.current = null;
              suckGainRef.current = null;
              suckLfoRef.current = null;
          }

          const popOsc = ctx.createOscillator();
          const popGain = ctx.createGain();
          popOsc.connect(popGain);
          popGain.connect(ctx.destination);

          popOsc.frequency.setValueAtTime(200, now);
          popOsc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
          popGain.gain.setValueAtTime(0.2, now);
          popGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

          popOsc.start(now);
          popOsc.stop(now + 0.1);
      }
  };

  // Setup Controls (Mouse & Keyboard)
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
        if (gyroEnabled || phase !== 'PLAYING') return;
        if (document.pointerLockElement !== gl.domElement) return;

        const sensitivity = 0.002;
        lookEuler.current.y -= e.movementX * sensitivity;
        lookEuler.current.x -= e.movementY * sensitivity;

        // Clamp Pitch (Prevent flipping over)
        lookEuler.current.x = Math.max(0.1, Math.min(Math.PI - 0.1, lookEuler.current.x));
        // Force Roll to 0 (Prevent tilting)
        lookEuler.current.z = 0;
    };

    const onMouseDown = () => {
        if (phase === 'PLAYING') {
            // Request lock if clicking on canvas and not using gyro
            if (!gyroEnabled && document.pointerLockElement !== gl.domElement) {
                gl.domElement.requestPointerLock();
            }
            setSucking(true);
            playSuckSound('start');
        }
    };

    const onMouseUp = () => {
        setSucking(false);
        playSuckSound('end');
    };

    // Keyboard Events
    const handleKeyDown = (event: KeyboardEvent) => {
      if (phase !== 'PLAYING') return;
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward.current = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft.current = true; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward.current = true; break;
        case 'ArrowRight':
        case 'KeyD': moveRight.current = true; break;
        case 'Space': moveUp.current = true; break;
        case 'ControlLeft': 
        case 'ControlRight': moveDown.current = true; break;
        case 'ShiftLeft': activateSpeed(); break;
        case 'KeyF': activateInvis(); break;
        case 'KeyG': placeDecoy([camera.position.x, camera.position.y, camera.position.z]); break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward.current = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft.current = false; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward.current = false; break;
        case 'ArrowRight':
        case 'KeyD': moveRight.current = false; break;
        case 'Space': moveUp.current = false; break;
        case 'ControlLeft': 
        case 'ControlRight': moveDown.current = false; break;
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        if (suckOscRef.current) {
            try { suckOscRef.current.stop(); } catch(e) {}
        }
    };
  }, [setSucking, activateInvis, activateSpeed, placeDecoy, camera, phase, gl, gyroEnabled]);

  // Touch Logic
  useEffect(() => {
    const domElement = gl.domElement;

    const onTouchStart = (e: TouchEvent) => {
        if (gyroEnabled) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            // Right side of screen for look
            if (t.clientX > window.innerWidth / 2) {
                touchLookRef.current.active = true;
                touchLookRef.current.lastX = t.clientX;
                touchLookRef.current.lastY = t.clientY;
                touchLookRef.current.id = t.identifier;
                
                if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
                    audioCtxRef.current.resume();
                }
                break;
            }
        }
    };

    const onTouchMove = (e: TouchEvent) => {
        if (!touchLookRef.current.active || gyroEnabled) return;
        
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === touchLookRef.current.id) {
                const deltaX = t.clientX - touchLookRef.current.lastX;
                const deltaY = t.clientY - touchLookRef.current.lastY;
                
                touchLookRef.current.lastX = t.clientX;
                touchLookRef.current.lastY = t.clientY;

                const sensitivity = 0.005;
                lookEuler.current.y -= deltaX * sensitivity;
                lookEuler.current.x -= deltaY * sensitivity;

                // Clamp Pitch
                lookEuler.current.x = Math.max(0.1, Math.min(Math.PI - 0.1, lookEuler.current.x));
                // Force Roll 0
                lookEuler.current.z = 0;
                break;
            }
        }
    };

    const onTouchEnd = (e: TouchEvent) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchLookRef.current.id) {
                touchLookRef.current.active = false;
                break;
            }
        }
    };

    domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    domElement.addEventListener('touchend', onTouchEnd);

    return () => {
      domElement.removeEventListener('touchstart', onTouchStart);
      domElement.removeEventListener('touchmove', onTouchMove);
      domElement.removeEventListener('touchend', onTouchEnd);
    };
  }, [gl, gyroEnabled]);

  // Movement & Audio Update Logic
  useFrame((state, delta) => {
    if (phase !== 'PLAYING') {
      if (gainNodeRef.current) gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current?.currentTime || 0, 0.1);
      if (suckOscRef.current) playSuckSound('end');
      return;
    }

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
    }

    const { mobileInput } = useGameStore.getState();
    let currentSpeed = MOVEMENT_SPEED;
    if (skillSpeed.isActive) {
        currentSpeed *= SKILL_SPEED_MULTIPLIER;
    }

    // --- Input Vectors ---
    const localInputX = (moveRight.current ? 1 : 0) - (moveLeft.current ? 1 : 0) + mobileInput.move.x;
    const localInputZ = (moveBackward.current ? 1 : 0) - (moveForward.current ? 1 : 0) + mobileInput.move.y;
    const globalInputY = (moveUp.current ? 1 : 0) - (moveDown.current ? 1 : 0) + mobileInput.vertical;

    const moveVector = new THREE.Vector3(localInputX, globalInputY, localInputZ);
    if (moveVector.lengthSq() > 1) {
        moveVector.normalize();
    }
    moveVector.multiplyScalar(currentSpeed * delta);

    // Apply Movement
    if (moveVector.x !== 0 || moveVector.z !== 0) {
        camera.translateX(moveVector.x);
        camera.translateZ(moveVector.z);
    }
    if (moveVector.y !== 0) {
        camera.position.y += moveVector.y;
    }
    
    const isMoving = moveVector.lengthSq() > 0;

    // --- Collision Detection ---
    let collisionOccurred = false;
    if (isMoving) {
        const rayDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        raycaster.current.set(camera.position, rayDir);
        raycaster.current.far = 1.0; 

        const intersects = raycaster.current.intersectObjects(scene.children, true);
        const validHits = intersects.filter(hit => hit.distance < 0.6); 

        if (validHits.length > 0) {
            collisionOccurred = true;
        }
    }

    // Room Boundaries
    let wallHit = false;
    if (camera.position.y < 0.2) { camera.position.y = 0.2; wallHit = true; }
    if (camera.position.y > 7.8) { camera.position.y = 7.8; wallHit = true; }
    if (camera.position.x < -9.5) { camera.position.x = -9.5; wallHit = true; }
    if (camera.position.x > 9.5) { camera.position.x = 9.5; wallHit = true; }
    if (camera.position.z < -9.5) { camera.position.z = -9.5; wallHit = true; }
    if (camera.position.z > 9.5) { camera.position.z = 9.5; wallHit = true; }

    // Collision Feedback
    if ((collisionOccurred || (wallHit && isMoving))) {
        const now = state.clock.elapsedTime;
        if (now - lastCollisionTime.current > collisionCooldown) {
            playCollisionSound();
            shakeIntensity.current = 0.8; 
            lastCollisionTime.current = now;
            camera.translateZ(0.2); 
        }
    }

    // --- Camera Rotation & Shake ---
    if (!gyroEnabled) {
        // Apply controlled look direction
        camera.rotation.copy(lookEuler.current);

        // Apply additive shake (temporary Z rotation)
        if (shakeIntensity.current > 0.01) {
            const noise = (Math.random() - 0.5) * shakeIntensity.current * 0.2;
            camera.rotation.z += noise; 
            
            camera.position.x += (Math.random() - 0.5) * shakeIntensity.current * 0.05;
            camera.position.y += (Math.random() - 0.5) * shakeIntensity.current * 0.05;
            
            shakeIntensity.current = THREE.MathUtils.lerp(shakeIntensity.current, 0, 0.1);
        }
    } else {
        // Gyro Mode: Just apply position shake
        if (shakeIntensity.current > 0.01) {
            camera.position.x += (Math.random() - 0.5) * shakeIntensity.current * 0.05;
            camera.position.y += (Math.random() - 0.5) * shakeIntensity.current * 0.05;
            shakeIntensity.current = THREE.MathUtils.lerp(shakeIntensity.current, 0, 0.1);
        }
    }

    if (!collisionOccurred) {
        camera.position.y += Math.sin(state.clock.elapsedTime * 10) * 0.005; // Hover
    }

    // Audio Update
    if (oscillatorRef.current && gainNodeRef.current && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;
        let targetFreq = 380;
        let targetVol = 0.015;

        if (isMoving) { targetFreq = 580; targetVol = 0.1; }
        if (skillSpeed.isActive) {
            targetFreq = isMoving ? 850 : 450;
            targetVol = isMoving ? 0.3 : 0.03;
        }
        if (collisionOccurred || (wallHit && isMoving)) {
             targetFreq = 150 + Math.random() * 100;
             targetVol = 0.05;
        }

        oscillatorRef.current.frequency.setTargetAtTime(targetFreq, now, 0.1);
        gainNodeRef.current.gain.setTargetAtTime(targetVol, now, 0.1);
    }
  });

  return (
    <>
        {/* Gyro Control */}
        {gyroEnabled && <DeviceOrientationControls camera={camera} />}
    </>
  );
};

export default PlayerController;
