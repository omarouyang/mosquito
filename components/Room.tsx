
import React, { useMemo } from 'react';
import { Box, Cylinder, Sphere, Torus, Cone } from '@react-three/drei';
import { useGameStore } from '../store';
import { LevelType } from '../types';

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

// --- Reusable Props & Furniture Parts ---

const TableLeg = ({ position, height = 2, color = "#3e2723" }: { position: [number, number, number], height?: number, color?: string }) => (
    <Cylinder args={[0.08, 0.08, height, 8]} position={position} material-color={color} castShadow />
);

const DrawerHandle = ({ position }: { position: [number, number, number] }) => (
    <Box args={[0.3, 0.05, 0.05]} position={position} material-color="#ffd700" />
);

// --- Detailed Prop Components ---

const BookRow = ({ position, width, colorBase }: { position: [number, number, number], width: number, colorBase: string[] }) => {
    // Generate random books
    const books = useMemo(() => {
        const count = Math.floor(width / 0.15);
        return new Array(count).fill(0).map((_, i) => ({
            height: 0.5 + Math.random() * 0.3,
            thickness: 0.05 + Math.random() * 0.1,
            color: colorBase[Math.floor(Math.random() * colorBase.length)],
            lean: (Math.random() - 0.5) * 0.2
        }));
    }, [width, colorBase]);

    let currentX = -width / 2;

    return (
        <group position={position}>
            {books.map((book, i) => {
                currentX += book.thickness;
                if (currentX > width / 2) return null;
                return (
                    <Box 
                        key={i} 
                        args={[book.thickness, book.height, 0.6]} 
                        position={[currentX, book.height / 2, 0]} 
                        rotation={[0, 0, book.lean]}
                        castShadow
                    >
                        <meshStandardMaterial color={book.color} roughness={0.6} />
                    </Box>
                )
            })}
        </group>
    )
}

const Plant = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
        {/* Pot */}
        <Cylinder args={[0.4, 0.3, 0.8, 16]} position={[0, 0.4, 0]} material-color="#e74c3c" castShadow />
        <Cylinder args={[0.35, 0.35, 0.1]} position={[0, 0.75, 0]} material-color="#5d4037" /> {/* Soil */}
        
        {/* Stalks & Leaves */}
        <group position={[0, 0.8, 0]}>
            <Cylinder args={[0.05, 0.05, 2]} position={[0, 1, 0]} material-color="#2e7d32" />
            
            {/* Leaves */}
            {[0, 1, 2, 3, 4].map((i) => (
                <group key={i} position={[0, 0.5 + i * 0.3, 0]} rotation={[0, i * 2, 0.5]}>
                    <Sphere args={[0.4, 8, 4]} position={[0.4, 0, 0]} scale={[1, 0.1, 0.5]}>
                         <meshStandardMaterial color="#4caf50" />
                    </Sphere>
                </group>
            ))}
        </group>
    </group>
);

const Lamp = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
        <Cylinder args={[0.2, 0.3, 0.1]} position={[0, 0.05, 0]} material-color="#212121" />
        <Cylinder args={[0.05, 0.05, 3]} position={[0, 1.5, 0]} material-color="#424242" />
        <Cone args={[0.6, 0.8, 32, 1, true]} position={[0, 3, 0]} material-color="#ffecb3">
             <pointLight color="#ffecb3" intensity={0.5} distance={5} decay={2} position={[0, -0.2, 0]} />
        </Cone>
        <Sphere args={[0.15]} position={[0, 2.8, 0]} material-color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
    </group>
);

const CeilingLight = ({ position, color = "#ffffff" }: { position: [number, number, number], color?: string }) => (
    <group position={position}>
        <Cylinder args={[0.1, 0.1, 0.5]} position={[0, 0.25, 0]} material-color="#ccc" />
        <Sphere args={[0.3]} position={[0, 0, 0]} material-color="white" emissive={color} emissiveIntensity={1} />
        <pointLight position={[0, -0.5, 0]} intensity={0.8} color={color} distance={10} decay={2} castShadow />
    </group>
);

// --- Room Types ---

const Bedroom = () => (
  <group>
    {/* -- BED AREA -- */}
    <group position={[0, -1.5, -5]}>
        {/* Frame */}
        <Box args={[5.5, 1, 7]} material-color="#3e2723" castShadow /> 
        {/* Mattress */}
        <Box args={[5, 0.8, 6.5]} position={[0, 0.3, 0]} material-color="#f5f5f5" />
        {/* Blanket (Messy) */}
        <group position={[0, 0.75, 1.5]}>
             <Box args={[5.2, 0.4, 3.5]} rotation={[0.05, 0, 0]} material-color="#5c6bc0" />
             {/* Fold/Mess */}
             <Box args={[2, 0.5, 2]} position={[1, 0.2, -1]} rotation={[0.1, 0.2, 0.1]} material-color="#5c6bc0" />
        </group>
        {/* Pillows */}
        <Box args={[1.8, 0.4, 1.2]} position={[-1.2, 0.9, -2.5]} rotation={[0.2, 0, 0.1]} material-color="#e8eaf6" />
        <Box args={[1.8, 0.4, 1.2]} position={[1.2, 0.9, -2.5]} rotation={[0.2, 0, -0.1]} material-color="#e8eaf6" />
    </group>
    
    {/* -- WARDROBE -- */}
    <group position={[-8, 2, -8]}>
        <Box args={[3.5, 8, 2]} material-color="#5d4037" castShadow />
        {/* Doors (Slightly Ajar) */}
        <Box args={[1.6, 7.8, 0.1]} position={[-0.85, 0, 1]} rotation={[0, 0.05, 0]} material-color="#4e342e" />
        <Box args={[1.6, 7.8, 0.1]} position={[0.85, 0, 1]} rotation={[0, -0.2, 0]} material-color="#4e342e" />
        {/* Clothes Hanger Bar inside (Visible through gap) */}
        <Cylinder args={[0.05, 0.05, 3]} position={[0, 2, 0]} rotation={[0, 0, Math.PI/2]} material-color="#aaa" />
    </group>

    {/* -- VANITY DESK -- */}
    <group position={[7, -0.5, -7]} rotation={[0, -0.5, 0]}>
        <Box args={[3, 0.1, 1.5]} material-color="white" castShadow />
        <TableLeg position={[-1.3, -1, -0.6]} height={2} color="white" />
        <TableLeg position={[1.3, -1, -0.6]} height={2} color="white" />
        <TableLeg position={[-1.3, -1, 0.6]} height={2} color="white" />
        <TableLeg position={[1.3, -1, 0.6]} height={2} color="white" />
        
        {/* Mirror */}
        <Box args={[2, 1.5, 0.1]} position={[0, 0.8, -0.6]} material-color="#ddd">
            <Box args={[1.8, 1.3, 0.05]} position={[0, 0, 0.05]} material-color="#e3f2fd" />
        </Box>
        
        {/* Cosmetics */}
        <Cylinder args={[0.05, 0.05, 0.2]} position={[0.5, 0.15, 0.2]} material-color="red" />
        <Box args={[0.1, 0.15, 0.1]} position={[0.7, 0.12, 0.3]} material-color="black" />
        
        {/* Chair */}
        <group position={[0, -0.8, 1.5]} rotation={[0, 0.2, 0]}>
            <Cylinder args={[0.6, 0.6, 0.2]} material-color="pink" />
            <Cylinder args={[0.1, 0.1, 1]} position={[0, -0.6, 0]} material-color="white" />
            <Cylinder args={[0.4, 0.4, 0.1]} position={[0, -1.1, 0]} material-color="white" />
        </group>
    </group>

    {/* -- BEDSIDE TABLE & DANGER -- */}
    <group position={[5, -1, -5]}>
        <Box args={[1.5, 1.5, 1.5]} material-color="#4e342e" castShadow />
        <DrawerHandle position={[0, 0.3, 0.8]} />
        <DrawerHandle position={[0, -0.3, 0.8]} />
        
        {/* Lamp */}
        <Cylinder args={[0.1, 0.15, 0.4]} position={[-0.3, 0.95, -0.3]} material-color="#333" />
        <Cone args={[0.4, 0.5, 16, 1, true]} position={[-0.3, 1.3, -0.3]} material-color="#ffcc80">
            <pointLight color="#ffcc80" intensity={0.8} distance={3} />
        </Cone>
        
        {/* HAZARD: Electric Swatter */}
        <group position={[0.4, 0.8, 0.2]} rotation={[Math.PI/2, 0, 0.5]}>
            <Box args={[0.8, 1, 0.05]} material-color="#222" /> {/* Net Frame */}
            <Box args={[0.7, 0.9, 0.02]} material-color="#ffeb3b" /> {/* Net */}
            <Cylinder args={[0.1, 0.1, 0.8]} position={[0, -0.8, 0]} material-color="#111" /> {/* Handle */}
            {/* Spark effect */}
            <pointLight color="blue" intensity={0.5} distance={0.5} position={[0, 0, 0.1]} />
        </group>
    </group>

    <CeilingLight position={[0, 7.5, 0]} color="#fff3e0" />
  </group>
);

const Kitchen = () => (
  <group>
    {/* -- COUNTERS L-SHAPE -- */}
    <group position={[0, -1, -9]}>
        <Box args={[20, 2, 2.5]} material-color="#eeeeee" receiveShadow />
        <Box args={[20, 0.1, 2.6]} position={[0, 1, 0]} material-color="#212121" /> {/* Black Granite Top */}
        {/* Cupboard Doors */}
        {[-8, -5, -2, 1, 4, 7].map(x => (
             <Box key={x} args={[2.8, 1.8, 0.1]} position={[x, 0, 1.3]} material-color="#e0e0e0" />
        ))}
    </group>
    <group position={[-9, -1, 0]}>
        <Box args={[2.5, 2, 16]} material-color="#eeeeee" receiveShadow />
        <Box args={[2.6, 0.1, 16]} position={[0, 1, 0]} material-color="#212121" />
    </group>
    
    {/* -- WALL CABINETS -- */}
    <group position={[0, 4.5, -9]}>
         <Box args={[12, 2.5, 1.5]} position={[4, 0, 0]} material-color="#f5f5f5" castShadow />
         {/* Doors */}
         {[0, 3, 6, 9].map(x => (
             <Box key={x} args={[2.8, 2.3, 0.1]} position={[x-0.2, 0, 0.8]} material-color="#ffffff" />
        ))}
    </group>

    {/* -- APPLIANCES -- */}
    
    {/* Fridge */}
    <group position={[-8, 2, -8]}>
         <Box args={[3.2, 8, 3.2]} material-color="#cfd8dc" castShadow /> {/* Silver Body */}
         <Box args={[0.1, 3, 0.1]} position={[1.2, 1.5, 1.7]} material-color="#90a4ae" /> {/* Handle Top */}
         <Box args={[0.1, 3, 0.1]} position={[1.2, -2.5, 1.7]} material-color="#90a4ae" /> {/* Handle Bottom */}
         <Box args={[3.3, 0.1, 3.3]} position={[0, -0.5, 0]} material-color="#b0bec5" /> {/* Divider */}
    </group>

    {/* Stove & Hood */}
    <group position={[2, -1, -8.5]}>
         {/* Stove Body */}
         <Box args={[2.5, 2.1, 2.5]} position={[0, 0, 0.5]} material-color="#cfd8dc" />
         {/* Burners */}
         <Cylinder args={[0.4, 0.4, 0.1]} position={[-0.6, 1.1, 0]} material-color="#212121" />
         <Cylinder args={[0.4, 0.4, 0.1]} position={[0.6, 1.1, 0]} material-color="#212121" />
         <Cylinder args={[0.4, 0.4, 0.1]} position={[-0.6, 1.1, 1.2]} material-color="#212121" />
         {/* HOT Burner */}
         <Cylinder args={[0.45, 0.45, 0.1]} position={[0.6, 1.1, 1.2]} material-color="#d32f2f">
            <pointLight color="#ff5722" intensity={1.5} distance={3} decay={2} position={[0, 0.2, 0]} />
         </Cylinder>
         
         {/* Pot with Stew */}
         <group position={[0.6, 1.4, 1.2]}>
            <Cylinder args={[0.35, 0.3, 0.6]} material-color="#37474f" />
            <Torus args={[0.35, 0.05, 16, 32]} position={[0, 0.3, 0]} rotation={[Math.PI/2, 0, 0]} material-color="#37474f" />
            <Sphere args={[0.3]} position={[0, 0.1, 0]} material-color="#ffab91" /> {/* Soup */}
            {/* Steam Particles */}
            <group position={[0, 0.8, 0]}>
                 <Sphere args={[0.1]} position={[0, 0, 0]} material-color="white" opacity={0.5} transparent />
                 <Sphere args={[0.15]} position={[0.1, 0.3, 0]} material-color="white" opacity={0.4} transparent />
                 <Sphere args={[0.08]} position={[-0.1, 0.5, 0]} material-color="white" opacity={0.3} transparent />
            </group>
         </group>

         {/* Range Hood */}
         <group position={[0, 5, 0.5]}>
             <Box args={[2.6, 0.5, 2.6]} material-color="#cfd8dc" />
             <Cylinder args={[0.4, 0.4, 3]} position={[0, 1.5, 0]} material-color="#b0bec5" />
         </group>
    </group>

    {/* Sink Area */}
    <group position={[-9, 0, 2]}>
        <Box args={[2, 0.2, 3]} position={[0.5, 0, 0]} material-color="#bdbdbd" /> {/* Sink Basin */}
        <Torus args={[0.5, 0.08, 8, 16]} position={[0, 0.2, 0]} rotation={[0, Math.PI/2, 0]} material-color="#cfd8dc" /> {/* Faucet Base */}
        <Torus args={[0.5, 0.08, 8, 16, Math.PI]} position={[0.5, 0.7, 0]} rotation={[0, 0, -Math.PI/4]} material-color="#cfd8dc" /> {/* Faucet Arch */}
    </group>
    
    {/* Dining Table */}
    <group position={[4, -1, 4]}>
        <Box args={[5, 0.2, 3]} position={[0, 1, 0]} material-color="#8d6e63" castShadow />
        <TableLeg position={[-2, -1, -1]} />
        <TableLeg position={[2, -1, -1]} />
        <TableLeg position={[-2, -1, 1]} />
        <TableLeg position={[2, -1, 1]} />
        
        {/* Food Scraps */}
        <Cylinder args={[0.6, 0.4, 0.1, 16]} position={[1, 1.15, 0.5]} material-color="white" />
        <Sphere args={[0.2]} position={[1, 1.25, 0.5]} material-color="#66bb6a" /> {/* Rotten Peas */}
        <Box args={[0.3, 0.2, 0.5]} position={[-1, 1.2, -0.5]} material-color="#ff9800" /> {/* Cheese */}
        {/* Flies indicator (static geometry) */}
        <Sphere args={[0.03]} position={[1.1, 1.6, 0.5]} material-color="black" />
        <Sphere args={[0.03]} position={[0.9, 1.5, 0.6]} material-color="black" />
    </group>

    <CeilingLight position={[0, 7.5, 0]} color="#e0f7fa" />
  </group>
);

const Office = () => {
    return (
      <group>
         {/* -- OFFICE FLOOR -- */}
         <Box args={[20, 0.2, 20]} position={[0, -2.1, 0]} material-color="#90a4ae" receiveShadow />

         {/* -- FURNITURE: L-DESK & WORKSTATION -- */}
         <group position={[6, -0.5, 2]} rotation={[0, -0.8, 0]}>
            {/* L-Desk */}
            <Box args={[4, 0.15, 2.5]} material-color="#f5f5f5" castShadow />
            <Box args={[2.5, 0.15, 4]} position={[-2, 0, 2]} material-color="#f5f5f5" castShadow />
            
            <TableLeg position={[1.8, -1, -1]} color="#bdbdbd" />
            <TableLeg position={[1.8, -1, 1]} color="#bdbdbd" />
            <TableLeg position={[-3, -1, 3.8]} color="#bdbdbd" />
            <TableLeg position={[-0.5, -1, 0]} color="#bdbdbd" />
            
            {/* PC Monitor 1 */}
            <group position={[0.5, 0.6, -0.5]} rotation={[0, -0.2, 0]}>
                <Box args={[1.4, 0.9, 0.1]} material-color="#111" />
                <Box args={[1.3, 0.8, 0.05]} position={[0, 0, 0.04]}> 
                    <meshStandardMaterial color="#0288d1" emissive="#0288d1" emissiveIntensity={0.8} />
                </Box>
                <Cylinder args={[0.1, 0.2, 0.2]} position={[0, -0.55, 0]} material-color="#111" />
            </group>
            
            {/* PC Monitor 2 */}
            <group position={[-1.2, 0.6, 0.2]} rotation={[0, 0.4, 0]}>
                <Box args={[1.4, 0.9, 0.1]} material-color="#111" />
                <Box args={[1.3, 0.8, 0.05]} position={[0, 0, 0.04]}> 
                    <meshStandardMaterial color="#303f9f" emissive="#303f9f" emissiveIntensity={0.6} />
                </Box>
                <Cylinder args={[0.1, 0.2, 0.2]} position={[0, -0.55, 0]} material-color="#111" />
            </group>

            {/* PC Tower */}
            <Box args={[0.6, 1.2, 1.2]} position={[-2.5, 0.6, 3.5]} rotation={[0, 0, 0]} material-color="#212121">
                 <Box args={[0.05, 1, 0.05]} position={[0.3, 0, 0.5]} material-color="red" emissive="red" emissiveIntensity={2} />
            </Box>

            {/* Keyboard & Mouse */}
            <Box args={[1.2, 0.05, 0.4]} position={[-0.2, 0.1, 0.5]} rotation={[0, -0.1, 0]} material-color="#333" />
            <Box args={[0.2, 0.08, 0.3]} position={[0.8, 0.1, 0.6]} material-color="#333" />

            {/* Coffee Mug (Vital for worker) */}
            <group position={[-1.5, 0.2, 1.5]}>
                <Cylinder args={[0.15, 0.12, 0.25]} material-color="#ffffff" />
                <Torus args={[0.08, 0.02, 8, 16]} position={[0.15, 0, 0]} material-color="#ffffff" />
                {/* Steam (Static) */}
                <Sphere args={[0.08]} position={[0, 0.3, 0]} material-color="#ccc" transparent opacity={0.3} />
            </group>
          </group>
    
          {/* -- FURNITURE: FILING CABINETS -- */}
          <group position={[-8, 0, -8]}>
            {/* Cabinet 1 */}
            <Box args={[3, 4, 1.5]} position={[0, 0, 0]} material-color="#78909c" castShadow />
            <DrawerHandle position={[0, 1.2, 0.8]} />
            <DrawerHandle position={[0, 0, 0.8]} />
            <DrawerHandle position={[0, -1.2, 0.8]} />
            
             {/* Stacks of Paper */}
             <Box args={[0.8, 0.1, 1]} position={[0.5, 2.05, 0]} rotation={[0, 0.2, 0]} material-color="white" />
             <Box args={[0.8, 0.15, 1]} position={[0.5, 2.15, 0]} rotation={[0, 0.1, 0]} material-color="white" />
          </group>

          {/* -- WHITEBOARD -- */}
          <group position={[0, 2, -9.8]}>
              <Box args={[8, 4, 0.1]} material-color="white" />
              <Box args={[8.2, 4.2, 0.05]} position={[0, 0, -0.05]} material-color="#bdbdbd" />
              {/* Scribbles */}
              <Box args={[2, 0.05, 0.01]} position={[-2, 1, 0.06]} rotation={[0, 0, 0.2]} material-color="blue" />
              <Box args={[3, 0.05, 0.01]} position={[0, 0, 0.06]} rotation={[0, 0, -0.1]} material-color="black" />
              <Box args={[1.5, 0.05, 0.01]} position={[2, -1, 0.06]} rotation={[0, 0, 0.1]} material-color="red" />
              {/* Marker Tray */}
              <Box args={[4, 0.1, 0.2]} position={[0, -2.1, 0.1]} material-color="#bdbdbd" />
          </group>

          {/* -- WATER COOLER -- */}
          <group position={[-9, -0.5, 5]}>
              <Box args={[1.5, 3, 1.5]} material-color="#eee" castShadow />
              <Cylinder args={[0.6, 0.6, 1.5]} position={[0, 2.2, 0]} material-color="#4fc3f7" opacity={0.8} transparent />
              <Box args={[0.1, 0.2, 0.1]} position={[0, 0.5, 0.8]} material-color="blue" />
              <Box args={[0.1, 0.2, 0.1]} position={[0.3, 0.5, 0.8]} material-color="red" />
          </group>
    
          {/* -- LOUNGE/WAITING AREA -- */}
          <group position={[-5, -1.5, 5]} rotation={[0, 1, 0]}>
             <Box args={[6, 1, 2.5]} material-color="#424242" castShadow /> {/* Black Leather Sofa */}
             <Box args={[6, 2, 0.5]} position={[0, 1.2, -1.25]} material-color="#212121" /> 
             <Box args={[0.8, 1.5, 2.5]} position={[3, 0.5, 0]} material-color="#212121" /> 
             <Box args={[0.8, 1.5, 2.5]} position={[-3, 0.5, 0]} material-color="#212121" /> 
          </group>

          <Plant position={[8, -2, -8]} />

          {/* Fluorescent Lights */}
          <CeilingLight position={[-5, 7.5, -5]} color="#ffffff" />
          <CeilingLight position={[5, 7.5, -5]} color="#ffffff" />
          <CeilingLight position={[-5, 7.5, 5]} color="#ffffff" />
          <CeilingLight position={[5, 7.5, 5]} color="#ffffff" />
      </group>
    );
}

const Room = () => {
  const currentLevel = useGameStore(state => state.currentLevel);

  let LevelComponent = Bedroom;
  let floorColor = "#5d4037"; // Wood dark
  let wallColor = "#f5f5f5";

  if (currentLevel === LevelType.KITCHEN) {
      LevelComponent = Kitchen;
      floorColor = "#9e9e9e"; // Tiles
      wallColor = "#e3f2fd";
  } else if (currentLevel === LevelType.OFFICE) {
      LevelComponent = Office;
      floorColor = "#cfd8dc"; // Office Gray
      wallColor = "#eceff1"; // Cool White
  }

  return (
    <group receiveShadow>
      {/* Floor */}
      <Box args={[20, 0.2, 20]} position={[0, -2.1, 0]} material-color={floorColor} receiveShadow />
      
      {/* Ceiling */}
      <Box args={[20, 0.2, 20]} position={[0, 8, 0]} material-color="#ffffff" />
      
      {/* Walls */}
      <Box args={[0.5, 10, 20]} position={[-10, 3, 0]} material-color={wallColor} receiveShadow />
      <Box args={[0.5, 10, 20]} position={[10, 3, 0]} material-color={wallColor} receiveShadow />
      <Box args={[20, 10, 0.5]} position={[0, 3, -10]} material-color={wallColor} receiveShadow />
      <Box args={[20, 10, 0.5]} position={[0, 3, 10]} material-color={wallColor} receiveShadow />

      <LevelComponent />
    </group>
  );
};

export default Room;
