// Load a block-state-shapes.nbt file and turn it back into typed JS objects.
// Run with Node's native type stripping (Node >= 24):
//   node examples/load-block-state-shapes.ts data/1.20.14.01/block-state-shapes.nbt

import nbt from "prismarine-nbt";
import { readFileSync } from "node:fs";

main();

async function main(){
  const path = process.argv[2] ?? "data/1.20.14.01/block-state-shapes.nbt";
  const shapes: Shape[] = [];
  for await (const shape of loadShapes(path)) {
    shapes.push(shape);
  }
  console.log(`Loaded ${shapes.length} shapes from ${path}`);

  const first: Shape = shapes[0];
  console.log("first:", JSON.stringify(first, null, 2));
  console.log("first uiShape box:", first.uiShape);
}

export async function* loadShapes(path: string): AsyncGenerator<Shape> {
  const { parsed } = await nbt.parse(readFileSync(path), "little");
  const root = nbt.simplify(parsed) as { shapes: any[] };
  for (const s of root.shapes) {
    const shape: Shape = {
      blockStateId: s.blockStateId,
      collisionShape: s.collisionShape,
      uiShape: s.uiShape,
      visualShape: s.visualShape,
    };
    if (s.blockStateHash !== undefined)
      shape.blockStateHash = longToNumber(s.blockStateHash);
    yield shape;
  }
}

function longToNumber([high, low]: [number, number]) {
  return high * 2 ** 32 + (low >>> 0);
}

export type Shape = {
  blockStateHash?: number; // optional
  blockStateId: number;
  collisionShape: number[][];
  uiShape: number[];
  visualShape: number[];
};