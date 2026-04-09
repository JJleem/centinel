@AGENTS.md

# AI Pipeline (app/api/analyze/route.ts)
All Claude API logic lives in a single file. Read only this file for prompt changes.

## Token rules (enforced decisions — do not revert)
- Never use JSON.stringify(arr, null, 2) in prompt construction — plain or field-extract only
- Agent 3A/3B system prompts share identical blocks — extract to const before adding more