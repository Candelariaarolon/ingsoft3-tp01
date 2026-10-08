import { describe, expect, it } from "vitest";
import { formatARS } from "./format";

describe("formatARS", () => {
  it.each([
    [1500, "$1.500"],
    [1500000, "$1.500.000"],
    [999.6, "$1.000"],
    [0, "$0"],
  ])("muestra %s como %s, con punto de miles y sin decimales", (precio, esperado) => {
    expect(formatARS(precio)).toBe(esperado);
  });
});
