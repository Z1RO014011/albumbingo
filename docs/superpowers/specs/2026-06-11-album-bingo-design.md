# Album Cover Bingo MVP Design

## Project Goal

Build a browser-based "Album Bingo" mini game for friends. Players see a 5x5 Bingo board styled like the reference image, each cell contains a visual clue instead of a direct album name, and players search for album covers then drag the correct cover into matching cells. Completing a row, column, or diagonal triggers a Bingo celebration.

## Product Scope

### In Scope for MVP

- Single-page web app built with plain HTML, CSS, and JavaScript
- 5x5 Bingo board with clue-based cells
- White rounded board panel over a dark album-collage background
- Search area for albums with keyword input
- Search results shown as draggable album cover cards
- Drag-and-drop placement from results into board cells
- Validation that a cover can only complete cells whose clue keywords match that album
- Automatic Bingo detection for rows, columns, and diagonals
- Restart and random-card regeneration
- Configurable data source layer:
  - mock mode for immediate local demo
  - API mode for later connection to the user's music data source

### Out of Scope for MVP

- Multiplayer or shared-room sync
- User login or score history
- Real-time collaboration
- Backend persistence
- Fuzzy AI vision matching of arbitrary cover art

## User Flow

1. Open the page and see the centered Bingo card plus album-search panel.
2. Click "Randomize Card" to generate a fresh 5x5 clue layout.
3. Type an album keyword in the search field.
4. Receive candidate albums with cover image, title, artist, and clue tags.
5. Drag a cover onto a board cell.
6. If the cover matches the cell clue, the cover locks into the slot and the cell becomes completed.
7. If the cover does not match, the cell rejects it and shows a brief feedback state.
8. When five completed cells connect horizontally, vertically, or diagonally, show a "BINGO!" celebration banner.

## Data Model

### Clue Card

- `id`: unique string
- `label`: human-readable clue text shown in the cell
- `matchTags`: normalized keyword list used for validation

Example:

```json
{
  "id": "purple-cover",
  "label": "紫色主色调",
  "matchTags": ["purple", "violet"]
}
```

### Album Item

- `id`: unique string
- `title`: album title
- `artist`: artist name
- `cover`: cover image URL
- `tags`: normalized keyword list used to decide whether the album can satisfy a clue

Example:

```json
{
  "id": "utopia",
  "title": "UTOPIA",
  "artist": "Travis Scott",
  "cover": "https://...",
  "tags": ["dark", "portrait", "monochrome"]
}
```

### Board Cell

- `index`: position from 0 to 24
- `clueId`: selected clue reference
- `placedAlbumId`: nullable album reference
- `locked`: whether the cell is already completed

## Approaches Considered

### Option A: Fully hard-coded album set

- Pros: simplest to build, no API uncertainty
- Cons: not aligned with the user's existing music-data workflow, weak replay value

### Option B: Hybrid adapter with mock data and API mode

- Pros: immediate demo value, smooth path to real API integration, safer while API details are still unknown
- Cons: requires a small abstraction layer instead of a single direct fetch call

### Option C: API-only build

- Pros: most realistic end state
- Cons: blocked without endpoint shape, harder to demo or test offline

## Recommended Approach

Use Option B.

The board, drag-and-drop, clue validation, and Bingo logic all live locally in the browser. Album search goes through a small adapter that can either return local mock data or fetch from a user-provided API. This keeps the MVP playable now and minimizes rewrite work later.

## UI Direction

### Layout

- Full-page dark background with blurred album collage
- Centered white Bingo card inspired by the provided screenshot
- `B I N G O` header row above the grid
- Compact controls row for title, board size label, restart, and randomize
- Search/results panel positioned beside the card on desktop and below it on mobile

### Visual Style

- Modern music-app aesthetic
- Strong contrast: dark background + bright board
- Soft glass or shadow treatment around the card
- Hover animation on result cards and empty board cells
- Completed cells show inserted album art, glow ring, and check indicator
- Bingo state adds flashing gradient text and pulse animation

## Interaction Rules

- A clue cell starts empty and shows clue text only.
- Dragging over a valid empty cell highlights it.
- Dropping a non-matching album triggers a short shake/reject animation.
- Dropping a matching album fills the cell with the cover and hides most clue text.
- A placed cover can be removed by clicking a small clear button on the cell.
- The same album can be reused across multiple cells in the MVP unless the user later wants uniqueness rules.

## API Integration Contract

The UI should expect a normalized album shape:

```js
{
  id: "string",
  title: "string",
  artist: "string",
  cover: "string",
  tags: ["string", "string"]
}
```

API mode should provide one mapping function that transforms the user's real API response into this normalized shape. The only values the page needs are album id, title, artist, cover URL, and matching tags. If the real API does not provide tags, tags can be temporarily derived from a local lookup table keyed by album title.

## Error Handling

- Empty search input shows helper text instead of making a request
- API failure falls back to a friendly error panel
- Missing cover image uses a gradient placeholder
- Invalid drops never corrupt board state

## Testing Strategy

- Unit-test pure logic for:
  - clue-to-album matching
  - board generation uniqueness
  - Bingo line detection
- Manual browser verification for:
  - drag/drop behavior
  - responsive layout
  - celebration state
  - restart and randomize controls

## Deliverables

- Runnable `index.html` MVP
- Inline CSS and JavaScript for easy copying
- Mock album dataset plus clue dataset
- Clearly marked API config section for later replacement
- Usage notes explaining how to wire a real music API
