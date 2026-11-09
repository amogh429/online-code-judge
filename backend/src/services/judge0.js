const languageIds = {
  javascript: 63, // JavaScript (Node.js)
  python: 71, // Python 3
  cpp: 54, // C++ (GCC)
};

export async function executeCode({ sourceCode, language, stdin = "" }) {
  const language_id = languageIds[language];
  if (!language_id) throw new Error(`Unsupported language: ${language}`);
  const base = (process.env.JUDGE0_BASE_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("JUDGE0_BASE_URL is not configured");

  const headers = { "Content-Type": "application/json" };
  if (process.env.JUDGE0_API_KEY)
    headers["X-RapidAPI-Key"] = process.env.JUDGE0_API_KEY;
  if (process.env.JUDGE0_API_HOST)
    headers["X-RapidAPI-Host"] = process.env.JUDGE0_API_HOST;

  const response = await fetch(
    `${base}/submissions?base64_encoded=false&wait=true`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ source_code: sourceCode, language_id, stdin }),
    },
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.message || `Execution provider returned HTTP ${response.status}`,
    );
  }
  return {
    stdout: data.stdout ?? "",
    stderr: data.stderr ?? "",
    compileOutput: data.compile_output ?? "",
    status: data.status?.description || "Unknown",
    time: data.time ?? null,
    memory: data.memory ?? null,
  };
}

export function normalizeOutput(value = "") {
  return String(value).replace(/\r\n/g, "\n").trim();
}
