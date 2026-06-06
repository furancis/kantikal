import type { ApiCoverageEntry, AuthBoundary } from './coverage'

export type ProviderActionExecution =
  | 'mock-live'
  | 'server-ready'
  | 'server-parameter'
  | 'inbound-handler'
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

const docsBase = 'https://docs.providerapi.org'

export const providerActionDefinitions: ProviderActionDefinition[] = [
  server('generateBatch', 'Generate music', 'POST', '/api/v1/generate', '/provider-api/generate-music', 'mock-live'),
  server('generateLyrics', 'Generate lyrics', 'POST', '/api/v1/lyrics', '/provider-api/generate-lyrics'),
  serverParameter('selectModelVersion', 'Model/version selection', '/api/v1/generate', '/provider-api/generate-music'),
  server('uploadReferenceAudio', 'Upload reference audio', 'POST', '/api/file-url-upload', '/file-upload-api/upload-file-url'),
  server('uploadBase64File', 'Base64 file upload', 'POST', '/api/file-base64-upload', '/file-upload-api/upload-file-base-64'),
  server('uploadFileStream', 'File stream upload', 'POST', '/api/file-stream-upload', '/file-upload-api/upload-file-stream'),
  server('uploadFileUrl', 'URL file upload', 'POST', '/api/file-url-upload', '/file-upload-api/upload-file-url'),
  server('generatePersona', 'Generate persona', 'POST', '/api/v1/generate/generate-persona', '/provider-api/generate-persona'),
  server('checkVoiceAvailability', 'Check voice availability', 'POST', '/api/v1/voice/check-voice', '/provider-api/provider-voice-check-voice'),
  server('createCustomVoice', 'Create custom voice', 'POST', '/api/v1/voice/generate', '/provider-api/provider-voice-generate'),
  server('getCustomVoiceRecord', 'Get custom voice record', 'GET', '/api/v1/voice/record-info', '/provider-api/provider-voice-record-info'),
  server('generateVoiceValidationPhrase', 'Generate voice validation phrase', 'POST', '/api/v1/voice/validate', '/provider-api/provider-voice-validate'),
  server('getVoiceValidationPhrase', 'Get voice validation phrase', 'GET', '/api/v1/voice/validate-info', '/provider-api/provider-voice-validate-info'),
  server('regenerateVoiceValidationPhrase', 'Regenerate voice validation phrase', 'POST', '/api/v1/voice/regenerate', '/provider-api/provider-voice-regenerate'),
  server('extendTrack', 'Extend track', 'POST', '/api/v1/generate/extend', '/provider-api/extend-music'),
  server('uploadAndExtend', 'Upload and extend audio', 'POST', '/api/v1/generate/upload-extend', '/provider-api/upload-and-extend-audio'),
  server('coverTrack', 'Cover track', 'POST', '/api/v1/generate/upload-cover', '/provider-api/upload-and-cover-audio'),
  server('uploadAndCover', 'Upload and cover audio', 'POST', '/api/v1/generate/upload-cover', '/provider-api/upload-and-cover-audio'),
  unsupported('remixTrack', 'Remix/recreate', '/provider-api/index'),
  unsupported('remasterTrack', 'Remaster', '/provider-api/index'),
  server('replaceSection', 'Replace section', 'POST', '/api/v1/generate/replace-section', '/provider-api/replace-section'),
  server('addInstrumental', 'Add instrumental', 'POST', '/api/v1/generate/add-instrumental', '/provider-api/add-instrumental'),
  server('addVocals', 'Add vocals', 'POST', '/api/v1/generate/add-vocals', '/provider-api/add-vocals'),
  server('boostMusicStyle', 'Boost music style', 'POST', '/api/v1/style/generate', '/provider-api/boost-music-style'),
  server('generateMashup', 'Generate mashup', 'POST', '/api/v1/generate/mashup', '/provider-api/generate-mashup'),
  server('generateSounds', 'Generate sounds', 'POST', '/api/v1/generate/sounds', '/provider-api/generate-sounds'),
  server('separateStems', 'Separate stems', 'POST', '/api/v1/vocal-removal/generate', '/provider-api/separate-vocals-from-music'),
  server('generateMidi', 'Generate MIDI', 'POST', '/api/v1/midi/generate', '/provider-api/generate-midi'),
  server('convertToWav', 'Convert to WAV', 'POST', '/api/v1/wav/generate', '/provider-api/convert-to-wav-format'),
  server('pollGenerationStatus', 'Get music generation details', 'GET', '/api/v1/generate/record-info', '/provider-api/get-music-generation-details'),
  server('getLyricsGenerationDetails', 'Get lyrics generation details', 'GET', '/api/v1/lyrics/record-info', '/provider-api/get-lyrics-generation-details'),
  server('getMusicVideoDetails', 'Get music video details', 'GET', '/api/v1/mp4/record-info', '/provider-api/get-music-video-details'),
  server('getCoverArtDetails', 'Get cover art details', 'GET', '/api/v1/provider/cover/record-info', '/provider-api/get-cover-provider-details'),
  server('getMidiDetails', 'Get MIDI details', 'GET', '/api/v1/midi/record-info', '/provider-api/get-midi-details'),
  server('getAudioSeparationDetails', 'Get audio separation details', 'GET', '/api/v1/vocal-removal/record-info', '/provider-api/get-vocal-separation-details'),
  server('getWavConversionDetails', 'Get WAV conversion details', 'GET', '/api/v1/wav/record-info', '/provider-api/get-wav-conversion-details'),
  server('getRemainingCredits', 'Get remaining credits', 'GET', '/api/v1/generate/credit', '/provider-api/get-remaining-credits'),
  server('getTimestampedLyrics', 'Get timestamped lyrics', 'POST', '/api/v1/generate/get-timestamped-lyrics', '/provider-api/get-timestamped-lyrics'),
  unsupported('listLibrary', 'Library list/search', '/provider-api/index'),
  unsupported('toggleLike', 'Like/unlike', '/provider-api/index'),
  unsupported('archiveOrDelete', 'Archive/trash/delete', '/provider-api/index'),
  unsupported('restoreArchivedItem', 'Restore archived item', '/provider-api/index'),
  unsupported('setVisibility', 'Visibility toggle', '/provider-api/index'),
  server('generateCoverArt', 'Generate cover art', 'POST', '/api/v1/provider/cover/generate', '/provider-api/cover-provider'),
  unsupported('exportWaveform', 'Waveform asset export', '/provider-api/index'),
  unsupported('downloadAudioAndStems', 'Download audio/stems', '/provider-api/index'),
  unsupported('exportLyricsAndCaptions', 'Lyrics/captions export', '/provider-api/index'),
  local('buildReleasePack', 'Build release pack'),
  inbound('handleProviderCallback', 'Handle provider callback', '/api/provider/callback'),
  external('renderMusicVideo', 'Render music video', '/provider-api/create-music-video'),
  server('createProviderMusicVideo', 'Provider music video creation', 'POST', '/api/v1/mp4/generate', '/provider-api/create-music-video'),
  external('evaluateLipsync', 'Evaluate lipsync QA', '/provider-api/create-music-video'),
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
    docsUrl: `${docsBase}/provider-api/index`,
    buttonLabel: 'Run local action',
  }
}

function inbound(action: string, label: string, path: string): ProviderActionDefinition {
  return {
    action,
    label,
    execution: 'inbound-handler',
    authBoundary: 'server',
    method: 'POST',
    path,
    docsUrl: `${docsBase}/provider-api/index`,
    buttonLabel: 'Show inbound handler',
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
