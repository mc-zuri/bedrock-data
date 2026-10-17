# bedrock-data

What each Bedrock Dedicated Server (BDS) release says, kept per exact build. It is written only by
[bedrock-data-extractor](#regenerating) and read by
[bedrock-data-generator](https://github.com/mc-zuri/bedrock-data-generator), which turns it into
[minecraft-data](https://github.com/PrismarineJS/minecraft-data)'s bedrock files.

Every BDS build minecraft.net offers, previews too, is tracked by the extractor in its own repo
([versions/](https://github.com/mc-zuri/bedrock-data-extractor/tree/main/versions)); each release is extracted here.

The old layout (`data/<build>/block_palette.nbt`, `block-state-shapes.nbt`) is on the `v1` branch.

## Layout

```
versions.json                        every release kept here
release/<build>/build.json           the release: its zips, and what was extracted from which
release/<build>/language.json.gz     its en_US strings
release/<build>/block_palette.nbt    every block state, in runtime id order
release/<build>/block_shapes.json.gz each block state's shapes: collision, visual, UI, outline, camera
schemas/                             JSON schemas of the JSON files above
```

`<build>` is the exact build as minecraft.net names its zip, every part as written there: `1.26.52.3`, `1.21.42.01`
(`bedrock-server-1.21.42.01.zip`; there is no `1.21.42.1`).

## Format

**formatVersion 1**. A change a reader must know about bumps it in `versions.json`; readers refuse a version they do
not know.

### versions.json ([schema](schemas/versions.schema.json))

```json
{
  "formatVersion": 1,
  "release": { "latest": "1.26.52.3", "builds": ["1.26.52.3", "1.26.51.1", "..."] }
}
```

The releases newest first, compared part by part as numbers (`1.21.42.01` is before `1.21.80.3`); `latest` is the
first. It is rebuilt from the `build.json` files on every extractor run, so it never lists a build that has no folder.

### build.json ([schema](schemas/build.schema.json))

```json
{
  "build": "1.26.52.3",
  "version": "1.26.52",
  "channel": "release",
  "binary": {
    "linux": { "url": "https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-1.26.52.3.zip", "sha256": "…", "size": 95103201 },
    "windows": { "url": "https://www.minecraft.net/bedrockdedicatedserver/bin-win/bedrock-server-1.26.52.3.zip", "sha256": "…", "size": 101302107 }
  },
  "data": {
    "language": { "file": "language.json.gz", "from": "linux" },
    "blockPalette": { "file": "block_palette.nbt", "from": "linux" },
    "blockShapes": { "file": "block_shapes.json.gz", "from": "linux" }
  }
}
```

- `build`, `version`, `channel`, `binary`: the extractor's version file of the release
  (`versions/release/<build>.json`), as it was when the release was extracted. `version` is `major.minor.patch`, as
  EndstoneMC/bedrock-server-data names releases.
- `binary`: each platform minecraft.net has this build for, with the zip's sha256 and size in bytes. A platform it has
  no zip of is left out (`1.21.50.07` has only a Windows zip).
- `data`: what was extracted, each kind with its file and the platform whose zip it was read from; that zip was checked
  to be the one `binary` hashes. A platform's server can answer otherwise than the other's
  ([Linux and Windows](#linux-and-windows)), so `from` is part of what a file says.

Nothing in it says when or by which extractor commit it was made: running the extractor again on the same build
changes nothing. The commit that adds or changes a release says which extractor commit made it.

### language.json.gz ([schema](schemas/language.schema.json))

gzip of one JSON object: every resource pack's `texts/en_US.lang` in the server zip
(`resource_packs/<pack>/texts/en_US.lang`), the `vanilla` pack first, then the others by name.

```json
{ "locale": "en_US", "packs": { "vanilla": { "accessibility.index": " %s of %s", "...": "..." }, "chemistry": { "...": "..." }, "editor": { "...": "..." } } }
```

Each pack's keys are in the order the file has them; a key the file says twice keeps its first place and its last
string. A `.lang` file is read as:

1. UTF-8; a byte order mark is dropped, lines end at `\n`, and a `\r` ending one is dropped.
2. A line that is blank, or whose first non-blank character is `#`, says nothing.
3. A line without `=`, or with nothing but blanks before it, says nothing.
4. The key is what is before the **first** `=`, without the spaces around it.
5. The string is everything after that `=`, up to an inline comment: the first `##`, or a tab followed (after any
   more blanks) by `#`. A second `=`, or a `#` that starts neither, is part of the string. Its trailing blanks are
   dropped; its leading ones are kept.

So `advMode.allEntities=@e = all entities` is `@e = all entities`, `gameTip.hotbar.touch=Tap # in hotbar to hold it`
keeps its `#`, `raytracing.RTX.name=RTX##Brand name, don't localize` is `RTX`, and
`accessibility.index= %s of %s<TAB>## This is numbering…` is ` %s of %s`. minecraft-data's earlier `language.json`
files were read by splitting on every `=` and cutting at every `#`, which cut such strings short.

The gzip is written at level 9 with no name and no time; a file is rewritten only when what it decompresses to
changes, so runs on different machines leave it as it is. The other gzipped files are written the same.

### block_palette.nbt

gzip of big-endian NBT: `{ blocks: [{ name, states, version }] }`, one entry per block state in runtime id order (an
entry's index is its runtime id), each entry the state's own CompoundTag as the running server writes it. `name` is a
String (`minecraft:acacia_button`), `states` a Compound of the state's properties (Byte, Int or String:
`{ button_pressed_bit: 0b, facing_direction: 0 }`), `version` an Int, the block state version (17825808 is
1.16.0.16), the same in every entry. The states of a block are next to each other, in the server's own order (which is
not always sorted: `pillar_axis` goes y, x, z). It is the same NBT as the `v1` branch's `block_palette.nbt`.

From 1.19.80 the network names a state by a hash: FNV-1a (32 bits) of the little-endian NBT of `{ name, states }`, its
properties sorted by name, the root's name empty. It is not stored: it follows from the palette.

### block_shapes.json.gz ([schema](schemas/block_shapes.schema.json))

gzip of one JSON object: every block type in the palette's order, each with one entry per state, in the palette's
order: state `i` of a block is that block's `i`-th entry in `block_palette.nbt`.

```json
{
  "blocks": [
    {
      "name": "minecraft:acacia_button",
      "states": [
        {
          "collision": [],
          "visual": [0.3125, 0.875, 0.375, 0.6875, 1, 0.625],
          "ui": [0, 0.375, 0.3125, 0.125, 0.625, 0.6875],
          "outline": [0.3125, 0.875, 0.375, 0.6875, 1, 0.625],
          "camera": null
        },
        "..."
      ]
    },
    {
      "name": "minecraft:hopper",
      "states": [
        { "collision": [[0, 0.625, 0, 1, 0.6875, 1], "..."], "visual": [0, 0, 0, 1, 1, 1], "ui": [0, 0, 0, 1, 1, 1], "outline": [0, 0, 0, 1, 1, 1], "camera": [0, 0, 0, 1, 1, 1] },
        "..."
      ]
    }
  ]
}
```

A box is `[minX, minY, minZ, maxX, maxY, maxZ]` in the block's own coordinates; a fence's collision reaches `maxY`
1.5, a pitcher crop's boxes `minY` -0.0625. Each number is a float32 of the game's, written as the shortest decimal that
reads back as that float32 (`0.95000005` is not `0.95`).

- `collision`: the boxes an entity collides with (`BlockLegacy::addCollisionShapes`); none: it collides with nothing.
  The server is asked with the block at the world's origin and again 16 blocks away: it answers in world coordinates,
  and a box that stays where it was does not belong to the block (builds before 1.18.11 add a unit cube where a block
  says it has no collision shape: buttons, fire, scaffolding; pressure plates before 1.19.50 add a box they never
  move). No chunk is loaded there, so a block whose shape follows its neighbours (fences, walls, panes, stairs) has the
  one it has with no neighbour.
- `visual`: the box it is drawn in (`BlockLegacy::getVisualShape`).
- `ui`: the box of its outline in the UI (`BlockLegacy::getUIShape`).
- `outline`: the box a player's cursor outlines on it (`BlockLegacy::getOutline`, asked at the origin). Before 1.20.30
  `getOutline` takes no state: it reads the block at the position out of the world and gives what
  `BlockLegacy::getAABB(region, pos, block, buffer, true)` gives for it (stairs, which override it, the full block). So
  there, `getAABB` is asked with each state, and the stairs' own `getOutline`.
- `camera`: the box the camera collides with (`BlockLegacy::getCollisionShapeForCamera`, asked at the origin), `null`
  where the game says the block stops no camera. Only from 1.20.30, the first release that has it; older releases have
  no `camera`.

The `v1` branch's `block-state-shapes.nbt` had collision, UI and visual shapes, by `blockStateId`; its `uiShape` and
`visualShape` are these, but its `collisionShape`s were written by more than one rule (some releases with the unit cubes
above).

## Linux and Windows

Each kind of a release is read from one platform's server (`from` in `build.json`): Linux's where both are
supported. Up to 1.26.10 the two servers are built by other compilers (Linux: clang; Windows: MSVC), and a few floats
differ in their last digit; from 1.26.20 the Windows server is built with clang too, and says what Linux says:

- The chest, ender chest and trapped chest (and from 1.21.100 the copper chests) are `0.95000005` high on Linux in
  every release, and on Windows from 1.26.20; on Windows up to 1.26.10, `0.95` (every shape).
- The outlines of potatoes, beetroots, pitcher plants and the double plants (sunflower, lilac, rose bush, peony, tall
  grass, large fern): potatoes at growth 6 are `0.6` high on Linux, and on Windows up to 1.26.10 `0.6000001`.
- On Linux 1.17.0 and 1.17.10, a big dripleaf's head (`big_dripleaf_head`) is drawn in `[0, 0, 0, 0, 0, 0]` (visual,
  UI and outline), and in the full block on Windows: its `getVisualShape` copies `AABB::BLOCK_SHAPE`, which the Linux
  server builds out of `Vec3::ZERO` and `Vec3::ONE` before those are set (its static initializers run in that order),
  so it is empty there.

Neither is corrected: each file says what its platform's server answers.

## Regenerating

Everything here is regenerated by bedrock-data-extractor (`pnpm extract`: each release it supports that this lacks;
`pnpm extract <build...> --force`: given releases, again), never edited by hand. A wrong value is fixed in the
extractor and the releases exported again.

A release is exported once the extractor supports it: its scheduled track finds the build, its support workflow
exports and tests it from each platform's zip, and a pull request there marks the platforms that passed `"supported"`
in its `versions/release/<build>.json`. Merging that runs its extract workflow, which commits here through a write
deploy key of this repo (it can push here and nowhere else).

bedrock-data-generator regenerates minecraft-data on its own schedule, half an hour after the extractor's track. With
a token, the [notify-generator](.github/workflows/notify-generator.yml) workflow has it do so on each commit that
changes a release instead; without one it does nothing:

|                                   |                                                                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| variable `GENERATOR_REPO`         | the generator's repo, `owner/bedrock-data-generator`                                          |
| secret `GENERATOR_DISPATCH_TOKEN` | optional: a token allowed to run that repo's workflows (fine-grained: Actions read and write) |
