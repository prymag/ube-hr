---
name: close-prd
description: Reconcile and close a PRD issue after all sub-issues are complete. Fetches the PRD issue, verifies sub-issues are closed, spot-checks the implementation against the original PRD intent, posts a reconciliation comment, and closes the issue. Use when user says "close prd #N", "reconcile prd #N", or "wrap up issue #N".
---

# Skill: close-prd

Given a PRD GitHub issue number, verify all work is complete, reconcile the implementation against the original intent, and close the issue.

## Process

### 1. Fetch the PRD issue

```bash
gh issue view <number> --comments
```

Read the full issue body and all comments. Extract:
- **User Stories** — the numbered list of stories the feature was meant to deliver
- **Implementation Decisions** — the modules, API contracts, schema changes, and architectural decisions
- **Testing Decisions** — what was expected to be tested
- **Out of Scope** — what was explicitly excluded (do not flag these as gaps)
- **Sub-issue references** — scan the body and all comments for `#N` issue links created by the `to-issues` skill

### 2. Discover and verify sub-issues

For each `#N` reference found in step 1:

```bash
gh issue view <N>
```

Collect the state (`open` / `closed`) and title of each sub-issue.

**If any sub-issues are still open:**
- List them clearly for the user with their titles and URLs
- Ask: "The following sub-issues are still open. Do you want to proceed with closing the PRD anyway?"
- Wait for explicit confirmation before continuing
- If the user says no, stop here and remind them to finish those issues first

### 3. Spot-check the implementation

Explore only what is relevant to the PRD's **Implementation Decisions** section. Do NOT do a full repo scan.

For each module or layer mentioned in Implementation Decisions:
- Use Glob and Grep to locate the relevant files
- Read the key sections to confirm the feature exists and broadly matches intent
- Note any obvious deviations, missing pieces, or things that were implemented differently than planned

You are not doing a code review — you are confirming the feature landed. Keep this step focused.

### 4. Reconcile against user stories

Go through each numbered user story from the PRD and assess:

- ✅ **Met** — the story is clearly satisfied by the implementation
- ⚠️ **Partially met** — the story is addressed but with caveats or deviations
- ❌ **Not met** — no implementation found for this story (and it was not in Out of Scope)

For each ⚠️ or ❌ story, note what is missing or different and whether it warrants a follow-up issue.

### 5. Post a reconciliation comment

Post a comment on the PRD issue summarising the outcome:

```bash
gh issue comment <number> --body "..."
```

Use this comment template:

```
## Reconciliation Summary

All sub-issues have been completed and the implementation has been reviewed against the original PRD.

### Sub-issues

| Issue | Title | Status |
|-------|-------|--------|
| #N    | ...   | ✅ Closed |

### User Story Coverage

| # | Story | Status | Notes |
|---|-------|--------|-------|
| 1 | As a ... | ✅ Met | |
| 2 | As a ... | ⚠️ Partial | <reason> |

### Deviations from Original Plan

<List any implementation decisions that changed during execution, and why. If none, write "None — implementation matched the plan.">

### Follow-up Issues

<List any gaps that warrant new issues. If none, write "None.">

### Verification

Sub-issues closed: N/N
User stories met: N/N (N partial, N not met)
```

### 6. Close the PRD issue

```bash
gh issue close <number> --comment "Closing — all sub-issues complete and reconciliation posted above."
```

Do NOT close the issue before posting the reconciliation comment in step 5.
