# Useful prompts & curls — AI HTTP agents

Assumes **`pnpm run start:six`** (ports **3100–3105**). For a single agent, use **`pnpm start`** and replace the port (default **3100**).

After **`load`**, the JSON response echoes **`name`**, **`domain`**, and **`strategy`**. You can also **`GET /player`** anytime to read the current identity.

---

## Load all six at once (bash)

1. Start the fleet in another terminal: **`cd ai && pnpm run start:six`**
2. Open a new terminal and **paste the whole block below** (then press Enter).  
   - Uses **`curl`** only (no `jq` required).  
   - Override host if needed: **`AGENT_HOST=192.168.1.10 bash`** before pasting, or export first.

```bash
AGENT_HOST="${AGENT_HOST:-127.0.0.1}"

curl -fsS -X POST "http://${AGENT_HOST}:3100/message/send" -H "Content-Type: application/json" \
  -d '{"phase":"load","name":"alice.eth","domain":"https://alice.local","strategy":"Tit-for-tat: cooperate first, then mirror the opponent last move."}' && echo " OK 3100 alice.eth"

curl -fsS -X POST "http://${AGENT_HOST}:3101/message/send" -H "Content-Type: application/json" \
  -d '{"phase":"load","name":"bob.eth","domain":"https://bob.local","strategy":"Grim trigger: cooperate until betrayed, then always defect."}' && echo " OK 3101 bob.eth"

curl -fsS -X POST "http://${AGENT_HOST}:3102/message/send" -H "Content-Type: application/json" \
  -d '{"phase":"load","name":"chen.eth","domain":"https://chen.local","strategy":"Always cooperate unless clearly exploited; then punish one round."}' && echo " OK 3102 chen.eth"

curl -fsS -X POST "http://${AGENT_HOST}:3103/message/send" -H "Content-Type: application/json" \
  -d '{"phase":"load","name":"dana.eth","domain":"https://dana.local","strategy":"Random kindness: mostly cooperate, occasional surprise defect."}' && echo " OK 3103 dana.eth"

curl -fsS -X POST "http://${AGENT_HOST}:3104/message/send" -H "Content-Type: application/json" \
  -d '{"phase":"load","name":"eli.eth","domain":"https://eli.local","strategy":"Win-stay lose-shift: repeat last move if score was high, else switch."}' && echo " OK 3104 eli.eth"

curl -fsS -X POST "http://${AGENT_HOST}:3105/message/send" -H "Content-Type: application/json" \
  -d '{"phase":"load","name":"faye.eth","domain":"https://faye.local","strategy":"Negotiate in chat; in decision defect only if they clearly threatened."}' && echo " OK 3105 faye.eth"

echo "Done. Optional: run the verify loop in the section below."
```

**Save as a script (optional):**

```bash
cd ai   # or repo root; path can be anywhere
nano load-six.sh   # paste the block above (from AGENT_HOST= through the last echo)
chmod +x load-six.sh
./load-six.sh
```

If a line fails, `curl` exits non-zero; add **`set -e`** at the top of the script if you want the script to stop on the first error.

---

## Inspect current identity

```bash
curl -sS "http://127.0.0.1:3100/player" | jq .
```

Repeat with ports **3101** … **3105** for each slot.

---

## `phase: "load"` — six players (names + strategies)

`domain` must be a non-empty string (opaque identity URL; placeholder is fine).

### Port 3100 → alice.eth

```bash
curl -sS -X POST "http://127.0.0.1:3100/message/send" \
  -H "Content-Type: application/json" \
  -d '{"phase":"load","name":"alice.eth","domain":"https://alice.local","strategy":"Tit-for-tat: cooperate first, then mirror the opponent last move."}'
```

### Port 3101 → bob.eth

```bash
curl -sS -X POST "http://127.0.0.1:3101/message/send" \
  -H "Content-Type: application/json" \
  -d '{"phase":"load","name":"bob.eth","domain":"https://bob.local","strategy":"Grim trigger: cooperate until betrayed, then always defect."}'
```

### Port 3102 → chen.eth

```bash
curl -sS -X POST "http://127.0.0.1:3102/message/send" \
  -H "Content-Type: application/json" \
  -d '{"phase":"load","name":"chen.eth","domain":"https://chen.local","strategy":"Always cooperate unless clearly exploited; then punish one round."}'
```

### Port 3103 → dana.eth

```bash
curl -sS -X POST "http://127.0.0.1:3103/message/send" \
  -H "Content-Type: application/json" \
  -d '{"phase":"load","name":"dana.eth","domain":"https://dana.local","strategy":"Random kindness: mostly cooperate, occasional surprise defect."}'
```

### Port 3104 → eli.eth

```bash
curl -sS -X POST "http://127.0.0.1:3104/message/send" \
  -H "Content-Type: application/json" \
  -d '{"phase":"load","name":"eli.eth","domain":"https://eli.local","strategy":"Win-stay lose-shift: repeat last move if score was high, else switch."}'
```

### Port 3105 → faye.eth

```bash
curl -sS -X POST "http://127.0.0.1:3105/message/send" \
  -H "Content-Type: application/json" \
  -d '{"phase":"load","name":"faye.eth","domain":"https://faye.local","strategy":"Negotiate in chat; in decision defect only if they clearly threatened."}'
```

---

## Alias

`"phase":"configure"` is accepted and normalized to **`load`** (same body).

---

## Verify all six after load

```bash
for p in 3100 3101 3102 3103 3104 3105; do
  echo "--- :$p ---"
  curl -sS "http://127.0.0.1:${p}/player" | jq .
done
```
