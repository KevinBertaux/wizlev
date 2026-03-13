# AGENTS.md

## Shell Policy

On Windows, for this repository, prefer **Git Bash explicitly** for shell commands instead of the default PowerShell shell.

Use this form when possible:

```text
"C:\\Program Files\\Git\\bin\\bash.exe" -lc "<command>"
```

Examples:

```text
"C:\\Program Files\\Git\\bin\\bash.exe" -lc "git status -sb"
"C:\\Program Files\\Git\\bin\\bash.exe" -lc "npm test"
"C:\\Program Files\\Git\\bin\\bash.exe" -lc "rg -n \"build-info\" src"
```

## PowerShell Exceptions

Use PowerShell only when the task is specifically Windows-native or requires PowerShell semantics, for example:

- `Invoke-WebRequest`
- Windows-specific filesystem or permission diagnostics
- registry, services, scheduled tasks
- commands that depend on PowerShell object pipelines

## Goal

This policy exists because the default PowerShell environment in this workspace may run in `ConstrainedLanguage`, which adds noise and can break or slow down normal repository work.

Prefer Git Bash for:

- `git`
- `npm`
- `node`
- `rg`
- file inspection
- build/test commands

