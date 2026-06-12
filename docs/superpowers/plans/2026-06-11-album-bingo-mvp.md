# Album Bingo MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-file Album Bingo web MVP with clue-based cells, album search, drag-and-drop placement, Bingo detection, mock data, and a configurable API adapter.

**Architecture:** Keep the shipped app in one `index.html` file, but structure the JavaScript internally into focused sections: configuration, data normalization, pure game logic, rendering, and event wiring. Expose pure logic through a small test API so Node-based tests can validate matching and Bingo behavior without a browser framework.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node built-in test runner

---

## File Structure

- Create: `/Users/zhr/Documents/专辑封面bingo/index.html`
- Create: `/Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`
- Create: `/Users/zhr/Documents/专辑封面bingo/docs/superpowers/specs/2026-06-11-album-bingo-design.md`
- Create: `/Users/zhr/Documents/专辑封面bingo/docs/superpowers/plans/2026-06-11-album-bingo-mvp.md`

### Task 1: Add failing tests for the core game logic

**Files:**
- Create: `/Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`
- Test: `/Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`

- [ ] **Step 1: Write the failing tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
const context = { console, globalThis: {} };
context.window = context.globalThis;
vm.createContext(context);
vm.runInContext(script, context);

const api = context.globalThis.__albumBingoTestApi;

test("matches album tags to clue tags", () => {
  assert.equal(api.clueMatchesAlbum(["purple"], ["purple", "portrait"]), true);
  assert.equal(api.clueMatchesAlbum(["crown"], ["portrait", "red"]), false);
});

test("detects a completed row as bingo", () => {
  const cells = Array.from({ length: 25 }, (_, index) => ({
    index,
    locked: index < 5
  }));

  const result = api.findCompletedLines(cells, 5);
  assert.equal(result.length, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test /Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`
Expected: FAIL because `/Users/zhr/Documents/专辑封面bingo/index.html` or `__albumBingoTestApi` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create the smallest possible `index.html` skeleton that defines:

```js
function clueMatchesAlbum(clueTags, albumTags) {
  return clueTags.some((tag) => albumTags.includes(tag));
}

function findCompletedLines(cells, size) {
  return [];
}

globalThis.__albumBingoTestApi = {
  clueMatchesAlbum,
  findCompletedLines
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test /Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`
Expected: first test PASS, second test FAIL

- [ ] **Step 5: Commit**

```bash
git add /Users/zhr/Documents/专辑封面bingo/index.html /Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js
git commit -m "test: add initial album bingo logic coverage"
```

### Task 2: Implement board logic and make tests green

**Files:**
- Modify: `/Users/zhr/Documents/专辑封面bingo/index.html`
- Modify: `/Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`
- Test: `/Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`

- [ ] **Step 1: Write the next failing tests**

Add tests for:

```js
test("buildBoard selects 25 unique clues", () => {
  const clues = Array.from({ length: 30 }, (_, index) => ({
    id: `clue-${index}`,
    label: `Clue ${index}`,
    matchTags: [`tag-${index}`]
  }));

  const board = api.buildBoard(clues, 5, () => 0.999);
  assert.equal(board.length, 25);
  assert.equal(new Set(board.map((cell) => cell.clue.id)).size, 25);
});

test("detects row, column, and diagonal bingos", () => {
  const rowCells = Array.from({ length: 25 }, (_, index) => ({ index, locked: index < 5 }));
  const colCells = Array.from({ length: 25 }, (_, index) => ({ index, locked: index % 5 === 0 }));
  const diagonalCells = Array.from({ length: 25 }, (_, index) => ({ index, locked: [0, 6, 12, 18, 24].includes(index) }));

  assert.equal(api.findCompletedLines(rowCells, 5).length, 1);
  assert.equal(api.findCompletedLines(colCells, 5).length, 1);
  assert.equal(api.findCompletedLines(diagonalCells, 5).length, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test /Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`
Expected: FAIL because `buildBoard` is missing or returns the wrong shape.

- [ ] **Step 3: Write minimal implementation**

Implement:

```js
function shuffleList(list, randomFn = Math.random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildBoard(clues, size = 5, randomFn = Math.random) {
  return shuffleList(clues, randomFn)
    .slice(0, size * size)
    .map((clue, index) => ({
      index,
      clue,
      placedAlbum: null,
      locked: false
    }));
}

function findCompletedLines(cells, size = 5) {
  // include horizontal, vertical, diagonal scans
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test /Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/zhr/Documents/专辑封面bingo/index.html /Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js
git commit -m "feat: add album bingo board logic"
```

### Task 3: Build the UI shell and wire rendering

**Files:**
- Modify: `/Users/zhr/Documents/专辑封面bingo/index.html`
- Test: `/Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`

- [ ] **Step 1: Write the next failing test**

Add one rendering-safe data test:

```js
test("normalizeAlbum returns the required client shape", () => {
  const album = api.normalizeAlbum({
    id: 7,
    name: "UTOPIA",
    artist: "Travis Scott",
    cover_url: "https://example.com/utopia.jpg",
    tags: ["dark"]
  });

  assert.deepEqual(album, {
    id: "7",
    title: "UTOPIA",
    artist: "Travis Scott",
    cover: "https://example.com/utopia.jpg",
    tags: ["dark"]
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test /Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`
Expected: FAIL because `normalizeAlbum` is undefined.

- [ ] **Step 3: Write minimal implementation**

Add:

```js
function normalizeAlbum(source) {
  return {
    id: String(source.id ?? source.albumId ?? source.title),
    title: source.title ?? source.name ?? "Unknown Album",
    artist: source.artist ?? source.artistName ?? "Unknown Artist",
    cover: source.cover ?? source.cover_url ?? source.artwork ?? "",
    tags: Array.isArray(source.tags) ? source.tags : []
  };
}
```

Then build the HTML structure, CSS theme, render functions, and state container around those tested helpers.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test /Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/zhr/Documents/专辑封面bingo/index.html /Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js
git commit -m "feat: add album bingo interface"
```

### Task 4: Add search modes, drag/drop, and celebration logic

**Files:**
- Modify: `/Users/zhr/Documents/专辑封面bingo/index.html`
- Modify: `/Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`
- Test: `/Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`

- [ ] **Step 1: Write the next failing tests**

Add tests for:

```js
test("searchAlbumsMock filters by title and artist", async () => {
  const results = await api.searchAlbumsMock("utopia", [
    { title: "UTOPIA", artist: "Travis Scott", tags: [] },
    { title: "SOS", artist: "SZA", tags: [] }
  ]);

  assert.equal(results.length, 1);
  assert.equal(results[0].title, "UTOPIA");
});

test("placeAlbumInCell only accepts matching albums", () => {
  const cell = {
    index: 0,
    clue: { id: "purple", label: "紫色主色调", matchTags: ["purple"] },
    placedAlbum: null,
    locked: false
  };
  const match = { id: "1", title: "A", artist: "A", cover: "", tags: ["purple"] };
  const miss = { id: "2", title: "B", artist: "B", cover: "", tags: ["black"] };

  assert.equal(api.placeAlbumInCell(cell, miss).accepted, false);
  assert.equal(api.placeAlbumInCell(cell, match).accepted, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test /Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`
Expected: FAIL because the mock search or placement helper is missing.

- [ ] **Step 3: Write minimal implementation**

Implement mock search, API search adapter, drag state, placement validation, rejection feedback, and Bingo celebration rendering.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test /Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/zhr/Documents/专辑封面bingo/index.html /Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js
git commit -m "feat: add album search and drag bingo flow"
```

### Task 5: Verify browser behavior and document API wiring

**Files:**
- Modify: `/Users/zhr/Documents/专辑封面bingo/index.html`

- [ ] **Step 1: Open the page and manually verify**

Check:

```text
1. Initial board renders with 25 clues
2. Search returns mock albums
3. Dragging a matching album completes a cell
4. Dragging a non-matching album shows rejection feedback
5. A completed line triggers the BINGO banner
6. Restart clears placed covers
7. Randomize rebuilds the clue layout
8. Mobile layout stacks correctly
```

- [ ] **Step 2: Run the automated tests**

Run: `node --test /Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js`
Expected: PASS

- [ ] **Step 3: Add API setup notes in the page**

Document where to edit:

```js
const API_CONFIG = {
  enabled: false,
  endpoint: "https://your-api.example.com/search",
  queryParam: "q"
};
```

Explain how to map response items through `normalizeAlbum`.

- [ ] **Step 4: Commit**

```bash
git add /Users/zhr/Documents/专辑封面bingo/index.html /Users/zhr/Documents/专辑封面bingo/tests/album-bingo.test.js
git commit -m "docs: finalize album bingo api wiring notes"
```

## Self-Review

- Spec coverage: the plan covers board generation, clue matching, search behavior, drag/drop acceptance rules, Bingo detection, API adapter shape, and browser verification.
- Placeholder scan: no `TODO` or `TBD` markers remain in executable steps.
- Type consistency: plan uses `title`, `artist`, `cover`, `tags`, `buildBoard`, `findCompletedLines`, `normalizeAlbum`, and `placeAlbumInCell` consistently throughout.
