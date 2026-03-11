import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D, Quaternion, Vector3 } from 'three'
import type { InstancedMesh, Mesh } from 'three'
import type { WasteRenderMode } from './types'

export function WasteBody({
  side,
  color,
  mode,
  animationToken,
  coneHeight,
  coneRadius,
  liquidHeight,
  liquidRadius,
  pileHeight,
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

