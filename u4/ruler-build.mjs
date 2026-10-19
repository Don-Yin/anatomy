import { writeFileSync } from "node:fs";
import * as k from "../kit/iso-kit.mjs";

const flag = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at < 0 ? fallback : process.argv[at + 1];
};
const width = Number(flag("width", 600));
const height = Number(flag("height", 380));
const azimuth = Number(flag("azimuth", 45));
const major = Number(flag("major", 3.6));
const axis = flag("axis", "x");
const out = flag("out", "ruler.html");
const stamp = process.argv.includes("--stamp");

const PLATE = { x: -128, y: -64, w: 262, d: 128, r: 8 };
const STRIP = { x: -110, y: 49, w: 230, d: 7, r: 1 };

const P = k.fitProjection(k.boxCorners(PLATE, -17, 0), width, height, { pad: 30, azimuth });
const strip = k.slabOf(STRIP, 0, 0.6, P, 3);
const ticks = axis === "x"
  ? k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 4, 5, STRIP.y + 0.8, 0.6, [2, major], P)
  : k.topTicks(PLATE.y + 8, PLATE.y + PLATE.d - 8, 4, 5, STRIP.x + 4, 0.6, [2, major], P, "y");

const figure = k.figureSvg({
  width,
  height,
  label: "tick ruler",
  body: [
    k.solidSvg(k.slabOf(PLATE, -12, 12, P, 8, 1.6), { tone: "mid" }),
    k.solidSvg(strip, { tone: "lo", crease: "none" }),
    k.lineSvg(ticks.minor, { tone: "lo" }),
    k.lineSvg(ticks.major, { tone: "mid" }),
  ],
});
const unit = (world) => Math.hypot(...k.axisVector(P, axis === "x" ? [0, world, 0] : [world, 0, 0]));
console.log(`${out}: viewBox ${width}x${height} azimuth ${azimuth} k=${P.scale.toFixed(3)} major ${major} world -> ${unit(major).toFixed(2)} viewBox px (minor 2 -> ${unit(2).toFixed(2)})`);
const body = stamp ? figure.replace("<svg ", `<svg data-scale="${P.scale}" `) : figure;
writeFileSync(out, k.pageHtml({ title: "tick ruler", body: k.plateHtml({ fig: "Fig 1", title: "tick", hint: "", caption: "repro", body }), width: 900 }));
