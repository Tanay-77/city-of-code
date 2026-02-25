# Codebase City

> Turn any public GitHub repository into an interactive 3D city visualization.

Every file becomes a building. Every folder becomes a district. Your codebase becomes a living, explorable city.

---

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | Next.js, React, TypeScript |
| 3D Engine | Three.js via @react-three/fiber + @react-three/drei |
| Post-FX   | @react-three/postprocessing (Bloom, Vignette) |
| State     | Zustand |
| Styling   | Tailwind CSS + custom CSS |
| Backend   | Express with TypeScript |
| API       | GitHub REST API v3 |
| Cache     | In-memory Map (15-min TTL) |

## Visualization Mapping

| Repository Concept | 3D Representation |
|---|---|
| File | Building |
| Lines of code | Building height |
| File size | Building width |
| Folder | District |
| Language | Building color (in Language mode) |
| Frequently updated file | Pulsing emissive glow |
| Large file | Skyscraper |
| Rarely updated file | Dim appearance |

## Performance Strategy

- **Instanced Meshes**: All buildings rendered as a single draw call
- **Max 1000 buildings**: Server limits to 500 largest files; layout caps at 1000
- **No re-renders**: Zustand selectors prevent unnecessary React re-renders
- **Frame-level updates**: Colors and animations update in `useFrame` (not React state)
- **Dynamic import**: Three.js canvas is lazy-loaded with `next/dynamic` (SSR disabled)
- **Post-processing**: Bloom and Vignette at minimal cost with multisampling
- **60fps target**: Lightweight materials, no real-time shadows per building

## Security

- GitHub tokens are server-side only, never exposed to the client
- Input URLs are validated with regex and sanitized
- Rate limiting: 30 req/min global, 10 repo fetches/min per IP
- Structured error responses with proper HTTP status codes

## API

### `GET /api/repo?url=<github-url>`

Returns processed repository data optimized for 3D rendering.

**Response:**
```json
{
  "success": true,
  "cached": false,
  "data": {
    "owner": "facebook",
    "repo": "react",
    "totalFiles": 500,
    "totalLines": 245000,
    "mainLanguage": "JavaScript",
    "largestFile": "packages/react-dom/src/...",
    "languageBreakdown": { "JavaScript": 65, "TypeScript": 20 },
    "files": [],
    "folders": [],
    "fetchedAt": "2026-02-22T..."
  }
}
```
