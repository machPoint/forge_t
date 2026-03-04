/**
 * TERRAIN Integration Service
 * Handles import and context building for TERRAIN mobile app behavioral data
 */

const db = require('../config/database');
const logger = require('../logger');

/**
 * Import a TERRAIN snapshot into the database
 * @param {string} userId - User ID
 * @param {object} snapshot - Parsed TERRAIN JSON snapshot
 * @returns {Promise<object>} - Imported snapshot record
 */
async function importTerrainSnapshot(userId, snapshot) {
  try {
    // Validate snapshot structure
    if (!snapshot.terrain_version || !snapshot.exported_at) {
      throw new Error('Invalid TERRAIN snapshot: missing required fields');
    }

    // Check if this exact snapshot already exists (by exported_at)
    const existing = await db('terrain_snapshots')
      .where({
        user_id: userId,
        exported_at: snapshot.exported_at
      })
      .first();

    if (existing) {
      logger.info(`[TerrainService] Snapshot from ${snapshot.exported_at} already exists, skipping duplicate`);
      return existing;
    }

    // Insert new snapshot
    const [id] = await db('terrain_snapshots').insert({
      user_id: userId,
      exported_at: snapshot.exported_at,
      imported_at: new Date().toISOString(),
      snapshot: JSON.stringify(snapshot),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    logger.info(`[TerrainService] Imported TERRAIN snapshot from ${snapshot.exported_at} for user ${userId}`);

    return {
      id,
      user_id: userId,
      exported_at: snapshot.exported_at,
      imported_at: new Date().toISOString()
    };
  } catch (error) {
    logger.error('[TerrainService] Error importing TERRAIN snapshot:', error);
    throw error;
  }
}

/**
 * Get the most recent TERRAIN snapshot for a user
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} - Most recent snapshot or null
 */
async function getLatestSnapshot(userId) {
  try {
    const record = await db('terrain_snapshots')
      .where({ user_id: userId })
      .orderBy('exported_at', 'desc')
      .first();

    if (!record) {
      return null;
    }

    return {
      ...record,
      snapshot: JSON.parse(record.snapshot)
    };
  } catch (error) {
    logger.error('[TerrainService] Error fetching latest snapshot:', error);
    return null;
  }
}

/**
 * Get all TERRAIN snapshots for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of snapshot records
 */
async function getAllSnapshots(userId) {
  try {
    const records = await db('terrain_snapshots')
      .where({ user_id: userId })
      .orderBy('exported_at', 'desc');

    return records.map(record => ({
      id: record.id,
      exported_at: record.exported_at,
      imported_at: record.imported_at,
      user_id: record.user_id
    }));
  } catch (error) {
    logger.error('[TerrainService] Error fetching snapshots:', error);
    return [];
  }
}

/**
 * Build AI context block from TERRAIN snapshot
 * @param {object} snapshot - Parsed TERRAIN snapshot
 * @returns {string} - Formatted context for AI system prompt
 */
function buildTerrainContext(snapshot) {
  if (!snapshot) return '';

  const { fasting, protocols, reps, sentry, accomplishments, notes } = snapshot;
  const lines = [];

  lines.push('## TERRAIN Behavioral Data');
  lines.push(`Data exported: ${snapshot.exported_at.slice(0, 10)}`);
  lines.push('');

  // Fasting Protocol
  if (fasting) {
    lines.push(`**Fasting Protocol (Week ${fasting.active_week}/4):**`);
    lines.push(`- Logged ${fasting.summary.total_logged} days in past 30`);
    lines.push(`- Completed: ${fasting.summary.completed_last_30_days}, Modified this week: ${fasting.summary.modified_last_7_days}`);
    
    if (fasting.last_30_days && fasting.last_30_days.length > 0) {
      const recent = fasting.last_30_days.slice(-7);
      const recentStr = recent.map(f =>
        `${f.date_key}: ${f.fasting_window} — ${f.adhered ? 'completed' : 'modified'}${f.adherence_note ? ` (${f.adherence_note})` : ''}`
      ).join('; ');
      if (recentStr) lines.push(`- Recent: ${recentStr}`);
    }
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
  if (protocols?.today || protocols?.active_chain) {
    lines.push('');
  }

  // Behavioral Reps
  if (reps?.last_7_days?.length) {
    lines.push(`**Behavioral Reps (last 7 days):** ${reps.last_7_days.length} completed`);
    reps.last_7_days.slice(0, 3).forEach(r => {
      lines.push(`- [${r.lane}] "${r.finish_line}" — predicted: "${r.prediction}" / reality: "${r.reality}"`);
    });
    lines.push('');
  }

  // Sentry Triggers
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

  // Core Notes (high-signal psychological frameworks)
  if (notes?.length) {
    lines.push('**Core Frameworks & Insights:**');
    notes.forEach(note => {
      lines.push(`- [${note.type}] ${note.content}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

module.exports = {
  importTerrainSnapshot,
  getLatestSnapshot,
  getAllSnapshots,
  buildTerrainContext
};
