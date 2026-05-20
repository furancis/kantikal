export type ApiCapabilityStatus = 'implemented' | 'planned' | 'blocked' | 'unsupported' | 'deprecated'
export type AuthBoundary = 'server' | 'none' | 'external-worker'

export type ApiCoverageEntry = {
  capability: string
  uiSurface: string
  backendOwner: string
  status: ApiCapabilityStatus
  authBoundary: AuthBoundary
  adapterAction: string
}

export const apiCoverageEntries: ApiCoverageEntry[] = [
  entry('Create song', 'Creation Canvas batch node', 'Suno adapter', 'implemented', 'server', 'generateBatch'),
  entry('Custom mode', 'Prompt/lyrics inspector', 'Suno adapter', 'implemented', 'server', 'generateBatch'),
  entry('Instrumental', 'Prompt/lyrics inspector', 'Suno adapter', 'planned', 'server', 'generateBatch'),
  entry('Lyrics generation', 'Lyrics card', 'Suno adapter', 'planned', 'server', 'generateLyrics'),
  entry('Model/version selection', 'Prompt inspector', 'Suno adapter', 'planned', 'server', 'selectModelVersion'),
  entry('Upload/reference audio', 'Brief and voice cards', 'Upload adapter', 'planned', 'server', 'uploadReferenceAudio'),
  entry('Base64 file upload', 'Upload drawer', 'Upload adapter', 'planned', 'server', 'uploadBase64File'),
  entry('File stream upload', 'Upload drawer', 'Upload adapter', 'planned', 'server', 'uploadFileStream'),
  entry('URL file upload', 'Upload drawer', 'Upload adapter', 'planned', 'server', 'uploadFileUrl'),
  entry('Personas', 'Voice card and library', 'Identity adapter', 'planned', 'server', 'generatePersona'),
  entry('Custom voice availability', 'Voice card verification', 'Identity adapter', 'planned', 'server', 'checkVoiceAvailability'),
  entry('Custom voice creation', 'Voice card verification', 'Identity adapter', 'planned', 'server', 'createCustomVoice'),
  entry('Custom voice record lookup', 'Voice card verification', 'Identity adapter', 'planned', 'server', 'getCustomVoiceRecord'),
  entry('Voice validation phrase generation', 'Voice card verification', 'Identity adapter', 'planned', 'server', 'generateVoiceValidationPhrase'),
  entry('Voice validation phrase lookup', 'Voice card verification', 'Identity adapter', 'planned', 'server', 'getVoiceValidationPhrase'),
  entry('Voice validation phrase regeneration', 'Voice card verification', 'Identity adapter', 'planned', 'server', 'regenerateVoiceValidationPhrase'),
  entry('Extend', 'Song Lab timeline', 'Suno adapter', 'planned', 'server', 'extendTrack'),
  entry('Upload and extend audio', 'Song Lab upload rail', 'Suno adapter', 'planned', 'server', 'uploadAndExtend'),
  entry('Cover', 'Song Lab action rail', 'Suno adapter', 'planned', 'server', 'coverTrack'),
  entry('Upload and cover audio', 'Song Lab upload rail', 'Suno adapter', 'planned', 'server', 'uploadAndCover'),
  entry('Remix/recreate', 'Song Lab version branch', 'Suno adapter', 'planned', 'server', 'remixTrack'),
  entry('Remaster', 'Song Lab version branch', 'Suno adapter', 'planned', 'server', 'remasterTrack'),
  entry('Replace section', 'Song Lab region editor', 'Suno adapter', 'planned', 'server', 'replaceSection'),
  entry('Add instrumental', 'Song Lab stem composer', 'Suno adapter', 'planned', 'server', 'addInstrumental'),
  entry('Add vocals', 'Song Lab stem composer', 'Suno adapter', 'planned', 'server', 'addVocals'),
  entry('Boost music style', 'Style stack action', 'Suno adapter', 'planned', 'server', 'boostMusicStyle'),
  entry('Generate mashup', 'Song Lab mashup lane', 'Suno adapter', 'planned', 'server', 'generateMashup'),
  entry('Generate sounds', 'Sound design card', 'Suno adapter', 'planned', 'server', 'generateSounds'),
  entry('Stems', 'Stem cards', 'Suno adapter', 'planned', 'server', 'separateStems'),
  entry('MIDI from audio', 'Stem cards', 'Suno adapter', 'planned', 'server', 'generateMidi'),
  entry('WAV conversion', 'Release Pack', 'Export service', 'planned', 'server', 'convertToWav'),
  entry('Status/queue', 'Queue strip and job drawer', 'Job service', 'planned', 'server', 'pollGenerationStatus'),
  entry('Lyrics task details', 'Queue strip and job drawer', 'Job service', 'planned', 'server', 'getLyricsGenerationDetails'),
  entry('Music video task details', 'Queue strip and job drawer', 'Job service', 'planned', 'server', 'getMusicVideoDetails'),
  entry('Cover art task details', 'Queue strip and job drawer', 'Job service', 'planned', 'server', 'getCoverArtDetails'),
  entry('MIDI task details', 'Queue strip and job drawer', 'Job service', 'planned', 'server', 'getMidiDetails'),
  entry('Audio separation details', 'Queue strip and job drawer', 'Job service', 'planned', 'server', 'getAudioSeparationDetails'),
  entry('WAV conversion details', 'Queue strip and job drawer', 'Job service', 'planned', 'server', 'getWavConversionDetails'),
  entry('Credits/cost', 'Cost guard', 'Job service', 'planned', 'server', 'getRemainingCredits'),
  entry('Timestamped lyrics', 'Lyrics card timeline', 'Suno adapter', 'planned', 'server', 'getTimestampedLyrics'),
  entry('Library list/search', 'Library', 'Library service', 'planned', 'server', 'listLibrary'),
  entry('Like/unlike', 'Library item action', 'Library service', 'planned', 'server', 'toggleLike'),
  entry('Archive/trash/delete', 'Cleanup console', 'Library service', 'planned', 'server', 'archiveOrDelete'),
  entry('Restore from trash/archive', 'Library cleanup console', 'Library service', 'planned', 'server', 'restoreArchivedItem'),
  entry('Visibility toggle', 'Library item action', 'Library service', 'planned', 'server', 'setVisibility'),
  entry('Cover art', 'Stems / release pack', 'Export service', 'planned', 'server', 'generateCoverArt'),
  entry('Waveform asset', 'Stems card', 'Export service', 'planned', 'server', 'exportWaveform'),
  entry('Download audio/stems', 'Release Pack', 'Export service', 'planned', 'server', 'downloadAudioAndStems'),
  entry('Lyrics/captions export', 'Release Pack', 'Export service', 'planned', 'server', 'exportLyricsAndCaptions'),
  entry('Release pack / provenance bundle', 'Release Pack', 'Export service', 'planned', 'none', 'buildReleasePack'),
  entry('Webhooks/retries', 'Operations console', 'Job service', 'planned', 'server', 'handleProviderCallback'),
  entry('Music-video render', 'MV lane', 'ComfyUI adapter', 'planned', 'external-worker', 'renderMusicVideo'),
  entry('Provider music video creation', 'MV lane', 'Suno adapter', 'planned', 'server', 'createProviderMusicVideo'),
  entry('Lipsync QA', 'MV lane export gate', 'QA service', 'planned', 'external-worker', 'evaluateLipsync'),
]

export function assertApiCoverageComplete(entries: ApiCoverageEntry[]): void {
  const seen = new Set<string>()

  for (const item of entries) {
    if (seen.has(item.capability)) {
      throw new Error(`Duplicate API coverage capability: ${item.capability}`)
    }
    seen.add(item.capability)

    if (!item.uiSurface || !item.backendOwner || !item.adapterAction) {
      throw new Error(`Incomplete API coverage entry: ${item.capability}`)
    }
  }
}

export function documentedCapabilities(markdown: string): string[] {
  return markdown
    .split(/\r?\n/)
    .filter((line) => line.startsWith('| '))
    .map((line) => line.split('|').map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 5)
    .filter((cells) => cells[1] !== 'Capability' && !cells[1].startsWith('---'))
    .map((cells) => cells[1])
}

export function providerAdapterActions(entries: ApiCoverageEntry[]): string[] {
  return Array.from(
    new Set(
      entries
        .filter((entryItem) => entryItem.authBoundary === 'server')
        .map((entryItem) => entryItem.adapterAction),
    ),
  ).sort()
}

export function apiCoverageStatusCounts(entries: ApiCoverageEntry[]): Record<ApiCapabilityStatus, number> {
  return {
    implemented: entries.filter((entryItem) => entryItem.status === 'implemented').length,
    planned: entries.filter((entryItem) => entryItem.status === 'planned').length,
    blocked: entries.filter((entryItem) => entryItem.status === 'blocked').length,
    unsupported: entries.filter((entryItem) => entryItem.status === 'unsupported').length,
    deprecated: entries.filter((entryItem) => entryItem.status === 'deprecated').length,
  }
}

function entry(
  capability: string,
  uiSurface: string,
  backendOwner: string,
  status: ApiCapabilityStatus,
  authBoundary: AuthBoundary,
  adapterAction: string,
): ApiCoverageEntry {
  return { capability, uiSurface, backendOwner, status, authBoundary, adapterAction }
}
