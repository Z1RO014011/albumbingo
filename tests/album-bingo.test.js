import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function loadHtml() {
  return fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
}

function loadTestApi() {
  const html = loadHtml();
  const scriptMatch = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/);

  if (!scriptMatch) {
    throw new Error("Could not find inline script in index.html");
  }

  const context = {
    console,
    globalThis: {}
  };

  context.window = context.globalThis;
  context.self = context.globalThis;
  vm.createContext(context);
  vm.runInContext(scriptMatch[1], context);

  return context.globalThis.__albumBingoTestApi;
}

test("index includes the ICP filing number in the footer", () => {
  const html = loadHtml();

  assert.match(html, /蒙ICP备2026005946号/);
});

test("clueMatchesAlbum matches overlapping tags", () => {
  const api = loadTestApi();

  assert.equal(
    api.clueMatchesAlbum(["purple"], ["purple", "portrait"]),
    true
  );
  assert.equal(
    api.clueMatchesAlbum(["crown"], ["portrait", "red"]),
    false
  );
});

test("buildBoard selects 25 unique clues", () => {
  const api = loadTestApi();
  const clues = Array.from({ length: 30 }, (_, index) => ({
    id: `clue-${index}`,
    label: `Clue ${index}`,
    matchTags: [`tag-${index}`]
  }));

  const board = api.buildBoard(clues, 5, () => 0.999);

  assert.equal(board.length, 25);
  assert.equal(new Set(board.map((cell) => cell.clue.id)).size, 25);
});

test("buildPromptDeck keeps the mixed pack ratio weighted toward visual prompts", () => {
  const api = loadTestApi();
  const deck = api.buildPromptDeck(() => 0.999);
  const groups = deck.reduce((summary, clue) => {
    summary[clue.group] = (summary[clue.group] ?? 0) + 1;
    return summary;
  }, {});

  assert.equal(deck.length, 25);
  assert.equal(groups.visual, 14);
  assert.equal(groups.mood, 7);
  assert.equal(groups.culture, 4);
});

test("findCompletedLines detects row, column, and diagonal bingos", () => {
  const api = loadTestApi();
  const rowCells = Array.from({ length: 25 }, (_, index) => ({
    index,
    locked: index < 5
  }));
  const colCells = Array.from({ length: 25 }, (_, index) => ({
    index,
    locked: index % 5 === 0
  }));
  const diagonalCells = Array.from({ length: 25 }, (_, index) => ({
    index,
    locked: [0, 6, 12, 18, 24].includes(index)
  }));

  assert.equal(api.findCompletedLines(rowCells, 5).length, 1);
  assert.equal(api.findCompletedLines(colCells, 5).length, 1);
  assert.equal(api.findCompletedLines(diagonalCells, 5).length, 1);
});

test("normalizeAlbum maps a source record into the UI contract", () => {
  const api = loadTestApi();
  const album = JSON.parse(
    JSON.stringify(
      api.normalizeAlbum({
        id: 7,
        name: "UTOPIA",
        artistName: "Travis Scott",
        cover_url: "https://example.com/utopia.jpg",
        tags: ["dark"]
      })
    )
  );

  assert.deepEqual(album, {
    id: "7",
    title: "UTOPIA",
    artist: "Travis Scott",
    cover: "https://example.com/utopia.jpg",
    fallbackCover: "",
    tags: ["dark"]
  });
});

test("normalizeAlbum supports common NetEase album fields", () => {
  const api = loadTestApi();
  const album = JSON.parse(
    JSON.stringify(
      api.normalizeAlbum({
        id: 88,
        name: "SOS",
        picUrl: "https://p1.music.126.net/demo.jpg",
        artists: [{ name: "SZA" }]
      })
    )
  );

  assert.deepEqual(album, {
    id: "88",
    title: "SOS",
    artist: "SZA",
    cover: "https://p1.music.126.net/demo.jpg",
    fallbackCover: "",
    tags: ["blue", "water", "ocean", "solo", "minimal"]
  });
});

test("normalizeAlbum supports iTunes album fields", () => {
  const api = loadTestApi();
  const album = JSON.parse(
    JSON.stringify(
      api.normalizeAlbum({
        collectionId: 501,
        collectionName: "IGOR",
        artistName: "Tyler, The Creator",
        artworkUrl100: "https://is1-ssl.mzstatic.com/image/thumb/demo/100x100bb.jpg"
      })
    )
  );

  assert.deepEqual(album, {
    id: "501",
    title: "IGOR",
    artist: "Tyler, The Creator",
    cover: "https://is1-ssl.mzstatic.com/image/thumb/demo/600x600bb.jpg",
    fallbackCover: "",
    tags: ["pink", "portrait", "closeup", "face", "solo"]
  });
});

test("createCoverDataUri escapes special characters for SVG text", () => {
  const api = loadTestApi();
  const dataUrl = api.createCoverDataUri(
    "Heroes & Villains",
    "Metro Boomin",
    ["#121212", "#585858", "#cfcfcf"]
  );
  const svg = decodeURIComponent(dataUrl.split(",")[1]);

  assert.equal(svg.includes("Heroes & Villains"), false);
  assert.equal(svg.includes("Heroes &amp; Villains"), true);
});

test("toLargeArtworkUrl upgrades iTunes artwork sizes", () => {
  const api = loadTestApi();
  const upgraded = api.toLargeArtworkUrl(
    "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/demo/100x100bb.jpg"
  );

  assert.equal(
    upgraded,
    "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/demo/600x600bb.jpg"
  );
});

test("pickBestArtworkResult prefers exact album and artist matches", () => {
  const api = loadTestApi();
  const album = { title: "IGOR", artist: "Tyler, The Creator" };
  const match = api.pickBestArtworkResult(album, [
    {
      collectionName: "IGOR",
      artistName: "Tyler, The Creator",
      artworkUrl100: "https://example.com/right/100x100bb.jpg"
    },
    {
      collectionName: "Igor Stravinsky Collection",
      artistName: "Various Artists",
      artworkUrl100: "https://example.com/wrong/100x100bb.jpg"
    }
  ]);

  assert.equal(match.artworkUrl100, "https://example.com/right/100x100bb.jpg");
});

test("buildItunesSearchUrl creates a direct album search request", () => {
  const api = loadTestApi();
  const url = api.buildItunesSearchUrl("tyler", 12);

  assert.equal(
    url,
    "https://itunes.apple.com/search?term=tyler&media=music&entity=album&limit=12"
  );
});

test("buildItunesLookupUrl creates an artist album lookup request", () => {
  const api = loadTestApi();
  const url = api.buildItunesLookupUrl("12345", 30);

  assert.equal(
    url,
    "https://itunes.apple.com/lookup?id=12345&entity=album&limit=30"
  );
});

test("findBestItunesArtistMatch prefers an exact artist name match", () => {
  const api = loadTestApi();
  const artist = JSON.parse(
    JSON.stringify(
      api.findBestItunesArtistMatch("daniel caesar", [
        { artistId: 1, artistName: "Daniel Caesar" },
        { artistId: 2, artistName: "Daniel Johnston" }
      ])
    )
  );

  assert.deepEqual(artist, {
    artistId: "1",
    artistName: "Daniel Caesar"
  });
});

test("mergeAndRankItunesAlbums prioritizes exact-artist albums and removes duplicates", () => {
  const api = loadTestApi();
  const albums = JSON.parse(
    JSON.stringify(
      api.mergeAndRankItunesAlbums("daniel caesar", {
        searchResults: [
          {
            id: "search-never",
            title: "Never Enough",
            artist: "Daniel Caesar",
            cover: "",
            fallbackCover: "",
            tags: []
          },
          {
            id: "search-other",
            title: "Random Collection",
            artist: "Various Artists",
            cover: "",
            fallbackCover: "",
            tags: []
          }
        ],
        artistAlbums: [
          {
            id: "artist-never",
            title: "Never Enough",
            artist: "Daniel Caesar",
            cover: "",
            fallbackCover: "",
            tags: []
          },
          {
            id: "artist-freudian",
            title: "Freudian",
            artist: "Daniel Caesar",
            cover: "",
            fallbackCover: "",
            tags: []
          }
        ]
      })
    )
  );

  assert.deepEqual(
    albums.map((album) => album.title),
    ["Never Enough", "Freudian", "Random Collection"]
  );
});

test("searchAlbumsMock filters by title and artist", async () => {
  const api = loadTestApi();
  const results = await api.searchAlbumsMock("utopia", [
    {
      id: "1",
      title: "UTOPIA",
      artist: "Travis Scott",
      cover: "",
      tags: []
    },
    {
      id: "2",
      title: "SOS",
      artist: "SZA",
      cover: "",
      tags: []
    }
  ]);

  assert.equal(results.length, 1);
  assert.equal(results[0].title, "UTOPIA");
});

test("searchAlbumsMock returns no default examples when query is blank", async () => {
  const api = loadTestApi();
  const results = await api.searchAlbumsMock("", [
    {
      id: "1",
      title: "UTOPIA",
      artist: "Travis Scott",
      cover: "",
      tags: []
    }
  ]);

  assert.equal(results.length, 0);
});

test("placeAlbumInCell accepts any album in free placement mode", () => {
  const api = loadTestApi();
  const cell = {
    index: 0,
    clue: { id: "purple", label: "紫色主色调", matchTags: ["purple"] },
    placedAlbum: null,
    locked: false
  };
  const match = {
    id: "1",
    title: "A",
    artist: "A",
    cover: "",
    tags: ["purple"]
  };
  const miss = {
    id: "2",
    title: "B",
    artist: "B",
    cover: "",
    tags: ["black"]
  };

  assert.equal(api.placeAlbumInCell(cell, miss).accepted, true);
  assert.equal(api.placeAlbumInCell(cell, match).accepted, true);
});
