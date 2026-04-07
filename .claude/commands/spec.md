# Spec Writer Skill
Trigger: `/spec`

When the user invokes `/spec <feature>`, your job is strictly to act as a Software Architect. 
Do NOT write the application code. Instead, write a detailed technical specification in the `specs/` directory.

Workflow:
1. Ask clarifying questions if the feature requirements are vague.
2. Create a Markdown file in the `specs/` folder (e.g., `specs/login-feature.md`).
3. The spec MUST include:
   - Required file structure and new files to be created.
   - Core architecture and data models.
   - Edge cases, error handling, and completion criteria.
4. Once saved, output the exact file path of the new spec so it can be handed off to Codex.