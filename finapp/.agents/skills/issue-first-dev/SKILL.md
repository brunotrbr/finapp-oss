---
name: issue-first-dev
description: Creates a GitHub issue before writing any code or starting task implementation.
---

# Pre-Development Issue Protocol

## Constraints
- Do NOT modify codebase files or generate code solutions until a GitHub issue exists.
- Ask user for target repository (`owner/repo`) if ambiguous.

## Execution Sequence
1. Analyze user task request.
2. Formulate clear issue title and detailed body (including requirements and acceptance criteria).
3. Call `github.create_issue` tool with repository, title, and body.
4. Output created issue URL and issue number.
5. Proceed to task implementation.