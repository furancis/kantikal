import type { ApiCoverageEntry, AuthBoundary } from './coverage'

export type ProviderActionExecution =
  | 'mock-live'
  | 'server-ready'
  | 'server-parameter'
  | 'local-only'
  | 'external-worker'
  | 'unsupported'

export type ProviderActionDefinition = {
  action: string
  label: string
  execution: ProviderActionExecution
  authBoundary: AuthBoundary
  method?: 'GET' | 'POST'
  path?: string
  docsUrl: string
  buttonLabel: string
}

const docsBase = 'https://docs.sunoapi.org'

export const providerActionDefinitions: ProviderActionDefinition[] = [
  server('generateBatch', 'Generate music', 'POST', '/api/v1/generate', '/suno-api/generate-music', 'mock-live'),
  server('generateLyrics', 'Generate lyrics', 'POST', '/api/v1/lyrics', '/suno-api/generate-lyrics'),
  serverParameter('selectModelVersion', 'Model/version selection', '/api/v1/generate', '/suno-api/generate-music'),
  server('uploadReferenceAudio', 'Upload reference audio', 'POST', '/api/file-url-upload', '/file-upload-api/upload-file-url'),
  server('uploadBase64File', 'Base64 file upload', 'POST', '/api/file-base64-upload', '/file-upload-api/upload-file-base-64'),
  server('uploadFileStream', 'File stream upload', 'POST', '/api/file-stream-upload', '/file-upload-api/upload-file-stream'),
  server('uploadFileUrl', 'URL file upload', 'POST', '/api/file-url-upload', '/file-upload-api/upload-file-url'),
  server('generatePersona', 'Generate persona', 'POST', '/api/v1/generate/generate-persona', '/suno-api/generate-persona'),
  server('checkVoiceAvailability', 'Check voice availability', 'POST', '/api/v1/voice/check-voice', '/suno-api/suno-voice-check-voice'),
  server('createCustomVoice', 'Create custom voice', 'POST', '/api/v1/voice/generate', '/suno-api/suno-voice-generate'),
  server('getCustomVoiceRecord', 'Get custom voice record', 'GET', '/api/v1/voice/record-info', '/suno-api/suno-voice-record-info'),
  server('generateVoiceValidationPhrase', 'Generate voice validation phrase', 'POST', '/api/v1/voice/validate', '/suno-api/suno-voice-validate'),
  server('getVoiceValidationPhrase', 'Get voice validation phrase', 'GET', '/api/v1/voice/validate-info', '/suno-api/suno-voice-validate-info'),
  server('regenerateVoiceValidationPhrase', 'Regenerate voice validation phrase', 'POST', '/api/v1/voice/regenerate', '/suno-api/suno-voice-regenerate'),
  server('extendTrack', 'Extend track', 'POST', '/api/v1/generate/extend', '/suno-api/extend-music'),
  server('uploadAndExtend', 'Upload and extend audio', 'POST', '/api/v1/generate/upload-extend', '/suno-api/upload-and-extend-audio'),
  server('coverTrack', 'Cover track', 'POST', '/api/v1/generate/upload-cover', '/suno-api/upload-and-cover-audio'),
  server('uploadAndCover', 'Upload and cover audio', 'POST', '/api/v1/generate/upload-cover', '/suno-api/upload-and-cover-audio'),
  unsupported('remixTrack', 'Remix/recreate', '/suno-api/index'),
  unsupported('remasterTrack', 'Remaster', '/suno-api/index'),
  server('replaceSection', 'Replace section', 'POST', '/api/v1/generate/replace-section', '/suno-api/replace-section'),
  server('addInstrumental', 'Add instrumental', 'POST', '/api/v1/generate/add-instrumental', '/suno-api/add-instrumental'),
  server('addVocals', 'Add vocals', 'POST', '/api/v1/generate/add-vocals', '/suno-api/add-vocals'),
  server('boostMusicStyle', 'Boost music style', 'POST', '/api/v1/style/generate', '/suno-api/boost-music-style'),
  server('generateMashup', 'Generate mashup', 'POST', '/api/v1/generate/mashup', '/suno-api/generate-mashup'),
  server('generateSounds', 'Generate sounds', 'POST', '/api/v1/generate/sounds', '/suno-api/generate-sounds'),
  server('separateStems', 'Separate stems', 'POST', '/api/v1/vocal-removal/generate', '/suno-api/separate-vocals-from-music'),
  server('generateMidi', 'Generate MIDI', 'POST', '/api/v1/midi/generate', '/suno-api/generate-midi'),
  server('convertToWav', 'Convert to WAV', 'POST', '/api/v1/wav/generate', '/suno-api/convert-to-wav-format'),
  server('pollGenerationStatus', 'Get music generation details', 'GET', '/api/v1/generate/record-info', '/suno-api/get-music-generation-details'),
  server('getLyricsGenerationDetails', 'Get lyrics generation details', 'GET', '/api/v1/lyrics/record-info', '/suno-api/get-lyrics-generation-details'),
  server('getMusicVideoDetails', 'Get music video details', 'GET', '/api/v1/mp4/record-info', '/suno-api/get-music-video-details'),
  server('getCoverArtDetails', 'Get cover art details', 'GET', '/api/v1/suno/cover/record-info', '/suno-api/get-cover-suno-details'),
  server('getMidiDetails', 'Get MIDI details', 'GET', '/api/v1/midi/record-info', '/suno-api/get-midi-details'),
  server('getAudioSeparationDetails', 'Get audio separation details', 'GET', '/api/v1/vocal-removal/record-info', '/suno-api/get-vocal-separation-details'),
  server('getWavConversionDetails', 'Get WAV conversion details', 'GET', '/api/v1/wav/record-info', '/suno-api/get-wav-conversion-details'),
  server('getRemainingCredits', 'Get remaining credits', 'GET', '/api/v1/generate/credit', '/suno-api/get-remaining-credits'),
  server('getTimestampedLyrics', 'Get timestamped lyrics', 'POST', '/api/v1/generate/get-timestamped-lyrics', '/suno-api/get-timestamped-lyrics'),
  unsupported('listLibrary', 'Library list/search', '/suno-api/index'),
  unsupported('toggleLike', 'Like/unlike', '/suno-api/index'),
  unsupported('archiveOrDelete', 'Archive/trash/delete', '/suno-api/index'),
  unsupported('restoreArchivedItem', 'Restore archived item', '/suno-api/index'),
  unsupported('setVisibility', 'Visibility toggle', '/suno-api/index'),
  server('generateCoverArt', 'Generate cover art', 'POST', '/api/v1/suno/cover/generate', '/suno-api/cover-suno'),
  unsupported('exportWaveform', 'Waveform asset export', '/suno-api/index'),
  unsupported('downloadAudioAndStems', 'Download audio/stems', '/suno-api/index'),
  unsupported('exportLyricsAndCaptions', 'Lyrics/captions export', '/suno-api/index'),
  local('buildReleasePack', 'Build release pack'),
  server('handleProviderCallback', 'Handle provider callback', 'POST', '/api/provider/callback', '/suno-api/index'),
  external('renderMusicVideo', 'Render music video', '/suno-api/create-music-video'),
  server('createProviderMusicVideo', 'Provider music video creation', 'POST', '/api/v1/mp4/generate', '/suno-api/create-music-video'),
  external('evaluateLipsync', 'Evaluate lipsync QA', '/suno-api/create-music-video'),
]

export function providerActionDefinitionByAction(action: string): ProviderActionDefinition | undefined {
  return providerActionDefinitions.find((definition) => definition.action === action)
}

export function assertProviderActionCatalogCovers(actions: string[]): void {
  const catalogActions = new Set(providerActionDefinitions.map((definition) => definition.action))
  const missing = actions.filter((action) => !catalogActions.has(action))
  if (missing.length > 0) {
    throw new Error(`Provider action catalog is missing: ${missing.join(', ')}`)
  }
}

export function actionStateForEntry(entry: ApiCoverageEntry): ProviderActionDefinition {
  const definition = providerActionDefinitionByAction(entry.adapterAction)
  if (!definition) {
    throw new Error(`No provider action definition for ${entry.adapterAction}`)
  }
  return definition
}

function server(
  action: string,
  label: string,
  method: 'GET' | 'POST',
  path: string,
  docsPath: string,
  execution: ProviderActionExecution = 'server-ready',
): ProviderActionDefinition {
  return {
    action,
    label,
    execution,
    authBoundary: 'server',
    method,
    path,
    docsUrl: `${docsBase}${docsPath}`,
    buttonLabel: execution === 'mock-live' ? 'Run mock action' : 'Check server action',
  }
}

function serverParameter(action: string, label: string, path: string, docsPath: string): ProviderActionDefinition {
  return {
    action,
    label,
    execution: 'server-parameter',
    authBoundary: 'server',
    method: 'POST',
    path,
    docsUrl: `${docsBase}${docsPath}`,
    buttonLabel: 'Show request parameter',
  }
}

function unsupported(action: string, label: string, docsPath: string): ProviderActionDefinition {
  return {
    action,
    label,
    execution: 'unsupported',
    authBoundary: 'server',
    docsUrl: `${docsBase}${docsPath}`,
    buttonLabel: 'Show unsupported state',
  }
}

function local(action: string, label: string): ProviderActionDefinition {
  return {
    action,
    label,
    execution: 'local-only',
    authBoundary: 'none',
    docsUrl: `${docsBase}/suno-api/index`,
    buttonLabel: 'Run local action',
  }
}

function external(action: string, label: string, docsPath: string): ProviderActionDefinition {
  return {
    action,
    label,
    execution: 'external-worker',
    authBoundary: 'external-worker',
    docsUrl: `${docsBase}${docsPath}`,
    buttonLabel: 'Show worker state',
  }
}
