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
release/<build>/blocks.json.gz       what the game says of each block type and state: its facts, dig speeds, drops
release/<build>/items.json.gz        every registered item, and what the server sends a client of them
release/<build>/enchantments.json.gz every enchantment
release/<build>/biomes.json.gz       every biome of the registry, and what the server sends of it
release/<build>/effects.json.gz      every mob effect
release/<build>/enums.json.gz        the names the game gives its sound events, particles, containers, instruments, ...
release/<build>/tints.json.gz        the colours the server draws its maps with
release/<build>/recipes.json.gz      the recipes of a grid the server sends
release/<build>/entities.json.gz     the entities the server sends, and the behavior packs' definitions of them
release/<build>/commands.json.gz     the commands the server sends, and its console's help for each
release/<build>/attributes.json.gz   the attributes the server sends a joining player
release/<build>/steve.json.gz        the default skin a client of the release's version sends
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
    "blockShapes": { "file": "block_shapes.json.gz", "from": "linux" },
    "blocks": { "file": "blocks.json.gz", "from": "linux" },
    "items": { "file": "items.json.gz", "from": "linux" },
    "enchantments": { "file": "enchantments.json.gz", "from": "linux" },
    "biomes": { "file": "biomes.json.gz", "from": "linux" },
    "effects": { "file": "effects.json.gz", "from": "linux" },
    "enums": { "file": "enums.json.gz", "from": "linux" },
    "tints": { "file": "tints.json.gz", "from": "linux" },
    "recipes": { "file": "recipes.json.gz", "from": "linux" },
    "entities": { "file": "entities.json.gz", "from": "linux" },
    "commands": { "file": "commands.json.gz", "from": "linux" },
    "attributes": { "file": "attributes.json.gz", "from": "linux" }
  }
}
```

- `build`, `version`, `channel`, `binary`: the extractor's version file of the release
  (`versions/release/<build>.json`), as it was when the release was extracted. `version` is `major.minor.patch`, as
  EndstoneMC/bedrock-server-data names releases.
- `binary`: each platform minecraft.net has this build for, with the zip's sha256 and size in bytes. A platform it has
  no zip of is left out (`1.21.50.07` has only a Windows zip).
- `data`: what was extracted, each kind with its file and the platform whose zip it was read from; that zip was checked
  to be the one `binary` hashes. `steve` has no platform: it is recorded from a client, where a person has joined with
  one of the release's version (`pnpm steve`), and only there. A platform's server can answer otherwise than the other's
  ([Linux and Windows](#linux-and-windows)), so `from` is part of what a file says.

Nothing in it says when or by which extractor commit it was made: running the extractor again on the same build
changes nothing. The commit that adds or changes a release says which extractor commit made it.

### language.json.gz ([schema](schemas/language.schema.json))

gzip of one JSON object: every resource pack's `texts/en_US.lang` in the server zip
(`resource_packs/<pack>/texts/en_US.lang`), the `vanilla` pack first, then the others by name. 1.16.220.02's Linux zip
has no `resource_packs/chemistry/texts/en_US.lang`, though the pack's `contents.json` lists it: its `chemistry` is the
Windows zip's (`from` is still `linux`, the zip every other pack was read from).

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

### blocks.json.gz ([schema](schemas/blocks.schema.json))

gzip of one JSON object: every block type in the palette's order, each with one entry per state, in the palette's order
(as block_shapes.json.gz), and the loot tables they name.

```json
{
  "blocks": [
    {
      "name": "minecraft:stone",
      "id": 1,
      "descriptionId": "tile.stone",
      "tags": ["minecraft:stone"],
      "requiresCorrectTool": true,
      "translucency": 0,
      "defaultState": 0,
      "states": [
        {
          "data": 0,
          "hardness": 1.5,
          "explosionResistance": 6,
          "friction": 0.6,
          "flameOdds": 0,
          "burnOdds": 0,
          "lightEmission": 0,
          "lightDampening": 15,
          "canContainLiquid": false,
          "mapColor": [0.43921572, 0.43921572, 0.43921572, 1],
          "destroySpeeds": { "minecraft:wooden_pickaxe": 2, "minecraft:diamond_pickaxe": 8, "...": 0 },
          "harvestedBy": ["minecraft:wooden_pickaxe", "..."],
          "drops": { "samples": 8192, "items": [{ "item": "minecraft:cobblestone", "aux": 0, "data": 0, "minCount": 1, "maxCount": 1, "hits": 8192 }] }
        }
      ]
    }
  ],
  "lootTables": { "loot_tables/blocks/white_wool_slab.json": { "pools": ["..."] } }
}
```

Read from the running server (where the game keeps a fact on the block type, every state of it has the same):

- `id`: the block's numeric id (`BlockLegacy::mID`); `descriptionId`: its language key, without `.name`; `tags`: its
  block tags, sorted.
- `requiresCorrectTool`: it drops only when dug by an item that harvests it (`harvestedBy`).
- `translucency`: `BlockLegacy::mTranslucency`. `defaultState`: the game's default state, an index into `states`.
- `loot`: the `minecraft:loot` tables the vanilla behavior packs' definition of the block names (keys of
  `lootTables`, which holds them as the packs do); only where some pack defines the block.
- `data`: `Block::mData`, the data value a stack of the block's item carries.
- `hardness` (the destroy speed: -1 where it cannot be dug), `explosionResistance`, `friction`, `flameOdds` and
  `burnOdds` (how readily fire catches on it and burns it away), `lightEmission`, `lightDampening`: as the game keeps
  them. A data-driven block's explosion resistance is what the game keeps, a fifth of its pack's (1.26.51:
  `white_wool_slab` 0.16).
- `canContainLiquid`: it can be waterlogged: `BlockLegacy::canContainLiquid()`, or (1.26, whose base answers false)
  its liquid detection component's.
- `mapColor`: what a map draws it with, `Block::getMapColor` with the state set in a flat world (whose biome is plains
  everywhere): `[r, g, b, a]`, each 0 - 1. A tinted block's (grass, leaves, water) is plains', its alpha 0.
- `destroySpeeds`: each item's `Item::getDestroySpeed` on it, held as a stack of one without enchantments, where it is
  not 1; `harvestedBy`: the items whose `Item::canDestroySpecial` holds for it.
- `drops`: what the game's own drop code drops when a player mines it with an empty hand: drawn `samples` times from a
  Random seeded by the block's name (about 8192 draws a type, at least 64 a state), each item with the stack's own data
  value (`aux`), the one `ItemStackBase::getAuxValue` reads (`data`: of the block it carries), the fewest and most in a
  draw that dropped it and how many draws did. A block that keeps a block actor (a chest, a banner) is set in a loaded
  chunk first, as its actor says what it drops. `samples` 0: a data-driven block, which has no drop code; its `loot`
  applies.

### items.json.gz ([schema](schemas/items.schema.json))

gzip of one JSON object: every registered item in id order, the old names the game still reads, and the creative list.

```json
{
  "items": [
    { "name": "minecraft:diamond_sword", "id": 316, "descriptionId": "item.diamond_sword", "descriptionName": "Diamond Sword", "maxStackSize": 1, "maxDamage": 1561, "enchantSlots": 16, "tags": ["minecraft:is_sword", "..."], "repairItems": ["minecraft:diamond"], "componentBased": false }
  ],
  "aliases": [{ "name": "minecraft:fish", "item": "minecraft:cod" }],
  "complexAliases": [{ "name": "minecraft:log", "items": ["minecraft:oak_log", "..."] }],
  "creative": [{ "item": "minecraft:oak_planks", "metadata": 0, "blockState": 20030 }]
}
```

- `id`: the runtime id the server sends a client for it (checked to be the one it sends). `maxStackSize`:
  `Item::getMaxStackSize` of a stack without data (a bucket's by what it holds), where it calls nothing, else (a
  data-driven item: 1.21.93's egg) the item's own field; `maxDamage`: `Item::getMaxDamage`, 0
  where it does not wear out; `enchantSlots`: `Item::getEnchantSlot`, its `Enchant::Slot` bits; `repairItems`: the
  items `Item::isValidRepairItem` takes, where it wears out.
- `descriptionName`: its name as the game builds it, `Item::buildDescriptionName` of a stack of one (a block item's
  holding its block's default state): the server's en_US name ("Bucket of Cod", "White Bed", "Oak Fence"), or, where
  the server's language has none (the chemistry pack's, which the server does not load), the key it builds
  (`tile.element.h.name`), which `language.json.gz` has; empty where the game names it nothing.
- `componentBased`, and from 1.21.60 `version` and `nbt` (its components, as an NBT tag `{ type, name, value }`): as the
  item registry the server sends a client has them. `components`: its components as item_component sends them, an NBT
  tag of the same form, where it sends them (1.18.11 to 1.21.50: the vanilla foods and more). `creative`: the creative
  list it sends, in its order, each stack's block state its runtime id (from 1.19.80 the network sends a hash of it),
  null where it places none (every stack before 1.16.220); an empty stack is left out.
- `food`: `{ nutrition, saturationModifier }`, as the item's legacy food component (`Item::mFoodComponentLegacy`) has
  them, where the build keeps one (up to about 1.20.50, where some foods become data-driven and the server sends theirs
  in their components instead).

### enchantments.json.gz ([schema](schemas/enchantments.schema.json))

gzip of one JSON object: every enchantment by id from 0, with its slots (`Enchant::Slot` bits: those an enchanting
table offers it for, and those only an anvil puts it on), weight, levels, `Enchant::getMinCost` / `getMaxCost` at levels
1 to its max level (at least 2), and the ids of those `Enchant::isCompatibleWith` refuses.

```json
{ "enchantments": [{ "id": 0, "name": "protection", "descriptionId": "enchantment.protect.all", "frequency": 30, "tradeable": true, "primarySlots": 15, "secondarySlots": 0, "minLevel": 1, "maxLevel": 4, "minCost": [1, 12, 23, 34], "maxCost": [21, 32, 43, 54], "incompatible": [3, 4, 5], "treasureOnly": false, "discoverable": true }] }
```

### biomes.json.gz ([schema](schemas/biomes.schema.json))

gzip of one JSON object: every biome of the game's registry, by name, with its numeric id (read from the running
server: the packet never sends a vanilla biome's id) and what biome_definition_list sends of it.

```json
{ "biomes": [{ "name": "plains", "id": 1, "definition": { "temperature": 0.8, "downfall": 0.4, "depth": 0.125, "scale": 0.05, "rain": true, "mapWaterColor": 4501493, "tags": ["animal", "monster", "overworld", "plains"] } }] }
```

- `name`: as the registry names it, without `minecraft:`; `id`: the id a chunk's biomes are saved and sent by.
- `definition`: where the server sends it; `depth`, `scale`, `rain` and `mapWaterColor` (its water's colour on a map,
  `0xRRGGBB`) from 1.19.20, where the server starts to send them.

### effects.json.gz ([schema](schemas/effects.schema.json))

gzip of one JSON object: every mob effect (`MobEffect::mMobEffects`), by the id the server sends a client for it from 1:
its name, language key and whether it is harmful.

```json
{ "effects": [{ "id": 1, "name": "speed", "descriptionId": "potion.moveSpeed", "harmful": false }] }
```

### enums.json.gz ([schema](schemas/enums.schema.json))

gzip of one JSON object: the names the game gives some of its enums, each a list of `{ id, name }`, read from the tables
it keeps them in.

```json
{ "sounds": [{ "id": 0, "name": "item.use.on" }], "particles": [{ "id": 1, "name": "bubble" }], "containers": [{ "id": -1, "name": "INVENTORY" }], "instruments": [{ "id": 0, "name": "note.harp" }], "mapDecorations": [{ "id": 0, "name": "MarkerWhite" }], "containerNames": [{ "id": 0, "name": "anvil_input" }], "explorationMarkers": [{ "id": 15, "name": "minecraft:monument" }] }
```

- `sounds` (`LevelSoundEventMap`) and `particles` (`ParticleTypeMap`): by id, with gaps; an alias's id comes twice,
  under each name, by name (from 1.21.60 the game keeps only the name to id map).
- `containers` (`Container::containerTypeMap`) and `containerNames` (`ContainerCollectionNameMap`, the containers item
  stack requests name): by id.
- `instruments`: the note block instruments' sounds by instrument (the id a note block sends), the name alone before
  1.19.60 (`harp`); none from 1.21.50 to 1.26.20 (on Linux to 1.26.30), which keep no table of them.
- `mapDecorations`: `MapDecoration::Type` as the game's reflection registers it, from 1.26.40.
- `explorationMarkers`: the decoration types exploration maps mark, each named by the feature it leads to, in the
  registry's order (`ExplorationMapRegistry`, from 1.20.40; before, the exploration map loot function's cases).

### tints.json.gz ([schema](schemas/tints.schema.json))

gzip of one JSON object: the colours the server draws its maps with (a dedicated server renders nothing else: the
palettes a client tints its blocks from are never filled there), each `0xRRGGBB`, from the game's own functions.

```json
{ "biomes": [{ "name": "plains", "grass": 9551193, "foliage": 7842607, "water": 4501493 }], "redstone": [4915200, "..."], "constant": [{ "name": "minecraft:birch_leaves", "color": 8431445 }] }
```

- `biomes`: each biome's grass and foliage (its custom colour where it has one, else the swamp's noise at the origin,
  else the corner colours blended by its temperature and downfall), and its water's where the agent reads it.
- `redstone`: the redstone wire's colour in each of its states, in state order; none from 1.21.20, where the server
  keeps no block colour.
- `constant`: the block types tinted with one colour wherever they are, in runtime id order: the birch and spruce
  leaves, from 1.20.71, where they are types of their own.

### recipes.json.gz ([schema](schemas/recipes.schema.json))

gzip of one JSON object: the recipes of a grid crafting_data sends (shaped, shapeless, and the shulker boxes', which keep
the box's contents) at every block, in the server's order.

```json
{ "recipes": [{ "type": "shaped", "id": "minecraft:barrel", "block": "deprecated", "width": 3, "height": 3, "input": [{ "descriptor": "minecraft:stick", "count": 1 }, { "tag": "minecraft:wooden_slabs", "count": 1 }, "...", null, "..."], "output": [{ "item": "minecraft:barrel", "metadata": 0, "count": 1, "blockState": 9471 }] }] }
```

- `block`: where it is made (`crafting_table`, `stonecutter`, `cartography_table`, `smithing_table` up to 1.19.50;
  `deprecated` the crafting grid's old recipes); from 1.26.20 the furnaces' recipes are sent as shapeless ones of their
  blocks, and the old furnace's as `deprecated` ones too (`minecraft:furnace_*`).
- `input`: a shaped recipe's slots row by row (null: an empty one), a shapeless recipe's ingredients: an `item` (by
  network id until 1.26.30, by name from 1.26.40; `metadata` absent: any data value), a `descriptor` (an item named by
  name, which the server resolves through the complex aliases first, from 1.26.40), a `tag` or a complex `alias` (from
  1.19.40), or a `molang` expression.
- `output`: the result, then what the ingredients give back (cake's buckets); `blockState`: the block state it carries,
  its runtime id (from 1.19.80 the network sends a hash of it), null where none.

### entities.json.gz ([schema](schemas/entities.schema.json))

gzip of one JSON object: every entity available_entity_identifiers sends (its order is the server's: a hash map's), the
vanilla behavior packs' definitions of entities by identifier (each `minecraft:entity`'s description, components,
component groups and events, a later pack's over an earlier's; a definition without an identifier, vanilla_1.16.100's
npc, adds its components to the one an earlier pack has at its path), and every loot table their `minecraft:loot`
reaches, as the packs have them. A table no pack has (the piglin's: its drops are code) is left out.

```json
{ "entities": [{ "name": "minecraft:zombie", "id": 32, "hasSpawnEgg": true, "summonable": true }], "definitions": { "minecraft:zombie": { "description": { "identifier": "minecraft:zombie" }, "components": { "...": {} } } }, "lootTables": { "loot_tables/entities/zombie.json": { "pools": ["..."] } } }
```

### commands.json.gz ([schema](schemas/commands.schema.json))

gzip of one JSON object: every command available_commands sends a joining player (its permission is a member's), in
its order, with what the server's console answers `help <command>` (with cheats allowed: before 1.21.0 it describes only
the commands that need none otherwise), a line each, without the log's prefix and colours; and every enum a parameter
may take, its values.

```json
{ "commands": [{ "name": "teleport", "description": "commands.tp.description", "aliases": ["tp"], "help": ["teleport (also tp):", "Teleports entities (players, mobs, etc.).", "Usage:", "- /teleport <destination: target>", "..."] }], "enums": { "GameMode": ["survival", "creative", "..."] } }
```

- `enums`: the enums, the soft ones (as the server fills them when a client joins) and execute's subcommands that chain
  into others (`ExecuteChainedOption_0`), each one's values sorted: the server lists those it reads from its packs' files
  (`Features`, `CameraPresets`) in the order the machine lists the files, and a value is sent by its text.

### attributes.json.gz ([schema](schemas/attributes.schema.json))

gzip of one JSON object: the attributes update_attributes sends for a joining player, in its order, each float the
shortest decimal of its float32.

```json
{ "attributes": [{ "name": "minecraft:movement", "min": 0, "max": 3.4028235e38, "default": 0.1, "value": 0.1 }] }
```

### steve.json.gz ([schema](schemas/steve.schema.json))

gzip of one JSON object: the skin a client of the release's version sends in its login when it has the default one
(Steve), its fields as the login has them (images and geometry base64). No server holds it: a real client joins the
extractor once (`pnpm steve`). The client tags the skin with a persona id (`persona-<PlayFab id>-<n>`) in `SkinId`,
`SkinResourcePatch` and `SkinGeometryData`, which names the account that joined and counts its captures: it is
`persona-123456789012345-0` in all three, so captures of the same skin are equal and no account is in them.

```json
{ "ArmSize": "wide", "SkinData": "AAAA…", "SkinId": "persona-123456789012345-0", "SkinImageHeight": 256, "SkinImageWidth": 256, "...": "..." }
```

## Linux and Windows

Each kind of a release is read from one platform's server (`from` in `build.json`): Linux's where both are
supported. Up to 1.26.10 the two servers are built by other compilers (Linux: clang; Windows: MSVC), and a few floats
differ in their last digit; from 1.26.20 the Windows server is built with clang too, and says what Linux says but for
the numbering of some items:

- The chest, ender chest and trapped chest (and from 1.21.100 the copper chests) are `0.95000005` high on Linux in
  every release, and on Windows from 1.26.20; on Windows up to 1.26.10, `0.95` (every shape): ChestBlock's box is a
  constant that clang folds to the one and MSVC to the other. This one is corrected: `block_shapes.json.gz` read from
  Linux before 1.26.20 has `0.95`, as Windows does, so the collision shapes do not depend on the platform.
- The outlines of potatoes, beetroots, pitcher plants and the double plants (sunflower, lilac, rose bush, peony, tall
  grass, large fern): potatoes at growth 6 are `0.6` high on Linux, and on Windows up to 1.26.10 `0.6000001`.
- On Linux 1.17.0 and 1.17.10, a big dripleaf's head (`big_dripleaf_head`) is drawn in `[0, 0, 0, 0, 0, 0]` (visual,
  UI and outline), and in the full block on Windows: its `getVisualShape` copies `AABB::BLOCK_SHAPE`, which the Linux
  server builds out of `Vec3::ZERO` and `Vec3::ONE` before those are set (its static initializers run in that order),
  so it is empty there.
- From 1.21.42 to 1.26.10, 21 blocks' explosion resistance (terracotta, the dirt path, concrete, ...) is `4.2`,
  `0.65`, `1.8` on Linux and `4.2000003`, `0.65000004`, `1.8000001` on Windows: a state's is its type's (kept times 5)
  divided by 5, which the MSVC-built server does as times 0.2. This one is corrected too: `blocks.json.gz` read from
  Linux has the Windows values.
- Up to 1.26.30 the items a `vanilla_<version>` behavior pack defines (the spears, bundles, trial keys, the wind
  charge) are numbered (`items.json.gz`'s `id`, the runtime id) in another order on each platform: both give a pack's
  items the same ids, Windows in the order its folder lists their files (by name), Linux in an order of its own
  (1.21.130: the stone spear is 258 on Linux, 262 on Windows). This one is corrected too: `items.json.gz` read from
  Linux numbers them as Windows does. From 1.26.40 both number them by name.
- What the server sends out of a hash map comes in another order on each platform, the same on each every run: the
  entity identifiers (`entities.json.gz`'s `entities`) and the player's attributes (`attributes.json.gz`). What they
  hold is the same.
- Up to 1.21.2 the redstone wire's colour at power 15 (`tints.json.gz`'s `redstone`) is `0xff3200` on Linux and
  `0xff3300` on Windows (1.21.0).
- In 1.16.210 two sound events have other names (`enums.json.gz`'s `sounds`): 114 is `flop` on Linux and
  `guardian.flop` on Windows, 328 `bucket.fill.powder_snow` on Linux and `power.on.sculk_sensor` on Windows.
- Linux 1.26.30 keeps no table of the note block instruments' sounds (it builds the names in code); Windows 1.26.30 has
  one. `instruments` is empty there.
- 1.21.50's `tints.json.gz` has no `constant` blocks from Linux (1.21.50.10, a later build than Windows' 1.21.50.07):
  its block types keep their colours otherwise than the agent reads them. Windows 1.21.50.07 has the birch and spruce
  leaves.

None else is corrected: each file says what its platform's server answers.

## Regenerating

Everything here is regenerated by bedrock-data-extractor (`pnpm extract`: each release it supports that this lacks;
`pnpm extract <build...> --force`: given releases, again), never edited by hand. A wrong value is fixed in the
extractor and the releases exported again.

A release is exported once the extractor supports it: its scheduled track finds the build, its support workflow
exports and tests it from each platform's zip, and a pull request there marks the platforms that passed `"supported"`
in its `versions/release/<build>.json`. Merging that runs its extract workflow, which commits here through a write
deploy key of this repo (it can push here and nowhere else).

bedrock-data-generator regenerates minecraft-data on its own schedule, half an hour after the extractor's track.