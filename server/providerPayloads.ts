import type { ExecuteProviderActionRequest } from '../src/api/provider'
import type { ProviderActionDefinition } from '../src/api/actionCatalog'

export type ProviderPayloadBuildResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; message: string }

export type ProviderPayloadBuildInput = {
  definition: ProviderActionDefinition
  request: ExecuteProviderActionRequest
  defaultCallbackUrl?: string
}

const defaultMusicModel = 'V5'
const defaultLegacyMusicModel = 'V4_5PLUS'
const defaultUploadPath = 'suno-visual-studio/uploads'

export function buildProviderActionPayload(input: ProviderPayloadBuildInput): ProviderPayloadBuildResult {
  const { definition, request } = input
  const source: Record<string, unknown> = request.payload ?? {}
  const callbackUrl = stringValue(source.callBackUrl) ?? stringValue(source.callbackUrl) ?? input.defaultCallbackUrl
  const baseMusic = () => ({
    prompt: promptText(request),
    style: requiredText(request.style, 'cinematic pop'),
    title: titleText(request),
    customMode: booleanValue(source.customMode) ?? true,
    instrumental: booleanValue(source.instrumental) ?? request.capability.toLowerCase().includes('instrumental'),
    model: stringValue(source.model) ?? defaultMusicModel,
    ...(callbackUrl ? { callBackUrl: callbackUrl } : {}),
  })

  switch (definition.action) {
    case 'generateBatch':
      return requireFields(baseMusic(), ['customMode', 'instrumental', 'callBackUrl', 'model'], definition.label)
    case 'generateLyrics':
      return requireFields({ prompt: promptText(request), ...(callbackUrl ? { callBackUrl: callbackUrl } : {}) }, [
        'prompt',
        'callBackUrl',
      ], definition.label)
    case 'generateSounds':
      return requireFields(
        {
          prompt: promptText(request).slice(0, 500),
          model: 'V5',
          soundLoop: booleanValue(source.soundLoop) ?? false,
          ...(callbackUrl ? { callBackUrl: callbackUrl } : {}),
        },
        ['prompt', 'model'],
        definition.label,
      )
    case 'extendTrack':
      return requireFields(
        {
          audioId: audioId(source),
          defaultParamFlag: booleanValue(source.defaultParamFlag) ?? true,
          prompt: promptText(request),
          style: requiredText(request.style, 'cinematic pop'),
          title: titleText(request),
          continueAt: numberValue(source.continueAt) ?? 60,
          model: stringValue(source.model) ?? defaultMusicModel,
          ...(callbackUrl ? { callBackUrl: callbackUrl } : {}),
        },
        ['defaultParamFlag', 'audioId', 'callBackUrl', 'model'],
        definition.label,
      )
    case 'uploadAndExtend':
      return requireFields(
        {
          uploadUrl: uploadUrl(source),
          defaultParamFlag: booleanValue(source.defaultParamFlag) ?? true,
          instrumental: booleanValue(source.instrumental) ?? false,
          prompt: promptText(request),
          style: requiredText(request.style, 'cinematic pop'),
          title: titleText(request),
          continueAt: numberValue(source.continueAt) ?? 60,
          model: stringValue(source.model) ?? defaultMusicModel,
          ...(callbackUrl ? { callBackUrl: callbackUrl } : {}),
        },
        ['uploadUrl', 'defaultParamFlag', 'callBackUrl', 'model'],
        definition.label,
      )
    case 'coverTrack':
    case 'uploadAndCover':
      return requireFields(
        {
          uploadUrl: uploadUrl(source),
          ...baseMusic(),
        },
        ['uploadUrl', 'customMode', 'instrumental', 'callBackUrl', 'model'],
        definition.label,
      )
    case 'uploadReferenceAudio':
    case 'uploadFileUrl':
      return requireFields(
        {
          fileUrl: stringValue(source.fileUrl) ?? stringValue(source.uploadUrl),
          uploadPath: stringValue(source.uploadPath) ?? defaultUploadPath,
          ...(stringValue(source.fileName) ? { fileName: stringValue(source.fileName) } : {}),
        },
        ['fileUrl', 'uploadPath'],
        definition.label,
      )
    case 'uploadBase64File':
      return requireFields(
        {
          base64Data: stringValue(source.base64Data),
          uploadPath: stringValue(source.uploadPath) ?? defaultUploadPath,
          ...(stringValue(source.fileName) ? { fileName: stringValue(source.fileName) } : {}),
        },
        ['base64Data', 'uploadPath'],
        definition.label,
      )
    case 'uploadFileStream':
      return {
        ok: false,
        message: `${definition.label} needs a multipart file stream route before dispatch.`,
      }
    case 'generatePersona':
      return requireFields(
        {
          taskId: taskId(source),
          audioId: audioId(source),
          name: stringValue(source.name) ?? requiredText(request.voice, 'Suno Visual Studio Persona'),
          description: stringValue(source.description) ?? promptText(request),
          vocalStart: numberValue(source.vocalStart) ?? 0,
          vocalEnd: numberValue(source.vocalEnd) ?? 30,
          style: requiredText(request.style, 'cinematic pop'),
        },
        ['taskId', 'audioId', 'name', 'description'],
        definition.label,
      )
    case 'checkVoiceAvailability':
      return requireFields({ task_id: taskId(source) }, ['task_id'], definition.label)
    case 'createCustomVoice':
      return requireFields(
        {
          taskId: taskId(source),
          verifyUrl: stringValue(source.verifyUrl),
          voiceName: stringValue(source.voiceName) ?? requiredText(request.voice, 'Custom voice'),
          description: stringValue(source.description) ?? promptText(request),
          style: requiredText(request.style, 'cinematic pop'),
          singerSkillLevel: stringValue(source.singerSkillLevel) ?? 'intermediate',
          ...(callbackUrl ? { callBackUrl: callbackUrl } : {}),
        },
        ['taskId', 'verifyUrl'],
        definition.label,
      )
    case 'getCustomVoiceRecord':
    case 'getVoiceValidationPhrase':
    case 'pollGenerationStatus':
    case 'getLyricsGenerationDetails':
    case 'getMusicVideoDetails':
    case 'getCoverArtDetails':
    case 'getMidiDetails':
    case 'getAudioSeparationDetails':
    case 'getWavConversionDetails':
      return requireFields({ taskId: taskId(source) }, ['taskId'], definition.label)
    case 'generateVoiceValidationPhrase':
      return requireFields(
        {
          voiceUrl: stringValue(source.voiceUrl),
          vocalStartS: numberValue(source.vocalStartS) ?? 0,
          vocalEndS: numberValue(source.vocalEndS) ?? 10,
          language: stringValue(source.language) ?? 'en',
          ...(callbackUrl ? { callBackUrl: callbackUrl } : {}),
        },
        ['voiceUrl', 'vocalStartS', 'vocalEndS'],
        definition.label,
      )
    case 'regenerateVoiceValidationPhrase':
      return requireFields(
        {
          taskId: taskId(source),
          calBackUrl: stringValue(source.calBackUrl) ?? callbackUrl,
        },
        ['taskId', 'calBackUrl'],
        definition.label,
      )
    case 'replaceSection':
      return requireFields(
        {
          taskId: taskId(source),
          audioId: audioId(source),
          prompt: promptText(request),
          tags: requiredText(request.style, 'cinematic pop'),
          title: titleText(request),
          infillStartS: numberValue(source.infillStartS) ?? 10,
          infillEndS: numberValue(source.infillEndS) ?? 20,
          ...(callbackUrl ? { callBackUrl: callbackUrl } : {}),
        },
        ['taskId', 'audioId', 'prompt', 'tags', 'title', 'infillStartS', 'infillEndS'],
        definition.label,
      )
    case 'addInstrumental':
      return requireFields(
        {
          uploadUrl: uploadUrl(source),
          title: titleText(request),
          negativeTags: stringValue(source.negativeTags) ?? 'distortion, clipping',
          tags: requiredText(request.style, 'cinematic pop'),
          model: stringValue(source.model) ?? defaultLegacyMusicModel,
          ...(callbackUrl ? { callBackUrl: callbackUrl } : {}),
        },
        ['uploadUrl', 'title', 'negativeTags', 'tags', 'callBackUrl'],
        definition.label,
      )
    case 'addVocals':
      return requireFields(
        {
          uploadUrl: uploadUrl(source),
          prompt: promptText(request),
          title: titleText(request),
          negativeTags: stringValue(source.negativeTags) ?? 'distortion, clipping',
          style: requiredText(request.style, 'cinematic pop'),
          model: stringValue(source.model) ?? defaultLegacyMusicModel,
          ...(callbackUrl ? { callBackUrl: callbackUrl } : {}),
        },
        ['uploadUrl', 'callBackUrl', 'prompt', 'title', 'negativeTags', 'style'],
        definition.label,
      )
    case 'boostMusicStyle':
      return requireFields({ content: requiredText(request.style, promptText(request)) }, ['content'], definition.label)
    case 'generateMashup':
      return requireFields(
        {
          uploadUrlList: stringArrayValue(source.uploadUrlList),
          customMode: booleanValue(source.customMode) ?? true,
          prompt: promptText(request),
          style: requiredText(request.style, 'cinematic pop'),
          title: titleText(request),
          instrumental: booleanValue(source.instrumental) ?? false,
          model: stringValue(source.model) ?? defaultMusicModel,
          ...(callbackUrl ? { callBackUrl: callbackUrl } : {}),
        },
        ['uploadUrlList', 'customMode', 'callBackUrl', 'model'],
        definition.label,
      )
    case 'separateStems':
      return requireFields(
        {
          taskId: taskId(source),
          audioId: audioId(source),
          type: stringValue(source.type) ?? 'separate_vocal',
          ...(callbackUrl ? { callBackUrl: callbackUrl } : {}),
        },
        ['taskId', 'audioId', 'callBackUrl'],
        definition.label,
      )
    case 'generateMidi':
      return requireFields(
        {
          taskId: taskId(source),
          ...(audioId(source) ? { audioId: audioId(source) } : {}),
          ...(callbackUrl ? { callBackUrl: callbackUrl } : {}),
        },
        ['taskId', 'callBackUrl'],
        definition.label,
      )
    case 'convertToWav':
    case 'createProviderMusicVideo':
    case 'getTimestampedLyrics':
      return requireFields(
        {
          taskId: taskId(source),
          audioId: audioId(source),
          ...(callbackUrl ? { callBackUrl: callbackUrl } : {}),
        },
        definition.action === 'getTimestampedLyrics' ? ['taskId', 'audioId'] : ['taskId', 'audioId', 'callBackUrl'],
        definition.label,
      )
    case 'generateCoverArt':
      return requireFields(
        {
          taskId: taskId(source),
          ...(callbackUrl ? { callBackUrl: callbackUrl } : {}),
        },
        ['taskId', 'callBackUrl'],
        definition.label,
      )
    case 'getRemainingCredits':
      return { ok: true, payload: {} }
    default:
      return { ok: true, payload: source }
  }
}

function requireFields(
  payload: Record<string, unknown>,
  fields: string[],
  label: string,
): ProviderPayloadBuildResult {
  const missing = fields.filter((field) => isMissing(payload[field]))
  if (missing.length > 0) {
    return {
      ok: false,
      message: `${label} is missing required provider payload fields: ${missing.join(', ')}.`,
    }
  }
  return { ok: true, payload: stripEmpty(payload) }
}

function promptText(request: ExecuteProviderActionRequest): string {
  const payloadPrompt = stringValue(request.payload?.prompt)
  return requiredText(payloadPrompt ?? request.lyrics ?? request.brief, 'Suno Visual Studio generation')
}

function titleText(request: ExecuteProviderActionRequest): string {
  return requiredText(stringValue(request.payload?.title) ?? request.brief, 'Suno Visual Studio')
}

function taskId(source: Record<string, unknown>): string | undefined {
  return stringValue(source.taskId) ?? stringValue(source.providerTaskId)
}

function audioId(source: Record<string, unknown>): string | undefined {
  return stringValue(source.audioId) ?? stringValue(source.sourceTrackId)
}

function uploadUrl(source: Record<string, unknown>): string | undefined {
  return stringValue(source.uploadUrl) ?? stringValue(source.fileUrl)
}

function requiredText(value: unknown, fallback: string): string {
  const text = stringValue(value)
  return text && text.trim().length > 0 ? text : fallback
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function stringArrayValue(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : undefined
}

function stripEmpty(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => !isMissing(value)))
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
}
