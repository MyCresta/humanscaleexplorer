import { useEffect, useRef } from 'react'
import { Canvas, } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { sceneAnchors } from '../config/sceneLayout'
import { guideStyle } from '../config/sceneStyle'
import { formatAdaptive, formatLiters, formatMass } from '../utils/format'
import { HeightGuide } from './scene/HeightGuide'
import { HumanModel } from './scene/HumanModel'
import { SceneBackdrop } from './scene/SceneBackdrop'
import { WasteBody } from './scene/WasteBody'
import type { SceneBackground, WasteRenderMode } from './scene/types'

export type { SceneBackground, WasteRenderMode }

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
  const humanGuideX = humanX - guideStyle.offset
  const wasteGuideX = wasteX - wasteHalfWidthMeters - guideStyle.offset
  const secondaryGuideX =
    secondaryWasteX !== null && secondaryWaste
      ? secondaryWasteX + secondaryWaste.halfWidthMeters + guideStyle.offset
      : null

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
  const wasteLabel = [...(wasteCountLabel ? [wasteCountLabel] : []), ...wasteBaseLabel.split('\n'), `${formatAdaptive(wasteHeightMeters)} m`].join('\n')

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
        return [...(secondaryCountLabel ? [secondaryCountLabel] : []), ...secondaryBaseLabel.split('\n'), `${formatAdaptive(secondaryWaste.heightMeters)} m`].join('\n')
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

      <HeightGuide x={humanGuideX} height={humanHeightMeters} label={`${formatAdaptive(humanHeightMeters)} m`} />
      <Text
        position={[humanGuideX - 0.2, humanHeightMeters - 0.05, guideStyle.z]}
        color={guideStyle.coreColor}
        fontSize={guideStyle.textFontSize}
        outlineWidth={guideStyle.outlineWidth}
        outlineColor={guideStyle.haloColor}
        material-depthTest={false}
        renderOrder={12}
        anchorX='center'
        anchorY='middle'
      >
        {formatMass(humanMassKg)}
      </Text>

      <HeightGuide x={wasteGuideX} height={wasteHeightMeters} label={wasteLabel} />

      {secondaryWaste && secondaryGuideX !== null && (
        <HeightGuide x={secondaryGuideX} height={secondaryWaste.heightMeters} label={secondaryLabel} />
      )}

      <OrbitControls ref={controlsRef} />
    </Canvas>
  )
}

