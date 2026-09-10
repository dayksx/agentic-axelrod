import { readFileSync } from "node:fs";
import { cert } from "firebase-admin/app";

const KEY = process.argv[2];
const RULES = process.argv[3];
const PROJECT = "agentic-axelrod";
const rulesSource = readFileSync(RULES, "utf8");
const sa = JSON.parse(readFileSync(KEY, "utf8"));

const credential = cert(sa);
const { access_token } = await credential.getAccessToken();

async function call(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${text}`);
  return text ? JSON.parse(text) : {};
}

const rs = await call(
  `https://firebaserules.googleapis.com/v1/projects/${PROJECT}/rulesets`,
  "POST",
  { source: { files: [{ name: "firestore.rules", content: rulesSource }] } },
);
console.log("ruleset:", rs.name);

const releaseName = `projects/${PROJECT}/releases/cloud.firestore`;
try {
  await call(`https://firebaserules.googleapis.com/v1/${releaseName}`, "PATCH",
    { name: releaseName, rulesetName: rs.name });
  console.log("release updated ->", rs.name);
} catch (e) {
  await call(`https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases`, "POST",
    { name: releaseName, rulesetName: rs.name });
  console.log("release created ->", rs.name);
}
console.log("RULES PUBLISHED");
