# Domain Docs — Consumer Rules

This file tells engineering skills how to find and read domain documentation for this project.

## Layout

Single-context layout: one `CONTEXT.md` + `docs/adr/` at the repo root.

## What skills read

- **`CONTEXT.md`** — Project domain language, architecture overview, and conventions. Skills like `improve-codebase-architecture`, `diagnose`, and `tdd` read this to understand the project.
- **`docs/adr/`** — Architectural Decision Records. Past decisions that inform current work.

## When to read them

Skills should read `CONTEXT.md` before implementing changes or refactoring. They should check `docs/adr/` when making or evaluating architectural decisions.

## Creating context docs

When starting fresh, create `CONTEXT.md` at the repo root describing:
- Project purpose and scope
- Key domain concepts and terminology
- Architecture overview
- Coding conventions
- Important file locations
