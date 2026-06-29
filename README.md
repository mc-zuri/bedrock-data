# bedrock-data

Per-version Minecraft **Bedrock** data published as compact NBT. Each
`data/<version>/` folder holds two gzip-compressed NBT files:

- **`block_palette.nbt`** — the block palette: one entry per block state with its
  `name`, `states`, and `version`. Big-endian NBT.
- **`block-state-shapes.nbt`** — the collision / UI / visual bounding boxes for every
  block state. Little-endian (Bedrock) NBT.

Both list one entry per block state in the same order, so `block-state-shapes`'s
`blockStateId` is the index into `block_palette`'s `blocks`.


## Layout

```
data/<version>/block_palette.nbt         # gzipped, big-endian NBT
data/<version>/block-state-shapes.nbt    # gzipped, Bedrock little-endian NBT
examples/load-block-state-shapes.ts      # NBT -> typed Shape[] loader
```

## Read an NBT file

`nbt.parse()` auto-detects the gzip compression and byte order, so no manual
decompression is needed. See **[`examples/load-block-state-shapes.ts`](examples/load-block-state-shapes.ts)**
for a runnable loader that streams a file into a strongly typed `Shape[]`:

```sh
node examples/load-block-state-shapes.ts data/1.20.14.01/block-state-shapes.nbt
```