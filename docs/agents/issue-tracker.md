# Issue Tracker — Local Markdown

Issues for this project are tracked as local markdown files.

## Location

Issues live under `.scratch/` in the repo root. Each feature or bug gets its own directory:

```
.scratch/
  feature-name/
    issue.md
```

## Workflow

When skills like `to-issues`, `triage`, or `to-prd` need to create or manage issues, they write markdown files directly into `.scratch/` rather than calling an external issue tracker CLI.

## File format

Each issue file should include:
- A title
- Description / acceptance criteria
- Status (one of the triage label values)
- Any relevant context or discussion

## When to use

This setup is ideal for:
- Solo projects
- Projects without a remote issue tracker
- Repos where you want issues version-controlled alongside code
