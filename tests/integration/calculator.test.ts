import { describe, expect, it } from "vitest";
import { evaluateExpression } from "@/server/ai/calculator";

describe("calculator", () => {
  it("does the four operations and parentheses", () => {
    expect(evaluateExpression("2 + 3")).toBe(5);
    expect(evaluateExpression("10 - 4")).toBe(6);
    expect(evaluateExpression("6 * 7")).toBe(42);
    expect(evaluateExpression("20 / 4")).toBe(5);
    expect(evaluateExpression("(2 + 3) * 4")).toBe(20);
  });

  it("handles percentages as divide-by-100", () => {
    expect(evaluateExpression("15%")).toBeCloseTo(0.15);
    expect(evaluateExpression("200 * 15%")).toBeCloseTo(30);
  });

  it("rejects division by zero", () => {
    expect(() => evaluateExpression("1 / 0")).toThrow();
  });

  it("rejects arbitrary JavaScript", () => {
    expect(() => evaluateExpression("process.exit(1)")).toThrow();
    expect(() => evaluateExpression("require('fs')")).toThrow();
    expect(() => evaluateExpression("1; while(true){}")).toThrow();
    expect(() => evaluateExpression("[].constructor")).toThrow();
    expect(() => evaluateExpression("2 ** 8")).toThrow();
    expect(() => evaluateExpression("alert(1)")).toThrow();
  });

  it("rejects empty and overlong input", () => {
    expect(() => evaluateExpression("")).toThrow();
    expect(() => evaluateExpression("1+".repeat(200))).toThrow();
  });
});
