import { memo, Suspense, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { Box3, MeshStandardMaterial, Vector3, type Mesh, type Object3D } from 'three'
import humanGlbUrl from '../../glb/homan.glb'

export const HumanModel = memo(function HumanModel({
  humanX,
  humanScale,
}: {
  humanX: number
  humanScale: number
}) {
  return (
    <group position={[humanX, 0, 0]} scale={[humanScale, humanScale, humanScale]}>
      <Suspense fallback={<ProceduralHuman />}>
        <HumanSilhouette />
      </Suspense>
    </group>
  )
})

function HumanSilhouette() {
  const gltf = useGLTF(humanGlbUrl)

  const { scene, normalizedScale, offset } = useMemo(() => {
    const root = gltf.scene.clone(true)
    const silhouetteMaterial = new MeshStandardMaterial({
      color: '#5b6673',
      roughness: 0.78,
      metalness: 0.06,
      emissive: '#1d2530',
      emissiveIntensity: 0.22,
    })

    root.traverse((obj: Object3D) => {
      const mesh = obj as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.material = silhouetteMaterial
    })

    const box = new Box3().setFromObject(root)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const modelHeight = Math.max(0.0001, size.y)

    // Normalize imported model to a 1.75m baseline.
    // The parent `humanScale` then maps this baseline to profile height.
    const baselineHeight = 1.75
    const normalizedScale = baselineHeight / modelHeight
    const offset: [number, number, number] = [
      -center.x * normalizedScale,
      -box.min.y * normalizedScale,
      -center.z * normalizedScale,
    ]

    return { scene: root, normalizedScale, offset }
  }, [gltf.scene])

  return (
    <group position={offset} rotation={[0, 0, 0]} scale={[normalizedScale, normalizedScale, normalizedScale]}>
      <primitive object={scene} />
    </group>
  )
}

function ProceduralHuman() {
  const fallbackColor = '#5b6673'
  const fallbackEmissive = '#1d2530'
  return (
    <group>
      <mesh position={[0, 1.66, 0]} castShadow>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial
          color={fallbackColor}
          roughness={0.78}
          metalness={0.06}
          emissive={fallbackEmissive}
          emissiveIntensity={0.22}
        />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.6, 8, 16]} />
        <meshStandardMaterial
          color={fallbackColor}
          roughness={0.78}
          metalness={0.06}
          emissive={fallbackEmissive}
          emissiveIntensity={0.22}
        />
      </mesh>
      <mesh position={[-0.3, 1.1, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.45, 8, 12]} />
        <meshStandardMaterial
          color={fallbackColor}
          roughness={0.78}
          metalness={0.06}
          emissive={fallbackEmissive}
          emissiveIntensity={0.22}
        />
      </mesh>
      <mesh position={[0.3, 1.1, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.45, 8, 12]} />
        <meshStandardMaterial
          color={fallbackColor}
          roughness={0.78}
          metalness={0.06}
          emissive={fallbackEmissive}
          emissiveIntensity={0.22}
        />
      </mesh>
      <mesh position={[-0.11, 0.45, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.55, 8, 12]} />
        <meshStandardMaterial
          color={fallbackColor}
          roughness={0.78}
          metalness={0.06}
          emissive={fallbackEmissive}
          emissiveIntensity={0.22}
        />
      </mesh>
      <mesh position={[0.11, 0.45, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.55, 8, 12]} />
        <meshStandardMaterial
          color={fallbackColor}
          roughness={0.78}
          metalness={0.06}
          emissive={fallbackEmissive}
          emissiveIntensity={0.22}
        />
      </mesh>
    </group>
  )
}

useGLTF.preload(humanGlbUrl)
