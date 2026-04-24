# Natalna · 3D Astrology Transit Simulator

Real-time 3D visualization of natal chart + transit motion driven by Swiss Ephemeris.
NASA Artemis-style HUD on top of a React Three Fiber scene; on demand 2D astrological
chart in a modal with full house-system selector. Aspects (transit ↔ natal and
transit ↔ transit) are detected from the per-request transit chunk and visualized
as glowing beams with click-to-jump events queue.

## Stack

- **Backend** — NestJS · Prisma · MariaDB · `sweph` (Swiss Ephemeris Node binding)
- **Frontend** — React + Vite + TypeScript · React Three Fiber + drei · TanStack Query · Zustand · luxon
- **Workspace** — npm workspaces (`apps/api`, `apps/web`, `packages/ephemeris-core`)

`packages/ephemeris-core` houses pure ephemeris/aspect math (no Nest, no React).
The web app imports the pure surface (`@natalna/ephemeris-core`); the API imports
the sweph-dependent surface (`@natalna/ephemeris-core/node`).

## Repo layout

```
apps/
  api/                     # NestJS backend
    ephe/                  # Swiss Ephemeris files (gitignored, downloaded separately)
    prisma/
    src/
    ecosystem.config.cjs   # pm2 config (production)
  web/                     # React + R3F frontend
    src/
      three/               # 3D scene, planet bodies, zodiac rings, beams
      hud/                 # HUD panels, side panel, planet detail
      modal/               # 2D SVG chart modal
      state/               # Zustand stores (app + live snapshot) + chunk fetcher
      api/                 # API client
packages/
  ephemeris-core/          # pure math + sweph wrapper (dual entry: pure / node)
deploy/vestacp/            # nginx templates (.tpl + .stpl)
.github/workflows/         # CI/CD to VestaCP
```

## Local development

```bash
npm install
npm --workspace apps/api exec prisma generate
# Download Swiss Ephemeris files (see "Ephemeris files" below)
cp apps/api/.env.example apps/api/.env       # edit DATABASE_URL
npm run dev
```

- API: <http://localhost:3001/api/meta>
- Web: <http://localhost:5173>

The web dev server proxies `/api/*` to `http://localhost:3001`.

If you have no MariaDB locally the API still serves natal/transit endpoints — only
the `/api/sessions/*` save/list routes degrade. The chart data needed for the
3D scene is fully ephemeris-driven, no DB required.

### Ephemeris files

Place these into `apps/api/ephe/` (gitignored):

| file           | purpose                            | range          |
|----------------|------------------------------------|----------------|
| `sepl_18.se1`  | main planets (Sun…Pluto)           | 1800 – 2399 AD |
| `semo_18.se1`  | Moon                               | 1800 – 2399 AD |
| `seas_18.se1`  | asteroids + Chiron                 | 1800 – 2399 AD |

Mirror: <https://github.com/aloistr/swisseph/tree/master/ephe> — direct download:

```bash
mkdir -p apps/api/ephe && cd apps/api/ephe
for f in sepl_18.se1 semo_18.se1 seas_18.se1; do
  curl -sSL -o "$f" "https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/$f"
done
```

For TNOs (Eris, Sedna, Quaoar, Makemake, Haumea) extra `se9XXXXX.se1` files from
the swisseph `eph2` archive are required; load on demand only when those bodies
are toggled on.

### Default natal data

The web UI loads with a default chart prefilled (editable in the side panel · Birth tab):

```
UTC : 1999-01-14T09:55:00.000Z   (10:55 local Belgrade)
lat : 42.552091
lon : 21.898854
hsys: P (Placidus)
```

## Features

### 3D scene
- Earth at center, geocentric ecliptic projection (XY = ecliptic plane, Z = north pole).
- All 14 default bodies (Sun, Moon, Mercury…Pluto, Mean Node, Mean Lilith, Chiron) with
  per-body color and glyph. 11 additional bodies (True Node/Lilith, Pholus, Ceres, Pallas,
  Juno, Vesta, Eris, Haumea, Makemake, Sedna, Quaoar) opt-in via Bodies tab.
- **Two zodiac rings**: yellow natal ring (rotated so ASC sits at left, traditional chart
  layout) and cyan transit ring (true sky orientation, 0° Aries at +X). Both toggleable.
- House cusp lines from origin to natal ring radius, house numbers, ASC/MC/IC/DSC accents.
- Orbit guide circles per body at current geocentric distance (faint).
- Distance compression: `d = AU^0.4 * SCENE_UNIT` (toggleable to true scale).
- Aspect beams between transit positions and natal markers, color by aspect type, opacity
  scaled by orb tightness, max 30 simultaneous.
- Bloom postprocess (toggleable).

### Animation
- Speed selector (1×, 5×, 20×, custom) × time scale dropdown
  (1 minute / 1 hour / 1 day / 1 week / 1 month per wall-clock second).
- Chunk-based fetcher (TanStack Query): 240 samples per chunk, prefetch at 65% consumed.
- Per-frame interpolation between chunk samples (longitude wrap-aware).
- Auto-pause on aspect events (toggleable).

### Aspects
- Conjunction, opposition, trine, square, sextile by default. Quincunx, semisextile,
  semi/sesquisquare, quintile, biquintile opt-in.
- Per-aspect orb config + Sun/Moon override.
- Transit-to-natal aspects sorted by tightness, rendered as energy beams.
- Live activations recomputed each frame from interpolated longitudes.
- Pre-computed event timeline (ingress / peak / egress) per chunk, click row in events queue
  to jump animation clock to peak.

### Click on planet → detail panel
- Header clearly marks **NATAL** (yellow) vs **TRANSIT** (cyan).
- Longitude, sign + element/modality, deg/min/sec in sign, latitude, distance (AU), speed
  (°/day, retrograde flag), house position, ruler.
- All currently active aspects involving this body, color-coded.

### 2D modal chart (toggle "Open 2D Chart")
- Astro-seek-style SVG: outer zodiac ring with degree ticks every 1°, sign sectors,
  inner house ring with cusp lines + house numbers, ASC/MC/IC/DSC labels at angles.
- Bodies as glyphs at exact longitudes with degree:minute labels and retrograde marker.
- Aspect lines drawn inside chart; aspect grid table below.
- House-system selector (12 systems: Placidus, Koch, Regiomontanus, Campanus, Porphyrius,
  Equal, Whole Sign, Alcabitius, Topocentric, Morinus, Meridian, Gauquelin) — switching
  re-fetches natal compute on the fly.
- Mode toggle: Natal only / Transit only / Bi-wheel overlay.

### Side panel
- **Birth** — edit lat/lon/UTC/house system + label.
- **Bodies** — grouped checkboxes (Lights & Classical, Modern, Nodes & Lilith, Centaurs,
  Asteroids, TNOs). Per body: "Scene" (visible in 3D) and "Aspects" (participates in
  aspect calc) — independent toggles.
- **Aspects** — per-aspect on/off + orb (default + Sun/Moon override).
- **Visual** — orbit guides, labels, trails, true scale, both zodiac rings, aspect beams,
  house lines, natal markers, bloom, stars.

## CI/CD (VestaCP)

`.github/workflows/deploy.yml` runs on push to `main`. Reads these secrets:

| secret               | purpose                                           |
|----------------------|---------------------------------------------------|
| `SSH_HOST`           | VestaCP server hostname / IP                      |
| `SSH_USER`           | SSH user (typically the VestaCP web user)         |
| `SSH_PORT`           | SSH port                                          |
| `SSH_PRIVATE_KEY`    | Private SSH key authorized on the server          |
| `DEPLOY_PATH_API`    | Absolute path to backend deploy dir on server     |
| `DEPLOY_PATH_WEB`    | Absolute path to web docroot (nginx serves this)  |
| `DATABASE_URL`       | Production DB URL (mysql://… for MariaDB)         |

Pipeline:

1. checkout → setup Node 22 → `npm ci`
2. `prisma generate` → build all (`packages/ephemeris-core`, `apps/api`, `apps/web`)
3. rsync API dist + ephemeris-core dist + package.json + ecosystem.config.cjs + prisma schema
4. rsync web dist to docroot
5. `npm install --omit=dev` on server
6. `npx prisma migrate deploy`
7. `pm2 startOrReload ecosystem.config.cjs --update-env && pm2 save`

See `DEPLOY.md` for one-time server setup (nginx template install, MariaDB user creation,
ephemeris file placement, first pm2 launch).

## Architecture notes

See `ARCHITECTURE.md`.
