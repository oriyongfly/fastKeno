
# AI Development Protocol

This file defines how any AI assistant (Claude, GPT, Copilot, etc.) must respond
when helping on this project — a web app with a Telegram Mini App frontend.

Paste or reference this file at the start of a session, or point the AI to it
(e.g. "Follow AI_PROTOCOL.md for this request").

---

## Core Rule

**No code is written until explicitly approved.**
Every request goes through the structure below, in order, every time.
Do not skip a section. Do not include code — describe logic in plain language only.
The only exception is the `/code` command (see Commands section).

---

## Required Response Structure

### 1. Problem
- One clear paragraph stating what is broken, missing, or requested.
- If the request is ambiguous, state the assumption being made instead of guessing silently.

### 2. Next Steps
- Numbered, high-level steps needed to resolve the problem.
- No implementation detail yet — just the sequence of work.

### 3. Possible Fixes
- List 1–3 candidate approaches.
- For each: what it conceptually changes, why it would work, and any trade-off or risk.
- If one approach is clearly best, say so and why — otherwise present them neutrally.

### 4. Files to Touch
- Bullet list of existing files that will be modified.
- One line per file: what changes in it and why.

### 5. New Files Needed
- Path + purpose for any file that doesn't exist yet.
- If none are needed, write: `No new files needed.`

### 6. Script Logic (No Code)
For every script being **added**, **replaced**, or **removed**, describe:
- **File:** name/path
- **Action:** Add / Remove / Replace
- **Before:** what the logic currently does (skip if Add)
- **After:** what the logic will do, in plain language — inputs, outputs, conditions, order of operations
- **Edge cases:** what could break or needs handling (bad input, network failure, Telegram-specific quirks, etc.)

### 7. Stop
- End the response here.
- Explicitly write: `Waiting for approval to proceed.`
- Do not generate code unless the next message contains `/code` or `/approve`.

---

## Commands

Use these to control what phase the AI is in:

| Command | Meaning |
|---|---|
| `/plan` | Run the full 7-section structure above for a new request. |
| `/fix`  | Same as `/plan`, but scoped to a bug rather than a feature. |
| `/revise` | Redo sections 2–6 with new constraints, without repeating section 1. |
| `/approve` or `/code` | AI may now write the actual code for the approved plan — nothing more, nothing less than what was described in sections 4–6. |
| `/scope-check` | Before coding, AI re-lists exactly which files it is about to touch, for a final confirmation. |

If no command is given, default to `/plan`.

---

## Formatting Rules

- Use the numbered headers exactly as written above (`1. Problem`, `2. Next Steps`, etc.).
- No code blocks, no pseudo-code, no function names as if they exist — plain-language description only, until `/code`.
- Keep each section short and concrete; avoid restating the same point across sections.
- If critical information is missing (e.g. which Telegram Bot API version, which file owns a given state), ask **one** clarifying question instead of proceeding on a guess.
- Telegram Mini App context matters: if a fix touches `initData` validation, WebApp SDK calls, theming, or back-button/viewport behavior, call that out explicitly in section 6, since these have platform-specific edge cases.

---

## Example (abbreviated)

**User:** `/fix` — the Mini App shows a blank screen on Android Telegram but works on desktop.

**AI response:**

**1. Problem**
The WebView renders blank on Android Telegram clients only; desktop web works, implying a Telegram WebApp SDK initialization or viewport issue specific to mobile.

**2. Next Steps**
1. Confirm whether `Telegram.WebApp.ready()` is called before render.
2. Check viewport height handling.
3. Check for blocked resources.
4. Reproduce and inspect console logs from a real Android device.

**3. Possible Fixes**
- Fix A: Ensure `ready()`/`expand()` are called at the correct lifecycle point.
- Fix B: Replace hardcoded viewport height with Telegram's dynamic viewport variable.

**4. Files to Touch**
- `src/telegram/init.ts` — SDK bootstrap sequence
- `src/App.tsx` — where rendering is gated on SDK readiness

**5. New Files Needed**
No new files needed.

**6. Script Logic (No Code)**
- **File:** `src/telegram/init.ts`
- **Action:** Replace
- **Before:** Calls `ready()` after render, assumes fixed viewport.
- **After:** Calls `ready()` before first render; height reads from Telegram's live viewport value and updates on resize events.
- **Edge cases:** SDK not injected (non-Telegram browser), resize events firing before DOM mount.

**7. Stop**
Waiting for approval to proceed.
