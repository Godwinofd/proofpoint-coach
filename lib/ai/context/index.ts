/**
 * AI context aggregator.
 *
 * Combines all domain knowledge modules into a single typed object.
 * Prompt builders can import individual named exports directly, or
 * import `aiContext` for a self-documenting reference to everything.
 *
 * Usage in a prompt builder:
 *
 *   import { aiContext } from '@/lib/ai/context'
 *   // then: aiContext.cybersecurity, aiContext.proofpoint, etc.
 *
 * Or import individual modules directly (preferred for tree-shaking):
 *
 *   import { cybersecurityContext } from '@/lib/ai/context/cybersecurity'
 */

import { cybersecurityContext } from './cybersecurity'
import { proofpointContext } from './proofpoint'
import { competitorsContext } from './competitors'
import { germanSalesContext } from './german-sales'

export { cybersecurityContext } from './cybersecurity'
export { proofpointContext } from './proofpoint'
export { competitorsContext } from './competitors'
export { germanSalesContext } from './german-sales'

/**
 * Aggregated AI context object.
 * Contains all structured domain knowledge injected into prompt builders.
 */
export const aiContext = {
    /** Cybersecurity threat categories, frameworks, and German-market specifics */
    cybersecurity: cybersecurityContext,

    /** Proofpoint product portfolio, differentiators, and ICP */
    proofpoint: proofpointContext,

    /** Competitive landscape: Microsoft Defender, Mimecast, Barracuda, Cisco */
    competitors: competitorsContext,

    /** German B2B sales culture, formality norms, and discovery question templates */
    germanSales: germanSalesContext,
} as const

export type AiContext = typeof aiContext
