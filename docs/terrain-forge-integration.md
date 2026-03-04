# TERRAIN → Forge Integration Spec

## Overview

TERRAIN is a mobile PWA (behavioral health tracking app) that the user runs on their phone. Forge is their desktop AI journal. This spec describes how to ingest a TERRAIN data snapshot into Forge so the AI journal has full behavioral context when generating feedback and insights.

The integration is **one-way, file-based**: TERRAIN exports a JSON snapshot, the user imports it into Forge. No network sync, no API keys, no pairing required.

---

## What TERRAIN Exports

The user taps "Export to Forge" in TERRAIN Settings. This downloads a file named:

```
terrain-forge-YYYY-MM-DD.json
```

### Full Schema

```json
{
  "terrain_version": 1,
  "exported_at": "2026-03-02T03:00:00.000Z",

  "fasting": {
    "active_week": 2,
    "summary": {
      "total_logged": 18,
      "completed_last_30_days": 14,
      "modified_last_7_days": 2
    },
    "last_30_days": [
      {
        "date_key": "2026-02-01",
        "fasting_window": "18:6",
        "adhered": 1,
        "adherence_note": null,
        "protocol_week": 1
      },
      {
        "date_key": "2026-02-04",
        "fasting_window": "24-HOUR FAST",
        "adhered": 0,
        "adherence_note": "Ate early — social dinner",
        "protocol_week": 1
      }
    ]
  },

  "protocols": {
    "today": {
      "title": "Notice one avoidance trigger at work",
      "status": "COMPLETED",
      "xp_awarded": 120
    },
    "last_7_days": [
      {
        "date": "2026-02-24",
        "title": "Complete a 10-minute fasted walk",
        "status": "COMPLETED",
        "xp_awarded": 80,
        "quest_type": "TRAIL_MARKER",
        "difficulty": "EASY"
      }
    ],
    "active_chain": {
      "title": "7-Day Sentry Awareness Chain",
      "steps_completed": 4,
      "total_steps": 7,
      "xp_total": 560
    }
  },

  "reps": {
    "last_7_days": [
      {
        "lane": "WORK",
        "finish_line": "Send the email to my manager",
        "prediction": "I'll freeze up and not send it",
        "reality": "Sent it. Felt fine after.",
        "completed": 1,
        "duration_actual_sec": 420
      }
    ]
  },

  "sentry": {
    "last_14_days": [
      {
        "trigger_type": "TASK_AVOIDANCE",
        "map_character": "CRITIC",
        "intensity": 7,
        "response": "NOTICED_DID_REP",
        "one_liner": "Told myself I'd do it wrong anyway"
      }
    ]
  },

  "accomplishments": {
    "last_30_days": [
      {
        "title": "First 24-hour fast completed",
        "description": "Held the full fast without breaking. Energy dipped at hour 18 then stabilized.",
        "category": "Health",
        "date": "2026-02-10"
      }
    ]
  },

  "notes": [
    {
      "type": "PINNED",
      "content": "My core pattern: I predict failure to justify not starting. The rep proves the prediction wrong."
    },
    {
      "type": "FRAMEWORK",
      "content": "Sentry characters: CRITIC (I'll do it wrong), PREDICTOR (it won't work), MINIMIZER (it doesn't matter anyway), SYCOPHANT (you've already done enough)."
    }
  ]
}
```

### Field Reference

| Field | Type | Notes |
|---|---|---|
| `terrain_version` | number | Always `1` for now |
| `exported_at` | ISO string | When the export was generated |
| `fasting.active_week` | 1–4 | Which week of the 4-week protocol cycle the user is on |
| `fasting.last_30_days[].adhered` | 0 or 1 | 1 = Completed, 0 = Modified |
| `fasting.last_30_days[].adherence_note` | string or null | If modified, may include a reason like "Ate early — social dinner" |
| `protocols.today` | object or null | Today's daily protocol task and completion status |
| `protocols.active_chain` | object or null | Current multi-day protocol chain progress |
| `reps[].lane` | string | HOME, WORK, SOCIAL, CUSTOM, TRAVEL |
| `reps[].prediction` / `.reality` | string or null | What the user predicted would happen vs what actually happened |
| `sentry[].map_character` | string | CRITIC, SYCOPHANT, MINIMIZER, PREDICTOR — the internal voice pattern detected |
| `sentry[].intensity` | 1–10 | Self-rated intensity of the trigger |
| `sentry[].response` | string | NOTICED_CONTINUED, NOTICED_AVOIDED, NOTICED_DID_REP, REALIZED_LATER, SWALLOWED |
| `notes[].type` | string | PINNED or FRAMEWORK — these are the user's core self-understanding notes |

---

## What Forge Needs to Build

### 1. Import UI

Add a "Import TERRAIN Data" button somewhere accessible in Forge (Admin page, Settings, or a dedicated Integrations section). When clicked:
- Opens a file picker filtered to `.json`
- Reads and validates the file (check `terrain_version` field exists)
- Stores the snapshot (see Storage below)
- Shows a confirmation: "TERRAIN data imported — exported [date]"

### 2. Storage in OPAL

Store the ingested snapshot as a record in the OPAL database. Suggested approach:

**Option A — Dedicated table** (preferred if schema changes are easy):
```sql
terrain_snapshots (
  id          INTEGER PRIMARY KEY,
  exported_at TEXT,           -- ISO string from the snapshot
  imported_at TEXT,           -- when Forge ingested it
  snapshot    TEXT            -- full JSON blob
)
```

**Option B — Reuse Core Memories**:
Store it as a Core Memory entry with a special tag like `terrain_import`. Title: "TERRAIN Data — [date]". Content: the full JSON stringified or a summarized version.

Either works. Option A is cleaner. Option B requires zero schema changes.

### 3. Context Injection into AI Prompts

This is the high-value part. When Forge generates journal feedback or insights, append a TERRAIN context block to the system prompt.

**Where to add it**: `opal/src/services/promptsService.js` — wherever the system prompt is assembled for journal feedback and insight generation calls.

**How to build the context block** — fetch the most recent snapshot and call a summarizer:

```javascript
function buildTerrainContext(snapshot) {
  if (!snapshot) return '';

  const { fasting, protocols, reps, sentry, accomplishments } = snapshot;
  const lines = [];

  lines.push('## TERRAIN Behavioral Data');
  lines.push(`Data exported: ${snapshot.exported_at.slice(0, 10)}`);
  lines.push('');

  // Fasting
  if (fasting) {
    lines.push(`**Fasting Protocol (Week ${fasting.active_week}/4):**`);
    lines.push(`- Logged ${fasting.summary.total_logged} days in past 30`);
    lines.push(`- Completed: ${fasting.summary.completed_last_30_days}, Modified this week: ${fasting.summary.modified_last_7_days}`);
    const recent = fasting.last_30_days.slice(-7);
    const recentStr = recent.map(f =>
      `${f.date_key}: ${f.fasting_window} — ${f.adhered ? 'completed' : 'modified'}${f.adherence_note ? ` (${f.adherence_note})` : ''}`
    ).join('; ');
    if (recentStr) lines.push(`- Recent: ${recentStr}`);
    lines.push('');
  }

  // Protocols
  if (protocols?.today) {
    lines.push(`**Today's Protocol:** "${protocols.today.title}" — ${protocols.today.status}`);
  }
  if (protocols?.active_chain) {
    const c = protocols.active_chain;
    lines.push(`**Active Chain:** "${c.title}" — ${c.steps_completed}/${c.total_steps} steps`);
  }
  lines.push('');

  // Reps
  if (reps?.last_7_days?.length) {
    lines.push(`**Behavioral Reps (last 7 days):** ${reps.last_7_days.length} completed`);
    reps.last_7_days.slice(0, 3).forEach(r => {
      lines.push(`- [${r.lane}] "${r.finish_line}" — predicted: "${r.prediction}" / reality: "${r.reality}"`);
    });
    lines.push('');
  }

  // Sentry
  if (sentry?.last_14_days?.length) {
    lines.push(`**Sentry Triggers (last 14 days):** ${sentry.last_14_days.length} logged`);
    const topTriggers = sentry.last_14_days
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 3);
    topTriggers.forEach(s => {
      lines.push(`- ${s.trigger_type} via ${s.map_character} (intensity ${s.intensity}/10): "${s.one_liner}" — response: ${s.response}`);
    });
    lines.push('');
  }

  // Accomplishments
  if (accomplishments?.last_30_days?.length) {
    lines.push(`**Recent Accomplishments:** ${accomplishments.last_30_days.length} logged`);
    accomplishments.last_30_days.slice(0, 3).forEach(a => {
      lines.push(`- "${a.title}" (${a.date})`);
    });
    lines.push('');
  }

  return lines.join('\n');
}
```

Append the output of `buildTerrainContext(latestSnapshot)` to the system prompt string before sending to the AI provider.

### 4. Handling Multiple Imports

Each import should be stored separately (by `exported_at` date). The AI context injection should always use the **most recently imported** snapshot. Optionally show a list of past imports in the UI so the user can see what's loaded.

---

## Suggested UI Placement in Forge

- **Admin Page** → new "Integrations" section with "Import TERRAIN Snapshot" file button + "Last imported: [date]" status line
- Or a top-level **Integrations** nav item if you want to expand this later

---

## Notes for the Forge Developer

- The JSON file is always safe to re-import — use `exported_at` as a deduplication key
- The `notes` array contains the user's core psychological frameworks — these are high-signal for personalizing AI tone and avoiding generic advice
- The `sentry` data uses specific character names (CRITIC, PREDICTOR, etc.) that are part of the user's therapeutic model — the AI should reference these by name if the user mentions avoidance or self-criticism in a journal entry
- Do not summarize or truncate the `notes` content in the system prompt — include it in full, it's already capped at 500 chars per note in the export
- `fasting.active_week` tells you where the user is in their 4-week metabolic cycle — this context matters if they write about energy, mood, or focus
