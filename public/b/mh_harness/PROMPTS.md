# Booth playbook

Engine untouched. Nothing reads or prints secrets. My files: mh_harness/ and the agent edit in Step 2.

## Step 0 (say it to the staff, ~60 s)
- "Still fine if I drive the agent headless from my own folder? The engine stays untouched."
- "Are prod submissions limited? Does the board keep my best or my last? Is there a time cap per prod run?"
- "Can I start a prod run and come back? Can mh_harness/ stay here until this afternoon?"

## Step 1: Discovery (read-only)
Read-only for now. Do NOT modify the game engine, and do NOT open or print anything holding secret words or answers.
Report in under 25 lines:
1. Entrypoint: exactly how the UI starts an agent run (file, function or command, arguments), local and prod. Give a
   one-line shell command that starts one LOCAL run headless with a chosen MCP set.
2. Where results come out: words found, score, elapsed time.
3. LLM: provider, model, temperature, max output tokens, and where each is set.
4. Agent loop: max steps, timeouts, whether tool calls can run in parallel, how tool results enter the conversation.
5. Quote the agent's system prompt.
6. MCP servers: names, point costs, how a selection is passed in.
7. Shared state that would break parallel runs: fixed ports, fixed file paths, global sessions, one game server.

## Step 2: Wire it up
A. In agent_builder.py, add env-var settings whose defaults keep today's behaviour:
   AGENT_PROMPT=original|terse (terse = the prompt at the end of this file, with <N> and <FORMAT> filled in),
   MAX_TOOL_CHARS=0 (0 = no trim; else truncate each tool result to N chars before it enters the context),
   MAX_STEPS=<current default>, and MAX_OUTPUT_TOKENS / TEMPERATURE if the LLM client exposes them.
   Print one line per LLM call:  HARNESS_LLM {"in": <input tokens>, "out": <output tokens>, "ms": <latency>}
   (characters if token usage isn't available), and one per tool call:  HARNESS_TOOL {"name": ..., "args": {...}}
B. Fill in the two ADAPT functions in mh_harness/adapter.py from Step 1. Change no other harness file.
C. Run: python mh_harness/sweep.py mh_harness/configs/round1.json --dry-run   and show me the commands.

## Step 3: Round 1
Fill the <…> MCP sets in mh_harness/configs/round1.json (base = my current set; mcpB = <set B>), then run
  python mh_harness/sweep.py mh_harness/configs/round1.json --parallel 6
Watch the status lines. Tell me at once about any ALARM. If no run has a tool call by 60 s, say so.

## Step 4: Evaluate
Run python mh_harness/report.py, then answer briefly:
1. Did base and base_ctl agree within ~20 %? If NOISY, say the wall-time ranking is unreliable.
2. Which configs solved 2/2? Rank them by LLM calls, then output tokens. Is the leader's wall-time lead bigger than
   the base vs base_ctl gap?
3. Exit reason per run.
4. From the prod projection (21 cities, 4 words): which config is most likely to find all 4, and fastest?
5. Recommend one config for prod.

## Step 5: Prod
Make the recommended config's values the DEFAULTS in agent_builder.py, so a UI run uses them with no env vars set.
Show the diff, then run git status and git diff and confirm changes exist only in agent_builder.py and mh_harness/.
Then I submit to prod from the UI.

## Cutoff
No tool call from any run by minute 7 at the booth: stop building. Set AGENT_PROMPT=terse and MAX_TOOL_CHARS=2000 as
the defaults (Step 5 alone) and iterate in the UI.

## Terse system prompt
You are a detective agent. Goal: find all <N> secret words as fast as possible.
- No narration or explanations. Only tool calls until your final answer.
- First get the full list of cities. Don't revisit a city unless a clue points back to it.
  Call several tools in one turn when you can.
- Keep a one-line ledger: visited | clues | words found.
- From long tool output, keep only clues and ignore the rest.
- The moment you have all <N> words, stop and answer in this format: <FORMAT>.
