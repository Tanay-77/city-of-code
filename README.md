# Codebase City

> Turn any public GitHub repository into an interactive 3D city visualization.

Every file becomes a building. Every folder becomes a district. Your codebase becomes a living, explorable city.

---

## Architecture

```
/client                     Frontend (Next.js + Three.js)
  /components
    /scene                  3D scene components
      BuildingsInstanced.tsx   Instanced mesh renderer (1000+ buildings)
      CityScene.tsx            Main canvas + post-processing
      CameraController.tsx     Smooth orbit + focus transitions
      BuildingTooltip.tsx      3D HTML tooltip overlay
      DistrictLabels.tsx       Folder district labels
      GroundGrid.tsx           Ground plane + grid
      Lighting.tsx             HDR environment + shadows
    Controls.tsx             Search, mode toggle, actions
    LandingPage.tsx          URL input + hero
    LoadingAnimation.tsx     Procedural city generation animation
    Sidebar.tsx              Stats + language breakdown
    VisualizationView.tsx    Full visualization layout
  /hooks
    useCityStore.ts          Zustand global state
  /types
    index.ts                 Shared TypeScript interfaces
  /utils
    api.ts                   Backend API client
    cityGenerator.ts         Repo data → 3D city layout algorithm

/server                     Backend (Express)
  index.ts                  Express app entry
  /routes
    repo.ts                 GET /api/repo?url=
  /services
    github.ts               GitHub API client + data processing
    cache.ts                In-memory cache (Redis-ready Map)
    languageMap.ts           Extension → language + color mapping
    validator.ts             URL validation + sanitization
  /middleware
    errorHandler.ts          Structured error responses
    rateLimiter.ts           Rate limiting
```

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

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Copy environment config
cp .env.example .env

# 3. (Optional) Add your GitHub token to .env for higher rate limits
#    Create one at https://github.com/settings/tokens — no scopes needed

# 4. Start both frontend and backend
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Health check**: http://localhost:3001/health

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

## Visualization Modes

- **Structure** — Clean architectural white model (Apple keynote aesthetic)
- **Activity** — Warm/cool colors showing commit frequency
- **Language** — Each language gets its own color

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
