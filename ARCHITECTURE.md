# Architecture

## Data flow

```
                                                                    ┌──────────────────┐
                                                                    │   sweph (C lib)  │
                                                                    │  ephe/*.se1      │
                                                                    └────────▲─────────┘
                                                                             │
                                                          ┌──────────────────┴───────────────┐
                                                          │  packages/ephemeris-core (node)  │
                                                          │  • initEphemeris                 │
                                                          │  • computeNatal                  │
                                                          │  • computeChunk (samples +       │
                                                          │     aspect events: ingress/peak/ │
                                                          │     egress with bisection)      │
                                                          └──────────────────▲──────────────┘
                                                                             │
                                       ┌─────────────────────────────────────┴────────────────┐
                                       │                                                      │
                              POST /api/natal/compute                                POST /api/transits/chunk
                                       │                                                      │
                              ┌────────┴────────┐                                    ┌────────┴────────┐
                              │  NatalController│                                    │ TransitsService │  ← LRU cache (50)
                              └────────┬────────┘                                    └────────┬────────┘
                                       │                                                      │
                                       └──────────────────┬───────────────────────────────────┘
                                                          │
                                              HTTP (vite proxy /api)
                                                          │
                                                          ▼
                                              ┌────────────────────┐
                                              │  apps/web (React)  │
                                              └─┬───────────────┬──┘
                                                │               │
                                                ▼               ▼
                                    ┌─────────────────┐   ┌──────────────────┐
                                    │ Zustand store   │   │  TanStack Query  │
                                    │ (app config +   │   │  (chunk cache,   │
                                    │  visual + birth)│   │   prefetch @65%) │
                                    └─────────┬───────┘   └────────┬─────────┘
                                              │                    │
                                              └──────────┬─────────┘
                                                         ▼
                                              ┌────────────────────────────┐
                                              │   Live store (Zustand)     │
                                              │  liveBodies + active +     │   ← updated ~30 Hz
                                              │  upcomingEvents            │       in useFrame
                                              └────────────┬───────────────┘
                                                           │
                                          ┌────────────────┼────────────────┐
                                          ▼                ▼                ▼
                                ┌──────────────────┐ ┌────────────┐ ┌──────────────┐
                                │  R3F Scene       │ │  HUD       │ │  2D modal    │
                                │  - bodies        │ │  panels    │ │  (on demand) │
                                │  - zodiac rings  │ │            │ │              │
                                │  - aspect beams  │ └────────────┘ └──────────────┘
                                │  - house lines   │
                                └──────────────────┘
```

## Per-request chunk strategy

The frontend never asks the server for "the whole timeline". It asks for one chunk at a
time, sized to ≈240 samples, with a sample step automatically derived from the active
time scale (1 minute per wall-second → step 60s; 1 day per wall-second → step ~2880s, etc.).

```
chunk span = CHUNK_SAMPLES × stepSeconds
             ──────────────────────────
                240          dynamic
```

A chunk is keyed on:

```
(natal-snapshot, startUtc, endUtc, stepSeconds, sceneBodies, aspectBodies,
 enabledAspects, orbConfig, includeT2T)
```

- The TanStack Query cache holds previous chunks → scrubbing back is instant.
- When the sim clock crosses 65% of the current chunk, the next chunk is prefetched.
- Changing the body roster, aspect set, or orb config invalidates the request key and
  triggers a fresh fetch from the current sim time forward.
- The backend keeps an LRU cache (50) keyed on the same shape, so identical chunk
  requests across page reloads are <5 ms.

## Aspect event detection

For each (transit body, natal body, aspect type) triple where both bodies have the
"include in aspects" flag enabled:

1. Compute `signedOrb(t) = wrap180(transitLon - natalLon - aspectAngle)` at every sample.
2. Walk the absolute orb series. When `|signedOrb|` crosses below the orb threshold,
   linearly interpolate the ingress millisecond between the two bracketing samples.
3. When it crosses back above, interpolate the egress millisecond.
4. Inside the [ingress, egress] window, find the local minimum of `|signedOrb|` and
   refine with a single 3-point parabolic fit → peak millisecond.
5. Emit one `AspectEvent` per crossing, sorted by peak time.

`includeTransitToTransit` (off by default) runs the same scan over every pair of moving
bodies in the chunk.

The frontend recomputes "currently active" aspects per frame (not per chunk) by calling
the pure `activeAspectsAt` helper on the interpolated longitudes — so beam intensity
follows the orb opening/closing smoothly even between chunk samples.

## 3D coordinate projection

Ecliptic plane is XY, north ecliptic pole is +Z.

```
lon_rad = lonDeg * π / 180
lat_rad = latDeg * π / 180
r       = distanceScale(distAu, isMoon, trueScale)
x       = r * cos(lat_rad) * cos(lon_rad)
y       = r * cos(lat_rad) * sin(lon_rad)
z       = r * sin(lat_rad)
```

Default distance scaling compresses AU values by `d^0.4 * SCENE_UNIT` so Pluto sits at
scene radius ≈50 while inner planets remain visible. Moon distance is multiplied by 60×
on top of that so it stays visually separated from Earth at the center. The "true scale"
toggle uses raw AU times a single SCENE_UNIT — useful for inner-system inspection only,
outer planets become invisible.

Natal bodies are NOT placed at their AU distances. They sit on a fixed ring of radius 35
(the "natal ring") at their ecliptic longitude — yellow markers, distinct from cyan
transit bodies. The ring sits underneath the cyan transit zodiac ring (radius 48) and
above the yellow natal zodiac ring (radius 42).

## Two zodiac rings

- **Yellow natal ring** at radius 42 — rotated so the natal ASC sits at screen left
  (180° in screen coords). This is the traditional astrological chart layout: ASC=left,
  MC=top, DSC=right, IC=bottom. House cusps draw onto this ring's frame.
- **Cyan transit ring** at radius 48 — true sky orientation, 0° Aries fixed at +X axis.
  Transit bodies move through this frame as time advances.

Both rings can be toggled independently in the side panel · Visual tab.

## State stores

Two Zustand stores:

- **`useApp`** — user-controlled state (birth form, animation control, body/aspect/visual
  toggles, selected body, modal state). Mutations come from React event handlers.
- **`useLive`** — per-frame snapshot (interpolated bodies, active aspects, upcoming events).
  Mutations come from R3F `useFrame` callbacks at ~30 Hz throttle. HUD components subscribe
  via `useLive(s => s.X)` slice selectors so they re-render only when the slice changes.

This split is deliberate — putting per-frame data into the same store as user toggles
would re-render every settings checkbox 30 times a second.

## Performance targets

- 60 fps scene render with default 14-body roster + 5 default aspects on a modern laptop.
- Chunk request latency on warm cache: <5 ms. Cold compute (240 samples × 14 bodies):
  ~80–200 ms (sub-millisecond per sweph call, dominated by I/O on first asteroid file open).
- Aspect-active body soft cap: 25 (warning logged on the backend if exceeded). Hard cap
  on scene bodies: 60 (UI prevents enabling more).
- Aspect beams: max 30 simultaneous, sorted by tightness (≈1−|orb|/threshold).
