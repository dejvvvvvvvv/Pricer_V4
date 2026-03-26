# Brave Search API — Usage Log (MCP)

**Total queries: 2**

> Pravidlo: Brave Search API (přes MCP) se používá jen když Context7 nestačí a je to opravdu nutné.
> Každá **1 query = 1 použití**. Vždy zapiš záznam.

---

## Template (copy/paste)

- **Date/Time (Europe/Prague):** YYYY-MM-DD HH:MM
- **Agent:** <agent-name>
- **Reason:** Why Context7 was insufficient
- **Query:** <the exact brave query / tool call summary>
- **Result:** 1–3 sentence summary + whether it changed a decision
- **Notes:** optional

---

## Entries

<!-- Add new entries below this line -->

### Entry #1
- **Date/Time (Europe/Prague):** 2026-03-25 ~14:00
- **Agent:** mp-spec-research-web
- **Reason:** Context7 has no PrusaSlicer documentation. Needed CLI --rotate flags info.
- **Query:** `PrusaSlicer CLI --rotate --transform command line rotate STL file before slicing`
- **Result:** Found that PrusaSlicer supports `--rotate-x`, `--rotate-y`, `--rotate-z` (Euler angles in degrees) and `--scale`. However, these are Euler angles only — no quaternion support. Also found GitHub issue #3898 noting that CLI rotation does not auto-place object on build plate. Decision: PrusaSlicer CLI rotation is insufficient for quaternion-based auto-orient — must pre-transform STL.
- **Notes:** Slic3r manual + PrusaSlicer wiki + Reddit batch processing example confirmed flags.

### Entry #2
- **Date/Time (Europe/Prague):** 2026-03-25 ~14:00
- **Agent:** mp-spec-research-web
- **Reason:** Context7 does not cover Node.js STL manipulation libraries. Needed npm package landscape.
- **Query:** `Node.js parse binary STL file apply rotation transform vertices npm library 2024 2025`
- **Result:** Found multiple npm packages: `node-stl` (0.7.3, 3y old, read-only metrics), `stl-reader` (3.0.1, 10y old), `parse-stl` (simplicial-complex format), `@amandaghassaei/stl-parser` (1.7.0, 2y old, modern). None provide write/transform capability — all are read-only parsers. Decision: custom binary STL parser/writer is the best approach (format is trivial: 80B header + 4B count + 50B per triangle).
- **Notes:** Three.js STLLoader+STLExporter on server side is alternative but heavy dependency for simple binary manipulation.
