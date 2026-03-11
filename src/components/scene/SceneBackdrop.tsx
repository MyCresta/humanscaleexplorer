import { Line } from '@react-three/drei'
import { gymHallLayout } from '../../config/sceneLayout'
import { gymHallStyle } from '../../config/sceneStyle'
import type { SceneBackground } from './types'

export function SceneBackdrop({ preset }: { preset: SceneBackground }) {
  if (preset === 'gym_hall') {
    const hallHalfWidth = gymHallLayout.hallHalfWidth
    const hallDepth = gymHallLayout.hallDepth
    const wallHeight = gymHallLayout.wallHeight
    const wallColor = gymHallStyle.colors.wall
    const trimColor = gymHallStyle.colors.trim
    const woodColor = gymHallStyle.colors.wood
    const lineColor = gymHallStyle.colors.courtLine
    const lineY = 0.01
    const courtHalfWidth = gymHallLayout.court.halfWidth
    const courtHalfLength = gymHallLayout.court.halfLength
    const keyHalfWidth = gymHallLayout.court.keyHalfWidth
    const keyDepth = gymHallLayout.court.keyDepth
    const centerCircleR = gymHallLayout.court.centerCircleR
    const freeThrowR = gymHallLayout.court.freeThrowR
    const plankWidth = gymHallStyle.floor.plankWidth
    const plankLength = gymHallStyle.floor.plankLength

    const circlePoints = (radius: number, segments = 72, cx = 0, cz = 0) =>
      Array.from({ length: segments + 1 }, (_, i) => {
        const t = (i / segments) * Math.PI * 2
        return [cx + Math.cos(t) * radius, lineY, cz + Math.sin(t) * radius] as [
          number,
          number,
          number,
        ]
      })

    const arcPoints = (
      radius: number,
      startAngle: number,
      endAngle: number,
      segments = 40,
      cx = 0,
      cz = 0,
    ) =>
      Array.from({ length: segments + 1 }, (_, i) => {
        const t = startAngle + (i / segments) * (endAngle - startAngle)
        return [cx + Math.cos(t) * radius, lineY, cz + Math.sin(t) * radius] as [
          number,
          number,
          number,
        ]
      })

    const floorMinZ = -hallDepth / 2
    const plankRows = Array.from(
      { length: Math.floor(hallDepth / plankWidth) + 1 },
      (_, i) => floorMinZ + i * plankWidth,
    )
    const plankCols = Array.from(
      { length: Math.floor((hallHalfWidth * 2) / plankLength) + 3 },
      (_, i) => -hallHalfWidth + i * plankLength,
    )
    const backWallPanels = Array.from({ length: 9 }, (_, i) => -16 + i * 4)
    const sideWallPanels = Array.from({ length: 9 }, (_, i) => -24 + i * 6).map((z) =>
      Math.max(-hallDepth / 2 + 1.4, Math.min(hallDepth / 2 - 1.4, z)),
    )
    const ladderRungs = Array.from({ length: gymHallLayout.ladders.rungs }, (_, i) => i)
    const ladderXPositions = [...gymHallLayout.ladders.xPositions]
    const hash = (seed: number) => {
      const v = Math.sin(seed * 12.9898) * 43758.5453
      return v - Math.floor(v)
    }

    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[hallHalfWidth * 2, hallDepth]} />
          <meshPhysicalMaterial
            color={woodColor}
            roughness={0.5}
            metalness={0.02}
            clearcoat={0.65}
            clearcoatRoughness={0.28}
          />
        </mesh>
        {plankRows.map((z, i) => (
          <Line
            key={`plank-row-${i}`}
            points={[
              [-hallHalfWidth, 0.0042, z],
              [hallHalfWidth, 0.0042, z],
            ]}
            color={hash(i + 11) > 0.5 ? '#be8c57' : '#b78450'}
            lineWidth={
              gymHallStyle.floor.rowLineWidthBase +
              hash(i + 29) * gymHallStyle.floor.rowLineWidthVariance
            }
          />
        ))}
        {plankRows.slice(0, -1).map((z, row) => {
          const nextZ = z + plankWidth
          const offset = hash((row + 1) * 31.7) * plankLength
          return plankCols.map((x, col) => {
            const xJitter = (hash((row + 3) * (col + 5) * 0.77) - 0.5) * 0.16
            const xPos = Math.max(-hallHalfWidth, Math.min(hallHalfWidth, x + offset + xJitter))
            if (xPos < -hallHalfWidth || xPos > hallHalfWidth) return null
            return (
              <Line
                key={`plank-col-${row}-${col}`}
                points={[
                  [xPos, 0.0042, z],
                  [xPos, 0.0042, nextZ],
                ]}
                color={hash((row + 17) * (col + 13)) > 0.5 ? '#bb8750' : '#c08e58'}
                lineWidth={
                  gymHallStyle.floor.colLineWidthBase +
                  hash((row + 7) * (col + 9)) * gymHallStyle.floor.colLineWidthVariance
                }
              />
            )
          })
        })}

        <group rotation={[0, Math.PI / 2, 0]}>
          <Line
            points={[
              [-courtHalfWidth, lineY, -courtHalfLength],
              [courtHalfWidth, lineY, -courtHalfLength],
              [courtHalfWidth, lineY, courtHalfLength],
              [-courtHalfWidth, lineY, courtHalfLength],
              [-courtHalfWidth, lineY, -courtHalfLength],
            ]}
            color={lineColor}
            lineWidth={gymHallStyle.courtLineWidth.boundary}
          />
          <Line
            points={[
              [-courtHalfWidth, lineY, 0],
              [courtHalfWidth, lineY, 0],
            ]}
            color={lineColor}
            lineWidth={gymHallStyle.courtLineWidth.center}
          />
          <Line
            points={circlePoints(centerCircleR)}
            color={lineColor}
            lineWidth={gymHallStyle.courtLineWidth.circle}
          />

          <Line
            points={[
              [-keyHalfWidth, lineY, -courtHalfLength],
              [keyHalfWidth, lineY, -courtHalfLength],
              [keyHalfWidth, lineY, -courtHalfLength + keyDepth],
              [-keyHalfWidth, lineY, -courtHalfLength + keyDepth],
              [-keyHalfWidth, lineY, -courtHalfLength],
            ]}
            color={lineColor}
            lineWidth={gymHallStyle.courtLineWidth.key}
          />
          <Line
            points={[
              [-keyHalfWidth, lineY, courtHalfLength],
              [keyHalfWidth, lineY, courtHalfLength],
              [keyHalfWidth, lineY, courtHalfLength - keyDepth],
              [-keyHalfWidth, lineY, courtHalfLength - keyDepth],
              [-keyHalfWidth, lineY, courtHalfLength],
            ]}
            color={lineColor}
            lineWidth={gymHallStyle.courtLineWidth.key}
          />

          <Line
            points={arcPoints(freeThrowR, Math.PI, 0, 40, 0, -courtHalfLength + keyDepth)}
            color={lineColor}
            lineWidth={gymHallStyle.courtLineWidth.freeThrowArc}
          />
          <Line
            points={arcPoints(freeThrowR, 0, Math.PI, 40, 0, courtHalfLength - keyDepth)}
            color={lineColor}
            lineWidth={gymHallStyle.courtLineWidth.freeThrowArc}
          />
        </group>

        <mesh position={[0, wallHeight / 2, -hallDepth / 2]} receiveShadow>
          <boxGeometry args={[hallHalfWidth * 2, wallHeight, 0.25]} />
          <meshStandardMaterial color={wallColor} roughness={0.94} />
        </mesh>
        {backWallPanels.map((x, i) => (
          <mesh
            key={`back-panel-${i}`}
            position={[x, wallHeight / 2, -hallDepth / 2 + 0.128]}
            receiveShadow
          >
            <boxGeometry args={[0.1, wallHeight, 0.03]} />
            <meshStandardMaterial color={gymHallStyle.colors.backPanel} roughness={0.88} />
          </mesh>
        ))}
        <mesh position={[-hallHalfWidth, wallHeight / 2, 0]} receiveShadow>
          <boxGeometry args={[0.25, wallHeight, hallDepth]} />
          <meshStandardMaterial color={wallColor} roughness={0.94} />
        </mesh>
        {sideWallPanels.map((z, i) => (
          <mesh
            key={`left-panel-${i}`}
            position={[-hallHalfWidth + 0.128, wallHeight / 2, z]}
            receiveShadow
          >
            <boxGeometry args={[0.03, wallHeight, 0.1]} />
            <meshStandardMaterial color={gymHallStyle.colors.backPanel} roughness={0.88} />
          </mesh>
        ))}
        <mesh position={[hallHalfWidth, wallHeight / 2, 0]} receiveShadow>
          <boxGeometry args={[0.25, wallHeight, hallDepth]} />
          <meshStandardMaterial color={wallColor} roughness={0.94} />
        </mesh>
        {sideWallPanels
          .filter((z) => Math.abs(z - (-hallDepth / 2 + 3.2)) > 1.1)
          .map((z, i) => (
            <mesh
              key={`right-panel-${i}`}
              position={[hallHalfWidth - 0.128, wallHeight / 2, z]}
              receiveShadow
            >
              <boxGeometry args={[0.03, wallHeight, 0.1]} />
              <meshStandardMaterial color={gymHallStyle.colors.backPanel} roughness={0.88} />
            </mesh>
          ))}

        <mesh position={[gymHallLayout.door.x, gymHallLayout.door.y, gymHallLayout.door.z]} castShadow>
          <boxGeometry args={[0.08, 2.05, 1.05]} />
          <meshStandardMaterial color={gymHallStyle.colors.door} roughness={0.5} />
        </mesh>
        <mesh
          position={[gymHallLayout.door.x + 0.035, gymHallLayout.door.y, gymHallLayout.door.z]}
          castShadow
        >
          <boxGeometry args={[0.02, 2.1, 1.1]} />
          <meshStandardMaterial color={gymHallStyle.colors.doorFrame} roughness={0.42} />
        </mesh>

        <mesh position={[gymHallLayout.hoops[0].x, gymHallLayout.hoops[0].y, gymHallLayout.hoops[0].z]} castShadow>
          <boxGeometry args={[1.8, 1.05, 0.08]} />
          <meshStandardMaterial color={gymHallStyle.colors.backboard} roughness={0.35} />
        </mesh>
        <mesh
          position={[gymHallLayout.hoops[0].x, gymHallLayout.hoops[0].y - 0.1, gymHallLayout.hoops[0].z + 0.048]}
          rotation={[0, 0, Math.PI / 4]}
          castShadow
        >
          <ringGeometry args={[0.28, 0.31, 4]} />
          <meshStandardMaterial color={gymHallStyle.colors.hoop} roughness={0.38} side={2} />
        </mesh>
        <mesh
          position={[gymHallLayout.hoops[0].x, 3.15, gymHallLayout.hoops[0].z + 0.37]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <torusGeometry args={[0.24, 0.025, 12, 24]} />
          <meshStandardMaterial color={gymHallStyle.colors.hoop} metalness={0.35} roughness={0.35} />
        </mesh>
        <mesh position={[gymHallLayout.hoops[1].x, gymHallLayout.hoops[1].y, gymHallLayout.hoops[1].z]} castShadow>
          <boxGeometry args={[1.8, 1.05, 0.08]} />
          <meshStandardMaterial color={gymHallStyle.colors.backboard} roughness={0.35} />
        </mesh>
        <mesh
          position={[gymHallLayout.hoops[1].x, gymHallLayout.hoops[1].y - 0.1, gymHallLayout.hoops[1].z + 0.048]}
          rotation={[0, 0, Math.PI / 4]}
          castShadow
        >
          <ringGeometry args={[0.28, 0.31, 4]} />
          <meshStandardMaterial color={gymHallStyle.colors.hoop} roughness={0.38} side={2} />
        </mesh>
        <mesh
          position={[gymHallLayout.hoops[1].x, 3.15, gymHallLayout.hoops[1].z + 0.37]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <torusGeometry args={[0.24, 0.025, 12, 24]} />
          <meshStandardMaterial color={gymHallStyle.colors.hoop} metalness={0.35} roughness={0.35} />
        </mesh>

        <mesh position={[gymHallLayout.bench.x, gymHallLayout.bench.y, gymHallLayout.bench.z]} castShadow>
          <boxGeometry args={[3.6, 0.08, 0.42]} />
          <meshStandardMaterial color={gymHallStyle.colors.benchTop} roughness={0.75} />
        </mesh>
        <mesh position={[gymHallLayout.bench.x - 1.7, 0.12, gymHallLayout.bench.z]} castShadow>
          <boxGeometry args={[0.12, 0.24, 0.12]} />
          <meshStandardMaterial color={gymHallStyle.colors.benchLeg} roughness={0.8} />
        </mesh>
        <mesh position={[gymHallLayout.bench.x + 1.7, 0.12, gymHallLayout.bench.z]} castShadow>
          <boxGeometry args={[0.12, 0.24, 0.12]} />
          <meshStandardMaterial color={gymHallStyle.colors.benchLeg} roughness={0.8} />
        </mesh>
        {ladderXPositions.map((x, idx) => (
          <group key={`ladder-${idx}`}>
            <mesh position={[x - 0.58, 2.4, -hallDepth / 2 + 0.16]} castShadow>
              <boxGeometry args={[0.06, 4.8, 0.16]} />
              <meshStandardMaterial color={gymHallStyle.colors.ladderRail} roughness={0.75} />
            </mesh>
            <mesh position={[x + 0.58, 2.4, -hallDepth / 2 + 0.16]} castShadow>
              <boxGeometry args={[0.06, 4.8, 0.16]} />
              <meshStandardMaterial color={gymHallStyle.colors.ladderRail} roughness={0.75} />
            </mesh>
            {ladderRungs.map((rung) => (
              <mesh
                key={`rung-${idx}-${rung}`}
                position={[x, 0.25 + rung * 0.48, -hallDepth / 2 + 0.24]}
                castShadow
              >
                <boxGeometry args={[1.18, 0.05, 0.06]} />
                <meshStandardMaterial color={gymHallStyle.colors.ladderRung} roughness={0.72} />
              </mesh>
            ))}
          </group>
        ))}

        <mesh
          position={[-hallHalfWidth + 0.128, wallHeight / 2, -hallDepth / 2 + 0.128]}
          receiveShadow
        >
          <boxGeometry args={[0.04, wallHeight, 0.04]} />
          <meshStandardMaterial color={trimColor} roughness={0.8} />
        </mesh>
        <mesh
          position={[hallHalfWidth - 0.128, wallHeight / 2, -hallDepth / 2 + 0.128]}
          receiveShadow
        >
          <boxGeometry args={[0.04, wallHeight, 0.04]} />
          <meshStandardMaterial color={trimColor} roughness={0.8} />
        </mesh>
        <mesh
          position={[-hallHalfWidth + 0.128, wallHeight / 2, hallDepth / 2 - 0.128]}
          receiveShadow
        >
          <boxGeometry args={[0.04, wallHeight, 0.04]} />
          <meshStandardMaterial color={trimColor} roughness={0.8} />
        </mesh>
        <mesh
          position={[hallHalfWidth - 0.128, wallHeight / 2, hallDepth / 2 - 0.128]}
          receiveShadow
        >
          <boxGeometry args={[0.04, wallHeight, 0.04]} />
          <meshStandardMaterial color={trimColor} roughness={0.8} />
        </mesh>
      </group>
    )
  }

  if (preset === 'studio') {
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color='#d5dde8' roughness={0.94} />
        </mesh>
        <mesh position={[0, 5.5, -10.5]}>
          <planeGeometry args={[28, 12]} />
          <meshStandardMaterial color='#eef3fa' roughness={0.98} />
        </mesh>
        <mesh position={[-14, 5.5, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[21, 12]} />
          <meshStandardMaterial color='#e6edf7' roughness={0.98} />
        </mesh>
        <gridHelper args={[24, 24, '#bfccd9', '#d4dce7']} position={[0, 0.001, 0]} />
      </group>
    )
  }

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color='#dce4ef' />
      </mesh>
      <gridHelper args={[20, 20, '#b3becd', '#d0d8e3']} position={[0, 0.001, 0]} />
    </group>
  )
}

