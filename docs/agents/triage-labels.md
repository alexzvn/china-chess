# Triage Labels

This project uses the following five canonical triage roles. Each skill that processes issues expects these exact strings.

| Role | Label string | Meaning |
|------|-------------|---------|
| Needs evaluation | `needs-triage` | Maintainer needs to evaluate the issue |
| Waiting on reporter | `needs-info` | Waiting on information from the reporter |
| Ready for AFK agent | `ready-for-agent` | Fully specified, ready for an agent to pick up |
| Needs human implementation | `ready-for-human` | Needs a human to implement |
| Won't be actioned | `wontfix` | Will not be actioned |

## Usage

When the `triage` skill processes an incoming issue, it applies the appropriate label to move it through the state machine. Since this project uses local markdown for issues, these strings are used as state markers in the issue files.
