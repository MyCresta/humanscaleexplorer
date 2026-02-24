import { memo, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Line, OrbitControls, Text } from '@react-three/drei'
import { Object3D, Quaternion, Vector3 } from 'three'
import type { InstancedMesh, Mesh } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { gymHallLayout, sceneAnchors } from '../config/sceneLayout'
import { formatAdaptive, formatLiters, formatMass } from '../utils/format'

export type WasteRenderMode = 'liquid_fill' | 'feces_pour' | 'cube' | 'instanced_pile'
export type SceneBackground = 'minimal' | 'gym_hall' | 'studio'

type SceneProps = {
  wasteSideMeters: number
  wasteHeightMeters: number
  wasteHalfWidthMeters: number
  wasteColor: string
  wasteMassKg: number
  wasteLiters: number
  isLiquid: boolean
  humanHeightMeters: number
  humanMassKg: number
  sceneExtent: number
  backgroundPreset: SceneBackground
  wasteMode: WasteRenderMode
  animationToken: string
  wasteCount?: number
  wasteItemRadiusMeters?: number
  wasteItemHeightMeters?: number
  wasteItemInnerRadiusMeters?: number
  wasteMaxVisualItems?: number
  wasteItemSurface?: 'aluminum' | 'paper'
  wasteItemColor?: string
  wasteItemLabelBandColor?: string
  wasteItemStackStyle?: 'pyramid' | 'chips_columns'
  wasteItemLabel?: string
  secondaryWaste?: {
    sideMeters: number
    heightMeters: number
    halfWidthMeters: number
    color: string
    massKg: number
    liters: number
    isLiquid: boolean
    mode: WasteRenderMode
    count?: number
    itemRadiusMeters?: number
    itemHeightMeters?: number
    itemInnerRadiusMeters?: number
    maxVisualItems?: number
    itemSurface?: 'aluminum' | 'paper'
    itemColor?: string
    itemLabelBandColor?: string
    itemStackStyle?: 'pyramid' | 'chips_columns'
    itemLabel?: string
  }
}

const HumanModel = memo(function HumanModel({
  humanX,
  humanScale,
}: {
  humanX: number
  humanScale: number
}) {
  return (
    <group position={[humanX, 0, 0]} scale={[humanScale, humanScale, humanScale]}>
      <mesh position={[0, 1.66, 0]} castShadow>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial color='#2a5f9b' />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.6, 8, 16]} />
        <meshStandardMaterial color='#2a5f9b' />
      </mesh>
      <mesh position={[-0.3, 1.1, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.45, 8, 12]} />
        <meshStandardMaterial color='#2a5f9b' />
      </mesh>
      <mesh position={[0.3, 1.1, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.45, 8, 12]} />
        <meshStandardMaterial color='#2a5f9b' />
      </mesh>
      <mesh position={[-0.11, 0.45, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.55, 8, 12]} />
        <meshStandardMaterial color='#2a5f9b' />
      </mesh>
      <mesh position={[0.11, 0.45, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.55, 8, 12]} />
        <meshStandardMaterial color='#2a5f9b' />
      </mesh>
    </group>
  )
})

function SceneBackdrop({ preset }: { preset: SceneBackground }) {
  if (preset === 'gym_hall') {
    const hallHalfWidth = gymHallLayout.hallHalfWidth
    const hallDepth = gymHallLayout.hallDepth
    const wallHeight = gymHallLayout.wallHeight
    const wallColor = '#ece8df'
    const trimColor = '#bdb3a4'
    const woodColor = '#d6ad74'
    const lineColor = '#f7f8fb'
    const lineY = 0.01
    const courtHalfWidth = gymHallLayout.court.halfWidth
    const courtHalfLength = gymHallLayout.court.halfLength
    const keyHalfWidth = gymHallLayout.court.keyHalfWidth
    const keyDepth = gymHallLayout.court.keyDepth
    const centerCircleR = gymHallLayout.court.centerCircleR
    const freeThrowR = gymHallLayout.court.freeThrowR
    const plankWidth = 0.24
    const plankLength = 4.8

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
            lineWidth={0.45 + hash(i + 29) * 0.18}
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
                lineWidth={0.42 + hash((row + 7) * (col + 9)) * 0.12}
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
            lineWidth={2}
          />
          <Line
            points={[
              [-courtHalfWidth, lineY, 0],
              [courtHalfWidth, lineY, 0],
            ]}
            color={lineColor}
            lineWidth={1.8}
          />
          <Line points={circlePoints(centerCircleR)} color={lineColor} lineWidth={1.6} />

          <Line
            points={[
              [-keyHalfWidth, lineY, -courtHalfLength],
              [keyHalfWidth, lineY, -courtHalfLength],
              [keyHalfWidth, lineY, -courtHalfLength + keyDepth],
              [-keyHalfWidth, lineY, -courtHalfLength + keyDepth],
              [-keyHalfWidth, lineY, -courtHalfLength],
            ]}
            color={lineColor}
            lineWidth={1.5}
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
            lineWidth={1.5}
          />

          <Line
            points={arcPoints(freeThrowR, Math.PI, 0, 40, 0, -courtHalfLength + keyDepth)}
            color={lineColor}
            lineWidth={1.3}
          />
          <Line
            points={arcPoints(freeThrowR, 0, Math.PI, 40, 0, courtHalfLength - keyDepth)}
            color={lineColor}
            lineWidth={1.3}
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
            <meshStandardMaterial color='#d8d1c6' roughness={0.88} />
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
            <meshStandardMaterial color='#d8d1c6' roughness={0.88} />
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
              <meshStandardMaterial color='#d8d1c6' roughness={0.88} />
            </mesh>
          ))}

        <mesh position={[gymHallLayout.door.x, gymHallLayout.door.y, gymHallLayout.door.z]} castShadow>
          <boxGeometry args={[0.08, 2.05, 1.05]} />
          <meshStandardMaterial color='#76818f' roughness={0.5} />
        </mesh>
        <mesh position={[gymHallLayout.door.x + 0.035, gymHallLayout.door.y, gymHallLayout.door.z]} castShadow>
          <boxGeometry args={[0.02, 2.1, 1.1]} />
          <meshStandardMaterial color='#939eaa' roughness={0.42} />
        </mesh>

        <mesh position={[gymHallLayout.hoops[0].x, gymHallLayout.hoops[0].y, gymHallLayout.hoops[0].z]} castShadow>
          <boxGeometry args={[1.8, 1.05, 0.08]} />
          <meshStandardMaterial color='#f9fbff' roughness={0.35} />
        </mesh>
        <mesh
          position={[gymHallLayout.hoops[0].x, gymHallLayout.hoops[0].y - 0.1, gymHallLayout.hoops[0].z + 0.048]}
          rotation={[0, 0, Math.PI / 4]}
          castShadow
        >
          <ringGeometry args={[0.28, 0.31, 4]} />
          <meshStandardMaterial color='#d95f2e' roughness={0.38} side={2} />
        </mesh>
        <mesh
          position={[gymHallLayout.hoops[0].x, 3.15, gymHallLayout.hoops[0].z + 0.37]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <torusGeometry args={[0.24, 0.025, 12, 24]} />
          <meshStandardMaterial color='#d95f2e' metalness={0.35} roughness={0.35} />
        </mesh>
        <mesh position={[gymHallLayout.hoops[1].x, gymHallLayout.hoops[1].y, gymHallLayout.hoops[1].z]} castShadow>
          <boxGeometry args={[1.8, 1.05, 0.08]} />
          <meshStandardMaterial color='#f9fbff' roughness={0.35} />
        </mesh>
        <mesh
          position={[gymHallLayout.hoops[1].x, gymHallLayout.hoops[1].y - 0.1, gymHallLayout.hoops[1].z + 0.048]}
          rotation={[0, 0, Math.PI / 4]}
          castShadow
        >
          <ringGeometry args={[0.28, 0.31, 4]} />
          <meshStandardMaterial color='#d95f2e' roughness={0.38} side={2} />
        </mesh>
        <mesh
          position={[gymHallLayout.hoops[1].x, 3.15, gymHallLayout.hoops[1].z + 0.37]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <torusGeometry args={[0.24, 0.025, 12, 24]} />
          <meshStandardMaterial color='#d95f2e' metalness={0.35} roughness={0.35} />
        </mesh>

        <mesh position={[gymHallLayout.bench.x, gymHallLayout.bench.y, gymHallLayout.bench.z]} castShadow>
          <boxGeometry args={[3.6, 0.08, 0.42]} />
          <meshStandardMaterial color='#7c664f' roughness={0.75} />
        </mesh>
        <mesh position={[gymHallLayout.bench.x - 1.7, 0.12, gymHallLayout.bench.z]} castShadow>
          <boxGeometry args={[0.12, 0.24, 0.12]} />
          <meshStandardMaterial color='#5a4a39' roughness={0.8} />
        </mesh>
        <mesh position={[gymHallLayout.bench.x + 1.7, 0.12, gymHallLayout.bench.z]} castShadow>
          <boxGeometry args={[0.12, 0.24, 0.12]} />
          <meshStandardMaterial color='#5a4a39' roughness={0.8} />
        </mesh>
        {ladderXPositions.map((x, idx) => (
          <group key={`ladder-${idx}`}>
            <mesh position={[x - 0.58, 2.4, -hallDepth / 2 + 0.16]} castShadow>
              <boxGeometry args={[0.06, 4.8, 0.16]} />
              <meshStandardMaterial color='#d7c4a7' roughness={0.75} />
            </mesh>
            <mesh position={[x + 0.58, 2.4, -hallDepth / 2 + 0.16]} castShadow>
              <boxGeometry args={[0.06, 4.8, 0.16]} />
              <meshStandardMaterial color='#d7c4a7' roughness={0.75} />
            </mesh>
            {ladderRungs.map((rung) => (
              <mesh
                key={`rung-${idx}-${rung}`}
                position={[x, 0.25 + rung * 0.48, -hallDepth / 2 + 0.24]}
                castShadow
              >
                <boxGeometry args={[1.18, 0.05, 0.06]} />
                <meshStandardMaterial color='#bea47f' roughness={0.72} />
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

function WasteBody({
  side,
  color,
  mode,
  animationToken,
  coneHeight,
  coneRadius,
  liquidHeight,
  liquidRadius,
  pileHeight,
  pileRadius,
  itemCount,
  itemRadius,
  itemHeight,
  itemInnerRadius,
  maxVisualItems,
  itemSurface,
  itemColor,
  itemLabelBandColor,
  itemStackStyle,
}: {
  side: number
  color: string
  mode: WasteRenderMode
  animationToken: string
  coneHeight: number
  coneRadius: number
  liquidHeight: number
  liquidRadius: number
  pileHeight: number
  pileRadius: number
  itemCount?: number
  itemRadius?: number
  itemHeight?: number
  itemInnerRadius?: number
  maxVisualItems?: number
  itemSurface?: 'aluminum' | 'paper'
  itemColor?: string
  itemLabelBandColor?: string
  itemStackStyle?: 'pyramid' | 'chips_columns'
}) {
  const progressRef = useRef(0)
  const fillRef = useRef<Mesh | null>(null)
  const streamRef = useRef<Mesh | null>(null)
  const pileRef = useRef<Mesh | null>(null)
  const cubeRef = useRef<Mesh | null>(null)
  const canInstancesRef = useRef<InstancedMesh | null>(null)
  const canBandRef = useRef<InstancedMesh | null>(null)
  const rollOuterRef = useRef<InstancedMesh | null>(null)
  const rollInnerRef = useRef<InstancedMesh | null>(null)
  const rollTopRef = useRef<InstancedMesh | null>(null)
  const rollBottomRef = useRef<InstancedMesh | null>(null)
  const tempObj = useRef(new Object3D())
  const capTopObj = useRef(new Object3D())
  const capBottomObj = useRef(new Object3D())
  const capOffset = useRef(new Vector3())
  const capQuat = useRef(new Quaternion())
  const capTiltQuat = useRef(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2))
  const renderIndicesRef = useRef<number[]>([0])
  const fillIndicesRef = useRef<number[]>([0])
  const baseSideRef = useRef(1)
  const stackStartsRef = useRef<number[]>([0])
  const stackCapsRef = useRef<number[]>([1])
  const stackGridRef = useRef({ cols: 1, rows: 1 })

  const decomposeStackIndex = (index: number, baseSide: number) => {
    let idx = index
    let layer = 0
    let layerSide = baseSide
    while (layerSide > 1) {
      const layerCap = (layerSide * (layerSide + 1)) / 2
      if (idx < layerCap) break
      idx -= layerCap
      layer += 1
      layerSide = baseSide - layer
    }

    let row = 0
    let rowLen = layerSide
    while (idx >= rowLen && rowLen > 1) {
      idx -= rowLen
      row += 1
      rowLen = layerSide - row
    }
    const col = idx
    return { layer, layerSide, row, col }
  }

  useEffect(() => {
    progressRef.current = 0
  }, [animationToken])

  useEffect(() => {
    if (mode !== 'instanced_pile' || !itemCount) {
      renderIndicesRef.current = [0]
      fillIndicesRef.current = [0]
      baseSideRef.current = 1
      stackStartsRef.current = [0]
      stackCapsRef.current = [1]
      stackGridRef.current = { cols: 1, rows: 1 }
      return
    }

    const fullCount = Math.max(1, Math.floor(itemCount))
    const budget = Math.max(1, Math.floor(maxVisualItems ?? 1400))
    const buildFillIndices = (total: number, count: number): number[] => {
      if (count <= 1) return [0]
      return Array.from({ length: count }, (_, i) =>
        Math.floor((i * (total - 1)) / Math.max(1, count - 1)),
      )
    }

    if (itemStackStyle === 'chips_columns') {
      const stackStarts: number[] = []
      const stackCaps: number[] = []
      let cursor = 0
      let stackIndex = 0
      while (cursor < fullCount) {
        const cap = 10 + ((stackIndex * 7) % 21)
        const used = Math.min(cap, fullCount - cursor)
        stackStarts.push(cursor)
        stackCaps.push(used)
        cursor += used
        stackIndex += 1
      }
      stackStartsRef.current = stackStarts
      stackCapsRef.current = stackCaps
      const stackCount = Math.max(1, stackCaps.length)
      const cols = Math.max(1, Math.ceil(Math.sqrt(stackCount)))
      const rows = Math.ceil(stackCount / cols)
      stackGridRef.current = { cols, rows }

      renderIndicesRef.current = Array.from({ length: Math.min(fullCount, budget) }, (_, i) => i)
      fillIndicesRef.current = buildFillIndices(fullCount, renderIndicesRef.current.length)
      baseSideRef.current = 1
      return
    }

    const tetrahedral = (n: number) => (n * (n + 1) * (n + 2)) / 6
    let baseSide = 1
    while (tetrahedral(baseSide) < fullCount) baseSide += 1
    baseSideRef.current = baseSide

    type StackEntry = { index: number; layer: number; layerSide: number; row: number; col: number }
    const entries: StackEntry[] = []
    let maxLayer = 0
    for (let i = 0; i < fullCount; i++) {
      const { layer, layerSide, row, col } = decomposeStackIndex(i, baseSide)
      maxLayer = Math.max(maxLayer, layer)
      entries.push({ index: i, layer, layerSide, row, col })
    }
    const usedLayers = maxLayer + 1
    const topFullLayers = Math.max(1, Math.min(2, usedLayers))
    const topLayerStart = Math.max(0, usedLayers - topFullLayers)

    const topCapIndices: number[] = []
    const shellIndices: number[] = []
    for (const e of entries) {
      const isTopCap = e.layer >= topLayerStart
      const isBoundary =
        e.layer === 0 || e.row === 0 || e.col === 0 || e.row + e.col === e.layerSide - 1
      if (isTopCap) topCapIndices.push(e.index)
      else if (isBoundary) shellIndices.push(e.index)
    }

    if (topCapIndices.length + shellIndices.length <= budget) {
      renderIndicesRef.current = [...topCapIndices, ...shellIndices].sort((a, b) => a - b)
      fillIndicesRef.current = buildFillIndices(fullCount, renderIndicesRef.current.length)
      return
    }

    const topSorted = [...topCapIndices].sort((a, b) => b - a)
    const keepTop = topSorted.slice(0, budget)
    const remainingBudget = budget - keepTop.length
    if (remainingBudget <= 0) {
      renderIndicesRef.current = [...keepTop].sort((a, b) => a - b)
      fillIndicesRef.current = buildFillIndices(fullCount, renderIndicesRef.current.length)
      return
    }

    const sampledShell: number[] = []
    for (let i = 0; i < remainingBudget; i++) {
      const idx = Math.floor((i * (shellIndices.length - 1)) / Math.max(1, remainingBudget - 1))
      sampledShell.push(shellIndices[idx])
    }
    renderIndicesRef.current = [...keepTop, ...sampledShell].sort((a, b) => a - b)
    fillIndicesRef.current = buildFillIndices(fullCount, renderIndicesRef.current.length)
  }, [mode, itemCount, maxVisualItems, itemStackStyle])

  useFrame((_, delta) => {
    progressRef.current = Math.min(1.25, progressRef.current + delta * 0.45)
    const p = Math.min(1, progressRef.current)

    if (mode === 'liquid_fill' && fillRef.current && streamRef.current) {
      const fillRatio = 0.04 + p * 0.92
      fillRef.current.scale.y = fillRatio
      fillRef.current.position.y = (liquidHeight * fillRatio) / 2
      const streamLength = Math.max(0.05, liquidHeight * 1.2 - liquidHeight * fillRatio)
      streamRef.current.scale.y = streamLength / Math.max(liquidHeight, 0.01)
      streamRef.current.position.y = liquidHeight * fillRatio + streamLength / 2
      streamRef.current.visible = p < 0.98
    }

    if (mode === 'feces_pour' && pileRef.current && streamRef.current) {
      const s = 0.12 + p * 0.88
      pileRef.current.scale.set(s, s, s)
      const visibleHeight = coneHeight * s
      const streamLength = Math.max(0.08, coneHeight * 1.15 - visibleHeight)
      streamRef.current.scale.y = streamLength / Math.max(coneHeight, 0.01)
      streamRef.current.position.y = visibleHeight + streamLength / 2
      streamRef.current.visible = p < 0.98
    }

    if (mode === 'cube' && cubeRef.current) {
      const s = 0.85 + p * 0.15
      cubeRef.current.scale.set(s, s, s)
    }

    if (
      mode === 'instanced_pile' &&
      itemCount &&
      itemRadius &&
      itemHeight &&
      (canInstancesRef.current ||
        rollOuterRef.current ||
        rollInnerRef.current ||
        rollTopRef.current ||
        rollBottomRef.current)
    ) {
      const renderIndices = renderIndicesRef.current
      const renderCount = Math.max(1, renderIndices.length)
      const startY = pileHeight + Math.max(0.7, pileHeight * 0.5)
      const canDiameter = itemRadius * 2
      const horizontalGap = canDiameter * 1.06
      const rowGap = horizontalGap * 0.8660254
      const verticalGap = itemHeight * 1.02
      const baseSide = baseSideRef.current
      const stackGap = itemRadius * 2.35
      const stackVerticalGap = itemHeight * 1.01

      const findStackForIndex = (index: number) => {
        const starts = stackStartsRef.current
        const caps = stackCapsRef.current
        let lo = 0
        let hi = starts.length - 1
        while (lo <= hi) {
          const mid = (lo + hi) >> 1
          const start = starts[mid]
          const end = start + caps[mid]
          if (index < start) hi = mid - 1
          else if (index >= end) lo = mid + 1
          else return { stack: mid, offset: index - start }
        }
        const fallback = Math.max(0, starts.length - 1)
        return { stack: fallback, offset: 0 }
      }

      const coordsForIndex = (index: number) => {
        let layer = 0
        let layerSide = 1
        let row = 0
        let col = 0
        let x = 0
        let z = 0

        if (itemStackStyle === 'chips_columns') {
          const stackMeta = findStackForIndex(index)
          const grid = stackGridRef.current
          const gx = stackMeta.stack % grid.cols
          const gz = Math.floor(stackMeta.stack / grid.cols)
          x = (gx - (grid.cols - 1) / 2) * stackGap
          z = (gz - (grid.rows - 1) / 2) * stackGap
          layer = stackMeta.offset
          layerSide = 1
        } else {
          const decoded = decomposeStackIndex(index, baseSide)
          layer = decoded.layer
          layerSide = decoded.layerSide
          row = decoded.row
          col = decoded.col

          const xRaw = col * horizontalGap + row * horizontalGap * 0.5
          const zRaw = row * rowGap
          const centroidX = ((layerSide - 1) * horizontalGap) / 2
          const centroidZ = ((layerSide - 1) * rowGap) / 3
          x = xRaw - centroidX
          z = zRaw - centroidZ
        }

        const jitter = itemRadius * (itemStackStyle === 'chips_columns' ? 0.01 : 0.045)
        const noiseA = Math.sin(index * 12.9898) * 43758.5453
        const noiseB = Math.sin((index + 91) * 78.233) * 12345.6789
        x += (noiseA - Math.floor(noiseA) - 0.5) * jitter
        z += (noiseB - Math.floor(noiseB) - 0.5) * jitter

        const yBase =
          itemStackStyle === 'chips_columns'
            ? layer * stackVerticalGap + itemHeight * 0.5
            : layer * verticalGap + itemHeight * 0.5
        return { x, z, yBase }
      }

      const morphT = progressRef.current > 1 ? 1 : 0

      for (let renderIdx = 0; renderIdx < renderCount; renderIdx++) {
        const finalIndex = renderIndices[renderIdx]
        const fillIndex = fillIndicesRef.current[renderIdx] ?? finalIndex
        const from = coordsForIndex(fillIndex)
        const to = coordsForIndex(finalIndex)
        const targetX = from.x + (to.x - from.x) * morphT
        const targetZ = from.z + (to.z - from.z) * morphT
        const targetY = from.yBase + (to.yBase - from.yBase) * morphT

        const localT = Math.max(0, Math.min(1, p * renderCount - renderIdx))
        const eased = 1 - Math.pow(1 - localT, 3)
        const y = startY + (targetY - startY) * eased
        const settle = 1 - eased
        const tilt = settle * (itemStackStyle === 'chips_columns' ? 0.015 : 0.06)
        const hasLanded = eased >= 0.995
        tempObj.current.position.set(targetX, hasLanded ? targetY : y, targetZ)
        tempObj.current.rotation.set(
          tilt * Math.sin(finalIndex * 0.77),
          (finalIndex * 0.31) % (Math.PI * 2),
          tilt * Math.cos(finalIndex * 0.61),
        )
        tempObj.current.scale.setScalar(hasLanded ? 1 : 0)
        tempObj.current.updateMatrix()
        if (canInstancesRef.current)
          canInstancesRef.current.setMatrixAt(renderIdx, tempObj.current.matrix)
        if (canBandRef.current) canBandRef.current.setMatrixAt(renderIdx, tempObj.current.matrix)
        if (rollOuterRef.current)
          rollOuterRef.current.setMatrixAt(renderIdx, tempObj.current.matrix)
        if (rollInnerRef.current)
          rollInnerRef.current.setMatrixAt(renderIdx, tempObj.current.matrix)
        if (rollTopRef.current || rollBottomRef.current) {
          capQuat.current.copy(tempObj.current.quaternion).multiply(capTiltQuat.current)

          if (rollTopRef.current) {
            capOffset.current
              .set(0, itemHeight * 0.5, 0)
              .applyQuaternion(tempObj.current.quaternion)
            capTopObj.current.position.copy(tempObj.current.position).add(capOffset.current)
            capTopObj.current.quaternion.copy(capQuat.current)
            capTopObj.current.scale.copy(tempObj.current.scale)
            capTopObj.current.updateMatrix()
            rollTopRef.current.setMatrixAt(renderIdx, capTopObj.current.matrix)
          }

          if (rollBottomRef.current) {
            capOffset.current
              .set(0, -itemHeight * 0.5, 0)
              .applyQuaternion(tempObj.current.quaternion)
            capBottomObj.current.position.copy(tempObj.current.position).add(capOffset.current)
            capBottomObj.current.quaternion.copy(capQuat.current)
            capBottomObj.current.scale.copy(tempObj.current.scale)
            capBottomObj.current.updateMatrix()
            rollBottomRef.current.setMatrixAt(renderIdx, capBottomObj.current.matrix)
          }
        }
      }

      if (canInstancesRef.current) {
        canInstancesRef.current.count = renderCount
        canInstancesRef.current.instanceMatrix.needsUpdate = true
      }
      if (canBandRef.current) {
        canBandRef.current.count = renderCount
        canBandRef.current.instanceMatrix.needsUpdate = true
      }
      if (rollOuterRef.current) {
        rollOuterRef.current.count = renderCount
        rollOuterRef.current.instanceMatrix.needsUpdate = true
      }
      if (rollInnerRef.current) {
        rollInnerRef.current.count = renderCount
        rollInnerRef.current.instanceMatrix.needsUpdate = true
      }
      if (rollTopRef.current) {
        rollTopRef.current.count = renderCount
        rollTopRef.current.instanceMatrix.needsUpdate = true
      }
      if (rollBottomRef.current) {
        rollBottomRef.current.count = renderCount
        rollBottomRef.current.instanceMatrix.needsUpdate = true
      }
    }
  })

  if (mode === 'liquid_fill') {
    const containerHeight = liquidHeight * 1.08
    return (
      <group>
        <mesh position={[0, containerHeight / 2, 0]} castShadow>
          <cylinderGeometry args={[liquidRadius, liquidRadius, containerHeight, 42]} />
          <meshStandardMaterial color='#8ea0b5' transparent opacity={0.2} />
        </mesh>
        <mesh ref={fillRef} position={[0, 0.002, 0]} castShadow>
          <cylinderGeometry args={[liquidRadius * 0.96, liquidRadius * 0.96, liquidHeight, 40]} />
          <meshStandardMaterial color={color} transparent opacity={0.82} roughness={0.2} />
        </mesh>
        <mesh ref={streamRef} position={[0, liquidHeight * 0.9, 0]} castShadow>
          <cylinderGeometry args={[liquidRadius * 0.08, liquidRadius * 0.09, liquidHeight, 16]} />
          <meshStandardMaterial color={color} transparent opacity={0.88} />
        </mesh>
      </group>
    )
  }

  if (mode === 'feces_pour') {
    return (
      <group>
        <mesh ref={pileRef} position={[0, coneHeight / 2, 0]} castShadow>
          <coneGeometry args={[coneRadius, coneHeight, 28]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
        <mesh ref={streamRef} position={[0, coneHeight * 0.95, 0]} castShadow>
          <cylinderGeometry args={[coneRadius * 0.08, coneRadius * 0.1, coneHeight, 12]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      </group>
    )
  }

  if (mode === 'instanced_pile') {
    const cappedCount = Math.max(1, Math.floor(Math.min(itemCount ?? 120, maxVisualItems ?? 1400)))
    const canR = itemRadius ?? 0.033
    const canH = itemHeight ?? 0.122
    const innerR = Math.max(0, Math.min(itemInnerRadius ?? 0, canR * 0.82))
    const isRoll = itemSurface === 'paper' && innerR > 0.002
    const isPizza = itemStackStyle === 'chips_columns'
    const isAluminum = !isRoll
    const materialColor = itemColor ?? (isPizza ? '#d6b27a' : isAluminum ? '#f5f8ff' : '#f2efe8')
    const bandColor = itemLabelBandColor ?? '#c72f2f'

    if (isRoll) {
      return (
        <group>
          <instancedMesh ref={rollOuterRef} args={[undefined, undefined, cappedCount]} castShadow>
            <cylinderGeometry args={[canR, canR, canH, 28, 1, true]} />
            <meshStandardMaterial color={materialColor} roughness={0.72} metalness={0.04} />
          </instancedMesh>
          <instancedMesh ref={rollInnerRef} args={[undefined, undefined, cappedCount]} castShadow>
            <cylinderGeometry args={[innerR, innerR, canH, 24, 1, true]} />
            <meshStandardMaterial color='#cbb99d' roughness={0.9} metalness={0} side={2} />
          </instancedMesh>
          <instancedMesh ref={rollTopRef} args={[undefined, undefined, cappedCount]} castShadow>
            <ringGeometry args={[innerR, canR, 28]} />
            <meshStandardMaterial
              color={materialColor}
              roughness={0.76}
              metalness={0.03}
              side={2}
            />
          </instancedMesh>
          <instancedMesh ref={rollBottomRef} args={[undefined, undefined, cappedCount]} castShadow>
            <ringGeometry args={[innerR, canR, 28]} />
            <meshStandardMaterial
              color={materialColor}
              roughness={0.76}
              metalness={0.03}
              side={2}
            />
          </instancedMesh>
        </group>
      )
    }

    return (
      <group>
        <instancedMesh ref={canInstancesRef} args={[undefined, undefined, cappedCount]} castShadow>
          <cylinderGeometry args={[canR, canR, canH, 18]} />
          <meshStandardMaterial
            color={materialColor}
            roughness={isPizza ? 0.86 : isAluminum ? 0.12 : 0.68}
            metalness={isPizza ? 0.03 : isAluminum ? 0.98 : 0.05}
            emissive={isPizza ? '#5a3e1d' : isAluminum ? '#aeb8c7' : '#000000'}
            emissiveIntensity={isPizza ? 0.05 : isAluminum ? 0.16 : 0}
            envMapIntensity={isPizza ? 0.5 : isAluminum ? 1.3 : 0.7}
          />
        </instancedMesh>
        {!isPizza && (
          <instancedMesh ref={canBandRef} args={[undefined, undefined, cappedCount]} castShadow>
            <cylinderGeometry args={[canR * 1.006, canR * 1.006, canH * 0.34, 18]} />
            <meshStandardMaterial
              color={bandColor}
              roughness={0.4}
              metalness={0.15}
              emissive={bandColor}
              emissiveIntensity={0.08}
            />
          </instancedMesh>
        )}
      </group>
    )
  }

  return (
    <mesh ref={cubeRef} position={[0, side / 2, 0]} castShadow>
      <boxGeometry args={[side, side, side]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.03} />
    </mesh>
  )
}

export function HumanAndWasteScene({
  wasteSideMeters,
  wasteHeightMeters,
  wasteHalfWidthMeters,
  wasteColor,
  wasteMassKg,
  wasteLiters,
  isLiquid,
  humanHeightMeters,
  humanMassKg,
  sceneExtent,
  backgroundPreset,
  wasteMode,
  animationToken,
  wasteCount,
  wasteItemRadiusMeters,
  wasteItemHeightMeters,
  wasteItemInnerRadiusMeters,
  wasteMaxVisualItems,
  wasteItemSurface,
  wasteItemColor,
  wasteItemLabelBandColor,
  wasteItemStackStyle,
  wasteItemLabel,
  secondaryWaste,
}: SceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const initialCameraRef = useRef<[number, number, number] | null>(null)
  const initialTargetRef = useRef<[number, number, number] | null>(null)

  const humanX = sceneAnchors.humanX
  const humanHalfWidth = sceneAnchors.humanHalfWidth
  const gapFromHuman = sceneAnchors.gapFromHuman
  const gapBetweenObjects = sceneAnchors.gapBetweenObjects
  const wasteX = humanX + humanHalfWidth + gapFromHuman + wasteHalfWidthMeters
  const secondaryWasteX = secondaryWaste
    ? wasteX + wasteHalfWidthMeters + gapBetweenObjects + secondaryWaste.halfWidthMeters
    : null
  const humanScale = humanHeightMeters / 1.75
  const guideZ = sceneAnchors.guideZ
  const tickHalfWidth = sceneAnchors.tickHalfWidth
  const guideOffset = sceneAnchors.guideOffset
  const humanGuideX = humanX - guideOffset
  const wasteGuideX = wasteX - wasteHalfWidthMeters - guideOffset
  const secondaryGuideX =
    secondaryWasteX !== null && secondaryWaste
      ? secondaryWasteX + secondaryWaste.halfWidthMeters + guideOffset
      : null
  const haloColor = '#ffffff'
  const coreColor = '#1f2b38'

  if (!initialCameraRef.current) {
    initialCameraRef.current = [
      -sceneExtent * 0.95,
      Math.max(2.1, sceneExtent * 0.72),
      sceneExtent * 1.05,
    ]
  }
  if (!initialTargetRef.current) {
    initialTargetRef.current = [
      (humanX + (secondaryWasteX ?? wasteX)) / 2 - 0.2,
      Math.max(humanHeightMeters, wasteHeightMeters) * 0.45,
      0,
    ]
  }

  useEffect(() => {
    if (!controlsRef.current || !initialTargetRef.current) return
    controlsRef.current.target.set(
      initialTargetRef.current[0],
      initialTargetRef.current[1],
      initialTargetRef.current[2],
    )
    controlsRef.current.update()
  }, [])

  const coneRatio = 0.58
  const coneHeight = wasteMode === 'feces_pour' ? wasteHeightMeters : wasteSideMeters
  const coneRadius =
    wasteMode === 'feces_pour' ? wasteHeightMeters * coneRatio : wasteSideMeters / 2
  const formatWholeCount = (value: number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value))
  const wasteCountLabel =
    wasteCount !== undefined ? `${formatWholeCount(wasteCount)} ${wasteItemLabel ?? 'Items'}` : ''
  const wasteBaseLabel = isLiquid
    ? `${formatLiters(wasteLiters)}\n(${formatMass(wasteMassKg)})`
    : formatMass(wasteMassKg)
  const wasteLabelLines = [
    ...(wasteCountLabel ? [wasteCountLabel] : []),
    ...wasteBaseLabel.split('\n'),
    `${formatAdaptive(wasteHeightMeters)} m`,
  ]
  const wasteLabel = wasteLabelLines.join('\n')
  const secondaryConeHeight =
    secondaryWaste?.mode === 'feces_pour'
      ? secondaryWaste.heightMeters
      : (secondaryWaste?.sideMeters ?? 0)
  const secondaryConeRadius =
    secondaryWaste?.mode === 'feces_pour'
      ? secondaryWaste.halfWidthMeters
      : (secondaryWaste?.sideMeters ?? 0) / 2
  const secondaryLabel = secondaryWaste
    ? (() => {
        const secondaryCountLabel =
          secondaryWaste.count !== undefined
            ? `${formatWholeCount(secondaryWaste.count)} ${secondaryWaste.itemLabel ?? 'Items'}`
            : ''
        const secondaryBaseLabel = secondaryWaste.isLiquid
          ? `${formatLiters(secondaryWaste.liters)}\n(${formatMass(secondaryWaste.massKg)})`
          : formatMass(secondaryWaste.massKg)
        const lines = [
          ...(secondaryCountLabel ? [secondaryCountLabel] : []),
          ...secondaryBaseLabel.split('\n'),
          `${formatAdaptive(secondaryWaste.heightMeters)} m`,
        ]
        return lines.join('\n')
      })()
    : ''

  return (
    <Canvas camera={{ position: initialCameraRef.current, fov: 45 }} shadows>
      <color
        attach='background'
        args={[
          backgroundPreset === 'gym_hall'
            ? '#e6ddd0'
            : backgroundPreset === 'studio'
              ? '#eef3fa'
              : '#f5f7fb',
        ]}
      />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[6, 8, 6]}
        intensity={0.9}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <SceneBackdrop preset={backgroundPreset} />

      <HumanModel humanX={humanX} humanScale={humanScale} />
      <group position={[wasteX, 0, 0]}>
        <WasteBody
          side={wasteSideMeters}
          color={wasteColor}
          mode={wasteMode}
          animationToken={animationToken}
          coneHeight={coneHeight}
          coneRadius={coneRadius}
          liquidHeight={wasteHeightMeters}
          liquidRadius={wasteHalfWidthMeters}
          pileHeight={wasteHeightMeters}
          pileRadius={wasteHalfWidthMeters}
          itemCount={wasteCount}
          itemRadius={wasteItemRadiusMeters}
          itemHeight={wasteItemHeightMeters}
          itemInnerRadius={wasteItemInnerRadiusMeters}
          maxVisualItems={wasteMaxVisualItems}
          itemSurface={wasteItemSurface}
          itemColor={wasteItemColor}
          itemLabelBandColor={wasteItemLabelBandColor}
          itemStackStyle={wasteItemStackStyle}
        />
      </group>
      {secondaryWaste && secondaryWasteX !== null && (
        <group position={[secondaryWasteX, 0, 0]}>
          <WasteBody
            side={secondaryWaste.sideMeters}
            color={secondaryWaste.color}
            mode={secondaryWaste.mode}
            animationToken={`${animationToken}-secondary`}
            coneHeight={secondaryConeHeight}
            coneRadius={secondaryConeRadius}
            liquidHeight={secondaryWaste.heightMeters}
            liquidRadius={secondaryWaste.halfWidthMeters}
            pileHeight={secondaryWaste.heightMeters}
            pileRadius={secondaryWaste.halfWidthMeters}
            itemCount={secondaryWaste.count}
            itemRadius={secondaryWaste.itemRadiusMeters}
            itemHeight={secondaryWaste.itemHeightMeters}
            itemInnerRadius={secondaryWaste.itemInnerRadiusMeters}
            maxVisualItems={secondaryWaste.maxVisualItems}
            itemSurface={secondaryWaste.itemSurface}
            itemColor={secondaryWaste.itemColor}
            itemLabelBandColor={secondaryWaste.itemLabelBandColor}
            itemStackStyle={secondaryWaste.itemStackStyle}
          />
        </group>
      )}

      <Line
        points={[
          [humanGuideX, 0, guideZ],
          [humanGuideX, humanHeightMeters, guideZ],
        ]}
        color={haloColor}
        lineWidth={3.6}
        depthTest={false}
        renderOrder={10}
      />
      <Line
        points={[
          [humanGuideX - tickHalfWidth, 0, guideZ],
          [humanGuideX + tickHalfWidth, 0, guideZ],
        ]}
        color={haloColor}
        lineWidth={3.6}
        depthTest={false}
        renderOrder={10}
      />
      <Line
        points={[
          [humanGuideX - tickHalfWidth, humanHeightMeters, guideZ],
          [humanGuideX + tickHalfWidth, humanHeightMeters, guideZ],
        ]}
        color={haloColor}
        lineWidth={3.6}
        depthTest={false}
        renderOrder={10}
      />
      <Line
        points={[
          [humanGuideX, 0, guideZ],
          [humanGuideX, humanHeightMeters, guideZ],
        ]}
        color={coreColor}
        lineWidth={1.6}
        depthTest={false}
        renderOrder={11}
      />
      <Line
        points={[
          [humanGuideX - tickHalfWidth, 0, guideZ],
          [humanGuideX + tickHalfWidth, 0, guideZ],
        ]}
        color={coreColor}
        lineWidth={1.6}
        depthTest={false}
        renderOrder={11}
      />
      <Line
        points={[
          [humanGuideX - tickHalfWidth, humanHeightMeters, guideZ],
          [humanGuideX + tickHalfWidth, humanHeightMeters, guideZ],
        ]}
        color={coreColor}
        lineWidth={1.6}
        depthTest={false}
        renderOrder={11}
      />
      <Text
        position={[humanGuideX - 0.2, humanHeightMeters + 0.13, guideZ]}
        color={coreColor}
        fontSize={0.125}
        outlineWidth={0.025}
        outlineColor={haloColor}
        material-depthTest={false}
        renderOrder={12}
        anchorX='center'
        anchorY='middle'
      >
        {`${formatAdaptive(humanHeightMeters)} m`}
      </Text>
      <Text
        position={[humanGuideX - 0.2, humanHeightMeters - 0.05, guideZ]}
        color={coreColor}
        fontSize={0.105}
        outlineWidth={0.025}
        outlineColor={haloColor}
        material-depthTest={false}
        renderOrder={12}
        anchorX='center'
        anchorY='middle'
      >
        {formatMass(humanMassKg)}
      </Text>

      <Line
        points={[
          [wasteGuideX, 0, guideZ],
          [wasteGuideX, wasteHeightMeters, guideZ],
        ]}
        color={haloColor}
        lineWidth={3.6}
        depthTest={false}
        renderOrder={10}
      />
      <Line
        points={[
          [wasteGuideX - tickHalfWidth, 0, guideZ],
          [wasteGuideX + tickHalfWidth, 0, guideZ],
        ]}
        color={haloColor}
        lineWidth={3.6}
        depthTest={false}
        renderOrder={10}
      />
      <Line
        points={[
          [wasteGuideX - tickHalfWidth, wasteHeightMeters, guideZ],
          [wasteGuideX + tickHalfWidth, wasteHeightMeters, guideZ],
        ]}
        color={haloColor}
        lineWidth={3.6}
        depthTest={false}
        renderOrder={10}
      />
      <Line
        points={[
          [wasteGuideX, 0, guideZ],
          [wasteGuideX, wasteHeightMeters, guideZ],
        ]}
        color={coreColor}
        lineWidth={1.6}
        depthTest={false}
        renderOrder={11}
      />
      <Line
        points={[
          [wasteGuideX - tickHalfWidth, 0, guideZ],
          [wasteGuideX + tickHalfWidth, 0, guideZ],
        ]}
        color={coreColor}
        lineWidth={1.6}
        depthTest={false}
        renderOrder={11}
      />
      <Line
        points={[
          [wasteGuideX - tickHalfWidth, wasteHeightMeters, guideZ],
          [wasteGuideX + tickHalfWidth, wasteHeightMeters, guideZ],
        ]}
        color={coreColor}
        lineWidth={1.6}
        depthTest={false}
        renderOrder={11}
      />
      <Text
        position={[wasteGuideX, wasteHeightMeters + 0.26, guideZ]}
        color={coreColor}
        fontSize={0.105}
        lineHeight={1.15}
        outlineWidth={0.025}
        outlineColor={haloColor}
        material-depthTest={false}
        renderOrder={12}
        anchorX='center'
        anchorY='middle'
      >
        {wasteLabel}
      </Text>
      {secondaryWaste && secondaryGuideX !== null && (
        <>
          <Line
            points={[
              [secondaryGuideX, 0, guideZ],
              [secondaryGuideX, secondaryWaste.heightMeters, guideZ],
            ]}
            color={haloColor}
            lineWidth={3.6}
            depthTest={false}
            renderOrder={10}
          />
          <Line
            points={[
              [secondaryGuideX - tickHalfWidth, 0, guideZ],
              [secondaryGuideX + tickHalfWidth, 0, guideZ],
            ]}
            color={haloColor}
            lineWidth={3.6}
            depthTest={false}
            renderOrder={10}
          />
          <Line
            points={[
              [secondaryGuideX - tickHalfWidth, secondaryWaste.heightMeters, guideZ],
              [secondaryGuideX + tickHalfWidth, secondaryWaste.heightMeters, guideZ],
            ]}
            color={haloColor}
            lineWidth={3.6}
            depthTest={false}
            renderOrder={10}
          />
          <Line
            points={[
              [secondaryGuideX, 0, guideZ],
              [secondaryGuideX, secondaryWaste.heightMeters, guideZ],
            ]}
            color={coreColor}
            lineWidth={1.6}
            depthTest={false}
            renderOrder={11}
          />
          <Line
            points={[
              [secondaryGuideX - tickHalfWidth, 0, guideZ],
              [secondaryGuideX + tickHalfWidth, 0, guideZ],
            ]}
            color={coreColor}
            lineWidth={1.6}
            depthTest={false}
            renderOrder={11}
          />
          <Line
            points={[
              [secondaryGuideX - tickHalfWidth, secondaryWaste.heightMeters, guideZ],
              [secondaryGuideX + tickHalfWidth, secondaryWaste.heightMeters, guideZ],
            ]}
            color={coreColor}
            lineWidth={1.6}
            depthTest={false}
            renderOrder={11}
          />
          <Text
            position={[secondaryGuideX, secondaryWaste.heightMeters + 0.26, guideZ]}
            color={coreColor}
            fontSize={0.105}
            lineHeight={1.15}
            outlineWidth={0.025}
            outlineColor={haloColor}
            material-depthTest={false}
            renderOrder={12}
            anchorX='center'
            anchorY='middle'
          >
            {secondaryLabel}
          </Text>
        </>
      )}

      <OrbitControls ref={controlsRef} />
    </Canvas>
  )
}
