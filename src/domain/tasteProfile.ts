import type { BriefInput } from './workflow'

export type TasteProfile = {
  id: string
  requiredSignals: string[]
  antiSignals: string[]
  minimumScore: number
}

export type GenerationTasteEvaluation = {
  profileId: string
  score: number
  passed: boolean
  matchedSignals: string[]
  missingSignals: string[]
  blockers: string[]
  directive: string
}

export const likedTrackTasteProfile: TasteProfile = {
  id: 'liked-track-hybrid',
  requiredSignals: [
    'dynamic bass',
    'hard rhythmic punch',
    'melodic heavy edge',
    'cinematic synth lift',
    'warm controlled vocal identity',
    'bilingual Arabic-English intent',
    'remaster/mashup energy',
  ],
  antiSignals: [
    'machine choir',
    'neon wire',
    'empty line',
    'numbered sky',
    'fake shine',
    'generic fire',
    'dreams tonight',
    'heart on fire',
  ],
  minimumScore: 5,
}

const signalMatchers: Record<string, RegExp> = {
  'dynamic bass': /\b(dynamic|heavy|hard|deep|sub)\s+bass\b|\bbass\b/i,
  'hard rhythmic punch': /\b(hard|tight|precise|punch|drum|rhythm|transient|groove)\b/i,
  'melodic heavy edge': /\b(melodic metalcore|metalcore|heavy|guitar|edge|riff)\b/i,
  'cinematic synth lift': /\b(cinematic|synth|synthpop|lift|wide|lush)\b/i,
  'warm controlled vocal identity': /\b(warm|controlled|custom|voice|vocal|persona|identity|dry modern vocal)\b/i,
  'bilingual Arabic-English intent': /\b(arabic|english|bilingual|code-switch|khaliji|gulf)\b/i,
  'remaster/mashup energy': /\b(remaster|mashup|hybrid|modern|polished|pressure)\b/i,
}

export function evaluateGenerationTaste(
  input: BriefInput,
  profile: TasteProfile = likedTrackTasteProfile,
): GenerationTasteEvaluation {
  const text = `${input.brief}\n${input.lyrics}\n${input.style}\n${input.voice}`
  const matchedSignals = profile.requiredSignals.filter((signal) => signalMatchers[signal]?.test(text))
  const missingSignals = profile.requiredSignals.filter((signal) => !matchedSignals.includes(signal))
  const blockers = profile.antiSignals.filter((signal) => new RegExp(escapeRegExp(signal), 'i').test(text))
  const score = Math.max(0, matchedSignals.length - blockers.length * 2)

  return {
    profileId: profile.id,
    score,
    passed: score >= profile.minimumScore && blockers.length === 0,
    matchedSignals,
    missingSignals,
    blockers,
    directive: tasteDirective(profile, missingSignals),
  }
}

export function prepareTasteLockedBrief(
  input: BriefInput,
  evaluation = evaluateGenerationTaste(input),
): BriefInput {
  const directive = `Taste lock: ${evaluation.directive}`
  return {
    brief: appendDirective(input.brief, directive),
    lyrics: appendDirective(
      input.lyrics,
      'Quality lock: direct, adult, non-novelty writing; no filler metaphors; every line must serve rhythm, hook, or vocal identity.',
    ),
    style: appendDirective(
      input.style,
      'Liked-track fit: dynamic bass, hard rhythmic punch, melodic heavy edge, cinematic synth lift, remaster/mashup energy.',
    ),
    voice: appendDirective(input.voice, 'Vocal lock: warm controlled custom identity; no theatrical or parody delivery.'),
  }
}

function tasteDirective(profile: TasteProfile, missingSignals: string[]): string {
  const required = profile.requiredSignals.join(', ')
  const missing = missingSignals.length > 0 ? ` Missing signals to reinforce: ${missingSignals.join(', ')}.` : ''
  return `match ${profile.id}; require ${required}; avoid novelty/cliche language.${missing}`
}

function appendDirective(value: string, directive: string): string {
  return value.includes(directive) ? value : `${value.trim()}\n${directive}`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
