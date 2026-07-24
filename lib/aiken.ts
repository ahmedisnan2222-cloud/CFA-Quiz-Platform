const OPTION_LINE = /^([A-Za-z])[).]\s*(.+)$/;
const ANSWER_LINE = /^ANSWER\s*:\s*([A-Za-z])\s*$/i;

export type ParsedOption = { label: string; text: string };
export type ParsedQuestion = {
  text: string;
  options: ParsedOption[];
  correctLabel: string;
};

export class AikenParseError extends Error {
  constructor(message: string, public line: number) {
    super(`Line ${line}: ${message}`);
    this.name = "AikenParseError";
  }
}

/**
 * Parses standard Aiken-format quiz text into structured questions.
 * Format per question block (separated by one or more blank lines):
 *   Question text (may span multiple lines)
 *   A) option text
 *   B) option text
 *   ...
 *   ANSWER: B
 */
export function parseAiken(text: string): ParsedQuestion[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  const blocks: { lines: string[]; startLine: number }[] = [];
  let current: string[] = [];
  let currentStart = 1;

  const pushBlock = () => {
    if (current.some((l) => l.trim() !== "")) {
      blocks.push({ lines: current, startLine: currentStart });
    }
    current = [];
  };

  lines.forEach((line, idx) => {
    if (line.trim() === "") {
      pushBlock();
      currentStart = idx + 2;
    } else {
      if (current.length === 0) currentStart = idx + 1;
      current.push(line);
    }
  });
  pushBlock();

  if (blocks.length === 0) {
    throw new AikenParseError("No questions found in the provided text", 1);
  }

  return blocks.map((block) => parseBlock(block.lines, block.startLine));
}

function parseBlock(blockLines: string[], startLine: number): ParsedQuestion {
  const questionLines: string[] = [];
  const options: ParsedOption[] = [];
  let answerLabel: string | null = null;

  for (let i = 0; i < blockLines.length; i++) {
    const raw = blockLines[i];
    const line = raw.trim();
    const lineNumber = startLine + i;

    const answerMatch = line.match(ANSWER_LINE);
    if (answerMatch) {
      answerLabel = answerMatch[1].toUpperCase();
      continue;
    }

    const optionMatch = line.match(OPTION_LINE);
    if (optionMatch) {
      options.push({
        label: optionMatch[1].toUpperCase(),
        text: optionMatch[2].trim(),
      });
      continue;
    }

    if (options.length > 0) {
      throw new AikenParseError(
        `Expected an option (e.g. "A) ...") or "ANSWER: X" line, got: "${raw}"`,
        lineNumber
      );
    }

    questionLines.push(raw.trim());
  }

  const questionText = questionLines.join(" ").trim();
  if (!questionText) {
    throw new AikenParseError("Question text is missing", startLine);
  }

  if (options.length < 2) {
    throw new AikenParseError(
      `Question needs at least 2 options, found ${options.length}`,
      startLine
    );
  }

  const labels = options.map((o) => o.label);
  const duplicate = labels.find((l, i) => labels.indexOf(l) !== i);
  if (duplicate) {
    throw new AikenParseError(
      `Duplicate option label "${duplicate}"`,
      startLine
    );
  }

  if (!answerLabel) {
    throw new AikenParseError(
      'Missing "ANSWER: X" line for this question',
      startLine
    );
  }

  if (!labels.includes(answerLabel)) {
    throw new AikenParseError(
      `ANSWER "${answerLabel}" does not match any option (${labels.join(", ")})`,
      startLine
    );
  }

  return { text: questionText, options, correctLabel: answerLabel };
}
