# AGENTS.md

Instructions for coding agents working in this repository.

This is a Java practice repo: standalone exercise files at the root plus `Studenti/`.
There is no build tool, no package manager, and no test suite; compile with `javac` and
run with `java` as needed.

## Agent skills

The engineering skills from [mattpocock/skills](https://github.com/mattpocock/skills) are
installed under `.claude/skills/` and pinned in `skills-lock.json`. They read their per-repo
configuration from `docs/agents/`.

### Issue tracker

Issues, specs, and Wayfinder maps live as markdown files under `.scratch/` in this repo, not on
GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name: `needs-triage`, `needs-info`,
`ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` at the repo root plus `docs/adr/`, both created lazily by
`/domain-modeling` rather than upfront. See `docs/agents/domain.md`.
