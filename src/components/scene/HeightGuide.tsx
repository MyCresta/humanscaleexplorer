import { Line, Text } from '@react-three/drei'
import { guideStyle } from '../../config/sceneStyle'

type HeightGuideProps = {
  x: number
  height: number
  label: string
  labelYOffset?: number
}

export function HeightGuide({ x, height, label, labelYOffset = guideStyle.labelYOffset }: HeightGuideProps) {
  return (
    <>
      <Line
        points={[
          [x, 0, guideStyle.z],
          [x, height, guideStyle.z],
        ]}
        color={guideStyle.haloColor}
        lineWidth={guideStyle.haloLineWidth}
        depthTest={false}
        renderOrder={10}
      />
      <Line
        points={[
          [x - guideStyle.tickHalfWidth, 0, guideStyle.z],
          [x + guideStyle.tickHalfWidth, 0, guideStyle.z],
        ]}
        color={guideStyle.haloColor}
        lineWidth={guideStyle.haloLineWidth}
        depthTest={false}
        renderOrder={10}
      />
      <Line
        points={[
          [x - guideStyle.tickHalfWidth, height, guideStyle.z],
          [x + guideStyle.tickHalfWidth, height, guideStyle.z],
        ]}
        color={guideStyle.haloColor}
        lineWidth={guideStyle.haloLineWidth}
        depthTest={false}
        renderOrder={10}
      />
      <Line
        points={[
          [x, 0, guideStyle.z],
          [x, height, guideStyle.z],
        ]}
        color={guideStyle.coreColor}
        lineWidth={guideStyle.coreLineWidth}
        depthTest={false}
        renderOrder={11}
      />
      <Line
        points={[
          [x - guideStyle.tickHalfWidth, 0, guideStyle.z],
          [x + guideStyle.tickHalfWidth, 0, guideStyle.z],
        ]}
        color={guideStyle.coreColor}
        lineWidth={guideStyle.coreLineWidth}
        depthTest={false}
        renderOrder={11}
      />
      <Line
        points={[
          [x - guideStyle.tickHalfWidth, height, guideStyle.z],
          [x + guideStyle.tickHalfWidth, height, guideStyle.z],
        ]}
        color={guideStyle.coreColor}
        lineWidth={guideStyle.coreLineWidth}
        depthTest={false}
        renderOrder={11}
      />
      <Text
        position={[x, height + labelYOffset, guideStyle.z]}
        color={guideStyle.coreColor}
        fontSize={guideStyle.textFontSize}
        lineHeight={1.15}
        outlineWidth={guideStyle.outlineWidth}
        outlineColor={guideStyle.haloColor}
        material-depthTest={false}
        renderOrder={12}
        anchorX='center'
        anchorY='middle'
      >
        {label}
      </Text>
    </>
  )
}

