export const sceneAnchors = {
  humanX: -0.85,
  humanHalfWidth: 0.34,
  gapFromHuman: 1,
  gapBetweenObjects: 0.6,
  guideZ: 0.85,
  tickHalfWidth: 0.12,
  guideOffset: 0.55
} as const;

export const gymHallLayout = {
  hallHalfWidth: 20,
  hallDepth: 30,
  wallHeight: 11,
  court: {
    halfWidth: 7.5,
    halfLength: 14,
    keyHalfWidth: 2.45,
    keyDepth: 5.8,
    centerCircleR: 1.8,
    freeThrowR: 1.8
  },
  door: {
    x: 19.86,
    y: 1.05,
    z: -11.8,
    frameThickness: 0.08,
    width: 1.05,
    height: 2.05
  },
  hoops: [
    { x: -8.6, y: 3.7, z: -14.8 },
    { x: 9.1, y: 3.7, z: -14.8 }
  ],
  bench: {
    x: 11.6,
    y: 0.24,
    z: -14.65
  },
  ladders: {
    xPositions: [-3.6, -2.3, -1.0, 0.3],
    rungs: 10
  }
} as const;
