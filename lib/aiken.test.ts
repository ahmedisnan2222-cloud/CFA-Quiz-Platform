import { describe, it, expect } from "vitest";
import { parseAiken, AikenParseError } from "./aiken";

const VALID = `What is the capital of France?
A) London
B) Berlin
C) Paris
D) Madrid
ANSWER: C

What is 2 + 2?
A) 3
B) 4
C) 5
ANSWER: B
`;

describe("parseAiken", () => {
  it("parses valid Aiken text into questions", () => {
    const questions = parseAiken(VALID);
    expect(questions).toHaveLength(2);
    expect(questions[0]).toEqual({
      text: "What is the capital of France?",
      options: [
        { label: "A", text: "London" },
        { label: "B", text: "Berlin" },
        { label: "C", text: "Paris" },
        { label: "D", text: "Madrid" },
      ],
      correctLabel: "C",
    });
    expect(questions[1].correctLabel).toBe("B");
  });

  it("tolerates extra blank lines and trailing whitespace", () => {
    const padded = `\n\n${VALID}\n\n\n`;
    expect(parseAiken(padded)).toHaveLength(2);
  });

  it("throws when ANSWER line is missing", () => {
    const bad = `Question with no answer?
A) One
B) Two
`;
    expect(() => parseAiken(bad)).toThrow(AikenParseError);
    expect(() => parseAiken(bad)).toThrow(/Missing "ANSWER/);
  });

  it("throws when ANSWER references an unknown option", () => {
    const bad = `Question?
A) One
B) Two
ANSWER: Z
`;
    expect(() => parseAiken(bad)).toThrow(/does not match any option/);
  });

  it("throws when there are fewer than 2 options", () => {
    const bad = `Question?
A) Only one option
ANSWER: A
`;
    expect(() => parseAiken(bad)).toThrow(/at least 2 options/);
  });

  it("throws on duplicate option labels", () => {
    const bad = `Question?
A) One
A) Two
ANSWER: A
`;
    expect(() => parseAiken(bad)).toThrow(/Duplicate option label/);
  });

  it("throws on empty input", () => {
    expect(() => parseAiken("   \n\n  ")).toThrow(/No questions found/);
  });
});
