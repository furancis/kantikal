# API Coverage Map

All Suno/provider capabilities must be mapped here before implementation is called complete.

| Capability | UI Surface | Backend Owner | Status |
| --- | --- | --- | --- |
| Create song | Creation Canvas batch node | Suno adapter | Planned |
| Custom mode | Prompt/lyrics inspector | Suno adapter | Planned |
| Instrumental | Prompt/lyrics inspector | Suno adapter | Planned |
| Lyrics generation | Lyrics card | Suno adapter | Planned |
| Upload/reference audio | Brief and voice cards | Upload adapter | Planned |
| Personas/voices | Voice card and library | Identity adapter | Planned |
| Extend | Song Lab timeline | Suno adapter | Planned |
| Cover | Song Lab action rail | Suno adapter | Planned |
| Remix/recreate | Song Lab version branch | Suno adapter | Planned |
| Remaster | Song Lab version branch | Suno adapter | Planned |
| Replace section | Song Lab region editor | Suno adapter | Planned |
| Stems | Stem cards | Suno adapter | Planned |
| Status/queue | Queue strip and job drawer | Job service | Planned |
| Credits/cost | Cost guard | Job service | Planned |
| Library list/search | Library | Library service | Planned |
| Like/unlike | Library item action | Library service | Planned |
| Archive/trash/delete | Cleanup console | Library service | Planned |
| Download audio/stems | Release Pack | Export service | Planned |
| Webhooks/retries | Operations console | Job service | Planned |
| Music-video render | MV lane | ComfyUI adapter | Planned |
| Lipsync QA | MV lane export gate | QA service | Planned |

Rule: if an endpoint exists and is not in this map, API parity is incomplete.
