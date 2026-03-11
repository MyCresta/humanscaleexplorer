export const guideStyle = {
  z: 0.85,
  tickHalfWidth: 0.12,
  offset: 0.55,
  haloColor: '#ffffff',
  coreColor: '#1f2b38',
  haloLineWidth: 3.6,
  coreLineWidth: 1.6,
  textFontSize: 0.105,
  humanHeightFontSize: 0.125,
  outlineWidth: 0.025,
  labelYOffset: 0.26,
} as const

export const gymHallStyle = {
  colors: {
    wall: '#ece8df',
    trim: '#bdb3a4',
    wood: '#d6ad74',
    courtLine: '#f7f8fb',
    backPanel: '#d8d1c6',
    door: '#76818f',
    doorFrame: '#939eaa',
    backboard: '#f9fbff',
    hoop: '#d95f2e',
    benchTop: '#7c664f',
    benchLeg: '#5a4a39',
    ladderRail: '#d7c4a7',
    ladderRung: '#bea47f',
  },
  floor: {
    plankWidth: 0.24,
    plankLength: 4.8,
    rowLineWidthBase: 0.45,
    rowLineWidthVariance: 0.18,
    colLineWidthBase: 0.42,
    colLineWidthVariance: 0.12,
  },
  courtLineWidth: {
    boundary: 2,
    center: 1.8,
    circle: 1.6,
    key: 1.5,
    freeThrowArc: 1.3,
  },
} as const

