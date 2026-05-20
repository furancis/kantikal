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
  entry('Instrumental', 'Prompt/lyrics inspector', 'Suno adapter', 'implemented', 'server', 'generateBatch'),
  entry('Lyrics generation', 'Lyrics card', 'Suno adapter', 'implemented', 'server', 'generateLyrics'),
  entry('Model/version selection', 'Prompt inspector', 'Suno adapter', 'implemented', 'server', 'selectModelVersion'),
  entry('Upload/reference audio', 'Brief and voice cards', 'Upload adapter', 'implemented', 'server', 'uploadReferenceAudio'),
  entry('Base64 file upload', 'Upload drawer', 'Upload adapter', 'implemented', 'server', 'uploadBase64File'),
  entry('File stream upload', 'Upload drawer', 'Upload adapter', 'blocked', 'server', 'uploadFileStream'),
  entry('URL file upload', 'Upload drawer', 'Upload adapter', 'implemented', 'server', 'uploadFileUrl'),
  entry('Personas', 'Voice card and library', 'Identity adapter', 'implemented', 'server', 'generatePersona'),
  entry('Custom voice availability', 'Voice card verification', 'Identity adapter', 'implemented', 'server', 'checkVoiceAvailability'),
  entry('Custom voice creation', 'Voice card verification', 'Identity adapter', 'implemented', 'server', 'createCustomVoice'),
  entry('Custom voice record lookup', 'Voice card verification', 'Identity adapter', 'implemented', 'server', 'getCustomVoiceRecord'),
  entry('Voice validation phrase generation', 'Voice card verification', 'Identity adapter', 'implemented', 'server', 'generateVoiceValidationPhrase'),
  entry('Voice validation phrase lookup', 'Voice card verification', 'Identity adapter', 'implemented', 'server', 'getVoiceValidationPhrase'),
  entry('Voice validation phrase regeneration', 'Voice card verification', 'Identity adapter', 'implemented', 'server', 'regenerateVoiceValidationPhrase'),
  entry('Extend', 'Song Lab timeline', 'Suno adapter', 'implemented', 'server', 'extendTrack'),
  entry('Upload and extend audio', 'Song Lab upload rail', 'Suno adapter', 'implemented', 'server', 'uploadAndExtend'),
  entry('Cover', 'Song Lab action rail', 'Suno adapter', 'implemented', 'server', 'coverTrack'),
  entry('Upload and cover audio', 'Song Lab upload rail', 'Suno adapter', 'implemented', 'server', 'uploadAndCover'),
  entry('Remix/recreate', 'Song Lab version branch', 'Suno adapter', 'unsupported', 'server', 'remixTrack'),
  entry('Remaster', 'Song Lab version branch', 'Suno adapter', 'unsupported', 'server', 'remasterTrack'),
  entry('Replace section', 'Song Lab region editor', 'Suno adapter', 'implemented', 'server', 'replaceSection'),
  entry('Add instrumental', 'Song Lab stem composer', 'Suno adapter', 'implemented', 'server', 'addInstrumental'),
  entry('Add vocals', 'Song Lab stem composer', 'Suno adapter', 'implemented', 'server', 'addVocals'),
  entry('Boost music style', 'Style stack action', 'Suno adapter', 'implemented', 'server', 'boostMusicStyle'),
  entry('Generate mashup', 'Song Lab mashup lane', 'Suno adapter', 'implemented', 'server', 'generateMashup'),
  entry('Generate sounds', 'Sound design card', 'Suno adapter', 'implemented', 'server', 'generateSounds'),
  entry('Stems', 'Stem cards', 'Suno adapter', 'implemented', 'server', 'separateStems'),
  entry('MIDI from audio', 'Stem cards', 'Suno adapter', 'implemented', 'server', 'generateMidi'),
  entry('WAV conversion', 'Release Pack', 'Export service', 'implemented', 'server', 'convertToWav'),
  entry('Status/queue', 'Queue strip and job drawer', 'Job service', 'implemented', 'server', 'pollGenerationStatus'),
  entry('Lyrics task details', 'Queue strip and job drawer', 'Job service', 'implemented', 'server', 'getLyricsGenerationDetails'),
  entry('Music video task details', 'Queue strip and job drawer', 'Job service', 'implemented', 'server', 'getMusicVideoDetails'),
  entry('Cover art task details', 'Queue strip and job drawer', 'Job service', 'implemented', 'server', 'getCoverArtDetails'),
  entry('MIDI task details', 'Queue strip and job drawer', 'Job service', 'implemented', 'server', 'getMidiDetails'),
  entry('Audio separation details', 'Queue strip and job drawer', 'Job service', 'implemented', 'server', 'getAudioSeparationDetails'),
  entry('WAV conversion details', 'Queue strip and job drawer', 'Job service', 'implemented', 'server', 'getWavConversionDetails'),
  entry('Credits/cost', 'Cost guard', 'Job service', 'implemented', 'server', 'getRemainingCredits'),
  entry('Timestamped lyrics', 'Lyrics card timeline', 'Suno adapter', 'implemented', 'server', 'getTimestampedLyrics'),
  entry('Library list/search', 'Library', 'Library service', 'unsupported', 'server', 'listLibrary'),
  entry('Like/unlike', 'Library item action', 'Library service', 'unsupported', 'server', 'toggleLike'),
  entry('Archive/trash/delete', 'Cleanup console', 'Library service', 'unsupported', 'server', 'archiveOrDelete'),
  entry('Restore from trash/archive', 'Library cleanup console', 'Library service', 'unsupported', 'server', 'restoreArchivedItem'),
  entry('Visibility toggle', 'Library item action', 'Library service', 'unsupported', 'server', 'setVisibility'),
  entry('Cover art', 'Stems / release pack', 'Export service', 'implemented', 'server', 'generateCoverArt'),
  entry('Waveform asset', 'Stems card', 'Export service', 'unsupported', 'server', 'exportWaveform'),
  entry('Download audio/stems', 'Release Pack', 'Export service', 'unsupported', 'server', 'downloadAudioAndStems'),
  entry('Lyrics/captions export', 'Release Pack', 'Export service', 'unsupported', 'server', 'exportLyricsAndCaptions'),
  entry('Release pack / provenance bundle', 'Release Pack', 'Export service', 'implemented', 'none', 'buildReleasePack'),
  entry('Webhooks/retries', 'Operations console', 'Job service', 'implemented', 'server', 'handleProviderCallback'),
  entry('Music-video render', 'MV lane', 'ComfyUI adapter', 'blocked', 'external-worker', 'renderMusicVideo'),
  entry('Provider music video creation', 'MV lane', 'Suno adapter', 'implemented', 'server', 'createProviderMusicVideo'),
  entry('Lipsync QA', 'MV lane export gate', 'QA service', 'blocked', 'external-worker', 'evaluateLipsync'),
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
