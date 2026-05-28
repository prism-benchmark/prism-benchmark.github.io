# Aspect Benchmarks Demo Package

This folder normalizes the selected-paper benchmark outputs for project-page demos.

## Layout

```text
aspect_benchmarks_demo/
  <aspect>/
    <conference>/
      <source>/
        ... aspect-specific result files ...
```

Conferences: `iclr2024`, `iclr2025`, `iclr2026`, `icml2025`, `neurips2025`.

Sources: `human`, `sea`, `tree`, `reviewer2`, `deepreview`, `cyclereview`.

Notes:
- `constructiveness` and `novelty_verification` include all six sources.
- `depth_of_analysis` and `flaw_identification` include the five LLM sources only; the original pipelines did not produce human outputs for these aspects.
- The source-data typo `Neurlps2025` is normalized here to `neurips2025`.

See `MANIFEST.json` for the full file inventory.
