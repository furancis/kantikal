# API Coverage Map

All Suno/provider capabilities must be mapped here before implementation is called complete. This ledger is sourced from the current provider documentation index plus product guardrails; it is an enforcement target, not proof that real provider calls are complete.

| Capability | UI Surface | Backend Owner | Status | Auth Boundary | Adapter Action |
| --- | --- | --- | --- | --- | --- |
| Create song | Creation Canvas batch node | Suno adapter | Implemented | Server | generateBatch |
| Custom mode | Prompt/lyrics inspector | Suno adapter | Implemented | Server | generateBatch |
| Instrumental | Prompt/lyrics inspector | Suno adapter | Planned | Server | generateBatch |
| Lyrics generation | Lyrics card | Suno adapter | Planned | Server | generateLyrics |
| Model/version selection | Prompt inspector | Suno adapter | Planned | Server | selectModelVersion |
| Upload/reference audio | Brief and voice cards | Upload adapter | Planned | Server | uploadReferenceAudio |
| Base64 file upload | Upload drawer | Upload adapter | Planned | Server | uploadBase64File |
| File stream upload | Upload drawer | Upload adapter | Planned | Server | uploadFileStream |
| URL file upload | Upload drawer | Upload adapter | Planned | Server | uploadFileUrl |
| Personas | Voice card and library | Identity adapter | Planned | Server | generatePersona |
| Custom voice availability | Voice card verification | Identity adapter | Planned | Server | checkVoiceAvailability |
| Custom voice creation | Voice card verification | Identity adapter | Planned | Server | createCustomVoice |
| Custom voice record lookup | Voice card verification | Identity adapter | Planned | Server | getCustomVoiceRecord |
| Voice validation phrase generation | Voice card verification | Identity adapter | Planned | Server | generateVoiceValidationPhrase |
| Voice validation phrase lookup | Voice card verification | Identity adapter | Planned | Server | getVoiceValidationPhrase |
| Voice validation phrase regeneration | Voice card verification | Identity adapter | Planned | Server | regenerateVoiceValidationPhrase |
| Extend | Song Lab timeline | Suno adapter | Planned | Server | extendTrack |
| Upload and extend audio | Song Lab upload rail | Suno adapter | Planned | Server | uploadAndExtend |
| Cover | Song Lab action rail | Suno adapter | Planned | Server | coverTrack |
| Upload and cover audio | Song Lab upload rail | Suno adapter | Planned | Server | uploadAndCover |
| Remix/recreate | Song Lab version branch | Suno adapter | Planned | Server | remixTrack |
| Remaster | Song Lab version branch | Suno adapter | Planned | Server | remasterTrack |
| Replace section | Song Lab region editor | Suno adapter | Planned | Server | replaceSection |
| Add instrumental | Song Lab stem composer | Suno adapter | Planned | Server | addInstrumental |
| Add vocals | Song Lab stem composer | Suno adapter | Planned | Server | addVocals |
| Boost music style | Style stack action | Suno adapter | Planned | Server | boostMusicStyle |
| Generate mashup | Song Lab mashup lane | Suno adapter | Planned | Server | generateMashup |
| Generate sounds | Sound design card | Suno adapter | Planned | Server | generateSounds |
| Stems | Stem cards | Suno adapter | Planned | Server | separateStems |
| MIDI from audio | Stem cards | Suno adapter | Planned | Server | generateMidi |
| WAV conversion | Release Pack | Export service | Planned | Server | convertToWav |
| Status/queue | Queue strip and job drawer | Job service | Planned | Server | pollGenerationStatus |
| Lyrics task details | Queue strip and job drawer | Job service | Planned | Server | getLyricsGenerationDetails |
| Music video task details | Queue strip and job drawer | Job service | Planned | Server | getMusicVideoDetails |
| Cover art task details | Queue strip and job drawer | Job service | Planned | Server | getCoverArtDetails |
| MIDI task details | Queue strip and job drawer | Job service | Planned | Server | getMidiDetails |
| Audio separation details | Queue strip and job drawer | Job service | Planned | Server | getAudioSeparationDetails |
| WAV conversion details | Queue strip and job drawer | Job service | Planned | Server | getWavConversionDetails |
| Credits/cost | Cost guard | Job service | Planned | Server | getRemainingCredits |
| Timestamped lyrics | Lyrics card timeline | Suno adapter | Planned | Server | getTimestampedLyrics |
| Library list/search | Library | Library service | Planned | Server | listLibrary |
| Like/unlike | Library item action | Library service | Planned | Server | toggleLike |
| Archive/trash/delete | Cleanup console | Library service | Planned | Server | archiveOrDelete |
| Restore from trash/archive | Library cleanup console | Library service | Planned | Server | restoreArchivedItem |
| Visibility toggle | Library item action | Library service | Planned | Server | setVisibility |
| Cover art | Stems / release pack | Export service | Planned | Server | generateCoverArt |
| Waveform asset | Stems card | Export service | Planned | Server | exportWaveform |
| Download audio/stems | Release Pack | Export service | Planned | Server | downloadAudioAndStems |
| Lyrics/captions export | Release Pack | Export service | Planned | Server | exportLyricsAndCaptions |
| Release pack / provenance bundle | Release Pack | Export service | Planned | None | buildReleasePack |
| Webhooks/retries | Operations console | Job service | Planned | Server | handleProviderCallback |
| Music-video render | MV lane | ComfyUI adapter | Planned | External worker | renderMusicVideo |
| Provider music video creation | MV lane | Suno adapter | Planned | Server | createProviderMusicVideo |
| Lipsync QA | MV lane export gate | QA service | Planned | External worker | evaluateLipsync |

Rule: if an endpoint exists and is not in this map, API parity is incomplete. If a mapped item is not live, it must stay explicitly marked planned, blocked, unsupported, or deprecated rather than disappearing.

Source checkpoint, 2026-05-20:

- `https://docs.sunoapi.org/llms.txt`
- `https://docs.sunoapi.org/suno-api/quickstart`
- `https://docs.sunoapi.org/suno-api/generate-music`
- `https://docs.sunoapi.org/suno-api/extend-music`
- `https://docs.sunoapi.org/suno-api/upload-and-cover-audio`
- `https://docs.sunoapi.org/suno-api/upload-and-extend-audio`
