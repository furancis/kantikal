# API Coverage Map

Printing Press / logged-in Suno web is the primary Suno execution path. The `sunoapi.org` surface in this document is an optional Suno-compatible adapter map, not the official Suno product contract, and it must be treated as disabled until a real credential probe succeeds.

All Suno/provider capabilities must be mapped here before implementation is called complete. This ledger is sourced from the current provider documentation index plus product guardrails; it is an enforcement target, not proof that real provider calls are complete.

| Capability | UI Surface | Backend Owner | Status | Auth Boundary | Adapter Action |
| --- | --- | --- | --- | --- | --- |
| Create song | Creation Canvas batch node | Suno adapter | Implemented | Server | generateBatch |
| Custom mode | Prompt/lyrics inspector | Suno adapter | Implemented | Server | generateBatch |
| Instrumental | Prompt/lyrics inspector | Suno adapter | Implemented | Server | generateBatch |
| Lyrics generation | Lyrics card | Suno adapter | Implemented | Server | generateLyrics |
| Model/version selection | Prompt inspector | Suno adapter | Implemented | Server | selectModelVersion |
| Upload/reference audio | Brief and voice cards | Upload adapter | Implemented | Server | uploadReferenceAudio |
| Base64 file upload | Upload drawer | Upload adapter | Implemented | Server | uploadBase64File |
| File stream upload | Upload drawer | Upload adapter | Blocked | Server | uploadFileStream |
| URL file upload | Upload drawer | Upload adapter | Implemented | Server | uploadFileUrl |
| Personas | Voice card and library | Identity adapter | Implemented | Server | generatePersona |
| Custom voice availability | Voice card verification | Identity adapter | Implemented | Server | checkVoiceAvailability |
| Custom voice creation | Voice card verification | Identity adapter | Implemented | Server | createCustomVoice |
| Custom voice record lookup | Voice card verification | Identity adapter | Implemented | Server | getCustomVoiceRecord |
| Voice validation phrase generation | Voice card verification | Identity adapter | Implemented | Server | generateVoiceValidationPhrase |
| Voice validation phrase lookup | Voice card verification | Identity adapter | Implemented | Server | getVoiceValidationPhrase |
| Voice validation phrase regeneration | Voice card verification | Identity adapter | Implemented | Server | regenerateVoiceValidationPhrase |
| Extend | Song Lab timeline | Suno adapter | Implemented | Server | extendTrack |
| Upload and extend audio | Song Lab upload rail | Suno adapter | Implemented | Server | uploadAndExtend |
| Cover | Song Lab action rail | Suno adapter | Implemented | Server | coverTrack |
| Upload and cover audio | Song Lab upload rail | Suno adapter | Implemented | Server | uploadAndCover |
| Remix/recreate | Song Lab version branch | Suno adapter | Unsupported | Server | remixTrack |
| Remaster | Song Lab version branch | Suno adapter | Unsupported | Server | remasterTrack |
| Replace section | Song Lab region editor | Suno adapter | Implemented | Server | replaceSection |
| Add instrumental | Song Lab stem composer | Suno adapter | Implemented | Server | addInstrumental |
| Add vocals | Song Lab stem composer | Suno adapter | Implemented | Server | addVocals |
| Boost music style | Style stack action | Suno adapter | Implemented | Server | boostMusicStyle |
| Generate mashup | Song Lab mashup lane | Suno adapter | Implemented | Server | generateMashup |
| Generate sounds | Sound design card | Suno adapter | Implemented | Server | generateSounds |
| Stems | Stem cards | Suno adapter | Implemented | Server | separateStems |
| MIDI from audio | Stem cards | Suno adapter | Implemented | Server | generateMidi |
| WAV conversion | Release Pack | Export service | Implemented | Server | convertToWav |
| Status/queue | Queue strip and job drawer | Job service | Implemented | Server | pollGenerationStatus |
| Lyrics task details | Queue strip and job drawer | Job service | Implemented | Server | getLyricsGenerationDetails |
| Music video task details | Queue strip and job drawer | Job service | Implemented | Server | getMusicVideoDetails |
| Cover art task details | Queue strip and job drawer | Job service | Implemented | Server | getCoverArtDetails |
| MIDI task details | Queue strip and job drawer | Job service | Implemented | Server | getMidiDetails |
| Audio separation details | Queue strip and job drawer | Job service | Implemented | Server | getAudioSeparationDetails |
| WAV conversion details | Queue strip and job drawer | Job service | Implemented | Server | getWavConversionDetails |
| Credits/cost | Cost guard | Job service | Implemented | Server | getRemainingCredits |
| Timestamped lyrics | Lyrics card timeline | Suno adapter | Implemented | Server | getTimestampedLyrics |
| Library list/search | Library | Library service | Unsupported | Server | listLibrary |
| Like/unlike | Library item action | Library service | Unsupported | Server | toggleLike |
| Archive/trash/delete | Cleanup console | Library service | Unsupported | Server | archiveOrDelete |
| Restore from trash/archive | Library cleanup console | Library service | Unsupported | Server | restoreArchivedItem |
| Visibility toggle | Library item action | Library service | Unsupported | Server | setVisibility |
| Cover art | Stems / release pack | Export service | Implemented | Server | generateCoverArt |
| Waveform asset | Stems card | Export service | Unsupported | Server | exportWaveform |
| Download audio/stems | Release Pack | Export service | Unsupported | Server | downloadAudioAndStems |
| Lyrics/captions export | Release Pack | Export service | Unsupported | Server | exportLyricsAndCaptions |
| Release pack / provenance bundle | Release Pack | Export service | Implemented | None | buildReleasePack |
| Webhooks/retries | Operations console | Job service | Implemented | Server | handleProviderCallback |
| Music-video render | MV lane | ComfyUI adapter | Blocked | External worker | renderMusicVideo |
| Provider music video creation | MV lane | Suno adapter | Implemented | Server | createProviderMusicVideo |
| Lipsync QA | MV lane export gate | QA service | Blocked | External worker | evaluateLipsync |

Rule: if an endpoint exists and is not in this map, API parity is incomplete. If a mapped item is not live, it must stay explicitly marked planned, blocked, unsupported, or deprecated rather than disappearing.

Source checkpoint, 2026-05-20:

- `https://docs.sunoapi.org/llms.txt`
- `https://docs.sunoapi.org/suno-api/suno-api.json`
- `https://docs.sunoapi.org/file-upload-api/file-upload-api.json`
- `https://docs.sunoapi.org/suno-api/suno-voice-api.json`
- `https://docs.sunoapi.org/suno-api/quickstart`
- `https://docs.sunoapi.org/suno-api/generate-music`
- `https://docs.sunoapi.org/suno-api/extend-music`
- `https://docs.sunoapi.org/suno-api/upload-and-cover-audio`
- `https://docs.sunoapi.org/suno-api/upload-and-extend-audio`

T170 adapter checkpoint:

- Endpoint-backed actions are registered in `src/api/actionCatalog.ts`.
- Browser UI calls fetch-backed provider routes when mounted and falls back to the local mock only when the route is absent.
- Real provider dispatch is isolated in `server/sunoApiAdapter.ts`; it requires `runtime: "server"` and a server-side API key before any network call.
- Endpoint-backed actions build typed provider payloads from current Suno-compatible specs and block before fetch when required fields are missing.
- Inbound callback handlers and provider request-parameter controls are implemented server semantics; they do not dispatch as standalone external provider calls.
- File stream upload remains `Blocked` until a multipart route exists. Music-video render and lipsync QA remain `Blocked` on external-worker execution, while the app has a local evaluator boundary for deterministic QA evidence and export gating.
- Current provider docs do not expose library management, visibility, waveform export, direct download, captions export, remix, or remaster endpoints; those stay `Unsupported` rather than disappearing from the product map.
