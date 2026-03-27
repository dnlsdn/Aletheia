Update the file `.agent/skills/SKILL.md` in the project root.
If the file does not exist, create it.

Do NOT rewrite the whole file. ONLY append a new section at the bottom
with what was just built in this task. Use this exact format:

---

## [Short title of what was just built]

**File(s):** list the files created or modified
**What it does:** 1-2 sentences max
**Key decisions:**

- any non-obvious implementation choice made
- any gotcha or constraint to keep in mind for future tasks
**Exposes:** (only if relevant) endpoint URL, function signature, or exported module name

---

Keep each entry concise. Future agents will read this file before starting new tasks,
so prioritize information that prevents mistakes or duplicated work.
Do not add boilerplate, theory, or things already obvious from reading the code.