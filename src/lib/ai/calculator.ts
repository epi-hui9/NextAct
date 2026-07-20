import { tool } from "ai";
import { z } from "zod";

/**
 * A safe arithmetic evaluator. It parses a small grammar by hand (recursive
 * descent) and never touches `eval`/`Function`, so arbitrary JavaScript cannot
 * run. Supports + - * / , parentheses, and a postfix `%` meaning "divide by
 * 100" (so `15%` = 0.15 and `200 * 15%` = 30).
 */

class CalcError extends Error {}

type Token =
  | { t: "num"; v: number }
  | { t: "op"; v: "+" | "-" | "*" | "/" | "%" }
  | { t: "lp" }
  | { t: "rp" };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i += 1;
      continue;
    }
    if (ch >= "0" && ch <= "9") {
      let num = "";
      let seenDot = false;
      while (i < input.length) {
        const c = input[i];
        if (c >= "0" && c <= "9") num += c;
        else if (c === "." && !seenDot) {
          seenDot = true;
          num += c;
        } else break;
        i += 1;
      }
      tokens.push({ t: "num", v: Number(num) });
      continue;
    }
    if (ch === ".") {
      // Leading-dot number like ".5"
      let num = "0.";
      i += 1;
      while (i < input.length && input[i] >= "0" && input[i] <= "9") {
        num += input[i];
        i += 1;
      }
      tokens.push({ t: "num", v: Number(num) });
      continue;
    }
    if (ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "%") {
      tokens.push({ t: "op", v: ch });
      i += 1;
      continue;
    }
    if (ch === "(") {
      tokens.push({ t: "lp" });
      i += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({ t: "rp" });
      i += 1;
      continue;
    }
    throw new CalcError(`Unexpected character: ${ch}`);
  }
  return tokens;
}

/** Recursive-descent parser + evaluator. */
function parse(tokens: Token[]): number {
  let pos = 0;
  const peek = () => tokens[pos];
  const eat = () => tokens[pos++];

  function parseExpr(): number {
    let value = parseTerm();
    while (peek()?.t === "op" && (peek() as { v: string }).v.match(/[+-]/)) {
      const op = (eat() as { v: string }).v;
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    while (peek()?.t === "op" && (peek() as { v: string }).v.match(/[*/]/)) {
      const op = (eat() as { v: string }).v;
      const rhs = parseFactor();
      if (op === "/") {
        if (rhs === 0) throw new CalcError("Division by zero");
        value = value / rhs;
      } else {
        value = value * rhs;
      }
    }
    return value;
  }

  function parseFactor(): number {
    let value = parseUnary();
    // Postfix percent: value% => value / 100
    while (peek()?.t === "op" && (peek() as { v: string }).v === "%") {
      eat();
      value = value / 100;
    }
    return value;
  }

  function parseUnary(): number {
    const tk = peek();
    if (tk?.t === "op" && (tk.v === "+" || tk.v === "-")) {
      eat();
      const v = parseUnary();
      return tk.v === "-" ? -v : v;
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    const tk = eat();
    if (!tk) throw new CalcError("Unexpected end of expression");
    if (tk.t === "num") return tk.v;
    if (tk.t === "lp") {
      const v = parseExpr();
      const close = eat();
      if (!close || close.t !== "rp") throw new CalcError("Missing )");
      return v;
    }
    throw new CalcError("Unexpected token");
  }

  const result = parseExpr();
  if (pos !== tokens.length) throw new CalcError("Unexpected trailing input");
  return result;
}

/** Evaluate a validated arithmetic expression. Throws on anything unsafe. */
export function evaluateExpression(expr: string): number {
  if (typeof expr !== "string" || expr.trim() === "") {
    throw new CalcError("Empty expression");
  }
  if (expr.length > 200) throw new CalcError("Expression too long");
  const result = parse(tokenize(expr));
  if (!Number.isFinite(result)) throw new CalcError("Result is not finite");
  return result;
}

/** AI SDK tool wrapper. The client never sees this JSON. */
export const calculatorTool = tool({
  description:
    "Evaluate a basic arithmetic expression (addition, subtraction, " +
    "multiplication, division, percentages, and parentheses). Use only for " +
    "arithmetic; it cannot run code.",
  inputSchema: z.object({
    expression: z
      .string()
      .describe("An arithmetic expression, e.g. '(120 + 30) * 15%'."),
  }),
  execute: async ({ expression }: { expression: string }) => {
    try {
      return { ok: true as const, result: evaluateExpression(expression) };
    } catch {
      return { ok: false as const, error: "invalid_expression" };
    }
  },
});
