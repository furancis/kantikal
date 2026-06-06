import { describe, expect, it } from 'vitest'
import {
  detectLiquidDomRuntime,
  LIQUID_DOM_PRIMARY_EXPORTS,
  LIQUID_DOM_PRIMARY_PACKAGE,
} from './liquidDomCapability'

describe('Liquid DOM readiness', () => {
  it('pins Liquid DOM as the primary package for the Kantikal material system', async () => {
    const liquidDom = await import('@liquid-dom/react')

    expect(LIQUID_DOM_PRIMARY_PACKAGE).toBe('@liquid-dom/react')
    for (const exportName of LIQUID_DOM_PRIMARY_EXPORTS) {
      expect(liquidDom).toHaveProperty(exportName)
    }
  })

  it('reports full DOM-backed Liquid DOM support when WebGPU and Canvas Draw Element are present', () => {
    const support = detectLiquidDomRuntime({
      navigator: { gpu: {} },
      canvas2dPrototype: { drawElement: () => undefined },
    })

    expect(support).toEqual({
      webgpu: true,
      canvasDrawElement: true,
      rendererReady: true,
      domBackedHtmlReady: true,
      reviewFallbackRequired: false,
      blockers: [],
    })
  })

  it('keeps the fallback path as a runtime guard when Liquid DOM prerequisites are absent', () => {
    const support = detectLiquidDomRuntime({
      navigator: {},
      canvas2dPrototype: {},
    })

    expect(support.rendererReady).toBe(false)
    expect(support.domBackedHtmlReady).toBe(false)
    expect(support.reviewFallbackRequired).toBe(true)
    expect(support.blockers).toEqual([
      'WebGPU is unavailable on navigator.gpu.',
      'Canvas Draw Element is unavailable for DOM-backed Liquid DOM Html.',
    ])
  })
})
