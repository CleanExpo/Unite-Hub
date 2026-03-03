# AI Review — Browser-Based UI Validation

Automated user story validation via Playwright browser automation.

## Structure

```
ai-review/
  stories/        # User story .md files (version controlled)
  results/        # Test reports (gitignored)
  screenshots/    # Visual evidence (gitignored)
```

## Usage

```bash
/ui-review init          # Create directory structure
/ui-review run           # Execute all stories
/ui-review run --parallel 3  # Parallel execution
/ui-review report        # Generate summary
```

## Writing Stories

Copy `stories/_template.md` and fill in your scenario. Each story needs:
- **Frontmatter**: name, url, priority
- **Steps**: Numbered browser actions
- **Expected**: Assertions to validate
