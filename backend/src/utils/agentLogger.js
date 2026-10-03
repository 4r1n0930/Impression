const TAGS = {
  PIPELINE: "PIPELINE",
  QUESTION: "QUESTION",
  EVALUATION: "EVALUATION",
  NEXTQ: "NEXTQ",
  FEEDBACK: "FEEDBACK",
};

// Categories the prompt may return. Anything not listed here is treated as
// unknown, which fails closed (see QuestionAgent).
const NON_EVALUABLE_CATEGORIES = ["logistics", "smalltalk", "candidate_question"];

function useColor() {
  if (process.env.AGENT_LOG_NO_COLOR === "1") return false;
  return Boolean(process.stdout.isTTY);
}

const COLORS = {
  PIPELINE: "90",
  QUESTION: "36",
  EVALUATION: "32",
  NEXTQ: "35",
  FEEDBACK: "33",
};

const TAG_WIDTH = 10;
const ROOM_WIDTH = 12;
const INDENT = " ".repeat(TAG_WIDTH + ROOM_WIDTH + 4);

function isVerbose() {
  return process.env.AGENT_LOG_VERBOSE === "1";
}

/**
 * Prints one aligned, greppable line per agent call.
 *
 *   [QUESTION  ][room1     ] technical · EVALUABLE · "Explain closures" (1180ms)
 *
 * `detail` is only printed when AGENT_LOG_VERBOSE=1, so normal runs stay readable.
 */
export function agentLog(agent, roomName, summary, detail) {
  const tag = (TAGS[agent] || TAGS.PIPELINE).padEnd(TAG_WIDTH);
  const room = (roomName || "-").slice(0, ROOM_WIDTH).padEnd(ROOM_WIDTH);

  const prefix = useColor()
    ? `\x1b[${COLORS[agent] || COLORS.PIPELINE}m[${tag}][${room}]\x1b[0m`
    : `[${tag}][${room}]`;

  console.log(`${prefix} ${summary}`);

  if (isVerbose() && detail !== undefined) {
    const body = JSON.stringify(detail, null, 2);
    console.log(
      `${INDENT}${body.split("\n").join(`\n${INDENT}`)}`
    );
  }
}

export function agentError(agent, roomName, message, error) {
  const tag = (TAGS[agent] || TAGS.PIPELINE).padEnd(TAG_WIDTH);
  const room = (roomName || "-").slice(0, ROOM_WIDTH).padEnd(ROOM_WIDTH);
  console.error(`[${tag}][${room}] ${message}`, error ?? "");
}

export function elapsedMs(startedAt) {
  return `${Date.now() - startedAt}ms`;
}

export { TAGS, NON_EVALUABLE_CATEGORIES };