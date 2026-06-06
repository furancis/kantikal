import type {
  GlassContainerProps,
  GlassProps,
  HtmlProps,
  LiquidCanvasProps,
  LiquidCanvasRef,
} from '@liquid-dom/react'

export const LIQUID_DOM_PRIMARY_PACKAGE = '@liquid-dom/react' as const

export const LIQUID_DOM_PRIMARY_EXPORTS = [
  'LiquidCanvas',
  'GlassContainer',
  'Glass',
  'Html',
  'Frame',
  'VStack',
  'HStack',
  'ZStack',
  'spring',
  'easing',
] as const

type RuntimeProbe = {
  navigator?: {
    gpu?: unknown
  }
  canvas2dPrototype?: {
    drawElement?: unknown
  }
}

export type LiquidDomRuntimeSupport = {
  webgpu: boolean
  canvasDrawElement: boolean
  rendererReady: boolean
  domBackedHtmlReady: boolean
  reviewFallbackRequired: boolean
  blockers: string[]
}

export type KantikalLiquidCanvasRef = LiquidCanvasRef

export type KantikalLiquidSurfaceProps = Pick<LiquidCanvasProps, 'children' | 'className' | 'style' | 'onError'> & {
  glass?: Pick<GlassContainerProps, 'blur' | 'spacing' | 'tint' | 'specularStrength'>
  instrument?: Pick<GlassProps, 'cornerRadius' | 'cornerSmoothing' | 'pointerEvents'>
  html?: Pick<HtmlProps, 'sizing' | 'opacity' | 'blur' | 'zIndex'>
}

export function detectLiquidDomRuntime(probe: RuntimeProbe = {}): LiquidDomRuntimeSupport {
  const navigatorLike =
    probe.navigator ??
    (typeof globalThis.navigator === 'undefined'
      ? undefined
      : (globalThis.navigator as RuntimeProbe['navigator']))
  const canvas2dPrototype = probe.canvas2dPrototype ?? getCanvas2dPrototype()

  const webgpu = Boolean(navigatorLike?.gpu)
  const canvasDrawElement = typeof canvas2dPrototype?.drawElement === 'function'
  const blockers = [
    ...(webgpu ? [] : ['WebGPU is unavailable on navigator.gpu.']),
    ...(canvasDrawElement ? [] : ['Canvas Draw Element is unavailable for DOM-backed Liquid DOM Html.']),
  ]

  return {
    webgpu,
    canvasDrawElement,
    rendererReady: webgpu,
    domBackedHtmlReady: webgpu && canvasDrawElement,
    reviewFallbackRequired: !webgpu || !canvasDrawElement,
    blockers,
  }
}

function getCanvas2dPrototype(): RuntimeProbe['canvas2dPrototype'] {
  if (typeof CanvasRenderingContext2D === 'undefined') {
    return undefined
  }

  return CanvasRenderingContext2D.prototype as RuntimeProbe['canvas2dPrototype']
}
