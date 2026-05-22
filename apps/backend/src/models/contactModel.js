const pool = require("../config/db");

/**
 * Create a new contact
 */
exports.createContact = async (userId, name, email, relation) => {
  const query = `
    INSERT INTO contacts (user_id, name, email, relation)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [userId, name, email, relation];
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Get all contacts for a user
 */
exports.getContactsByUserId = async (userId) => {
  const query = `SELECT * FROM contacts WHERE user_id = $1 ORDER BY name ASC;`;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

/**
 * Get contact by ID
 */
exports.getContactById = async (id) => {
  const query = `SELECT * FROM contacts WHERE id = $1;`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

/**
 * Update a contact
 */
exports.updateContact = async (id, name, email, relation) => {
  const query = `
    UPDATE contacts
    SET name = $1, email = $2, relation = $3, updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *;
  `;
  const values = [name, email, relation, id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Delete a contact
 */
exports.deleteContact = async (id) => {
  const query = `DELETE FROM contacts WHERE id = $1 RETURNING *;`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

/**
 * Search contacts by name (fuzzy match)
 */
/**
 * Levenshtein distance for fuzzy matching
 */
const levenshteinDistance = (a, b) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

/**
 * Search contacts by name (fuzzy match)
 * IMPROVED: Handles multi-word queries like "Kaushik tomorrow" by tokenizing.
 */
exports.searchContacts = async (userId, nameQuery) => {
  // 1. Get ALL contacts for this user
  const query = `SELECT * FROM contacts WHERE user_id = $1;`;
  const result = await pool.query(query, [userId]);
  const contacts = result.rows;

  if (!contacts || contacts.length === 0) return [];

  const lowerQuery = nameQuery.toLowerCase();

  // Split query into tokens (e.g., "Kaushik Nandikanti" -> ["kaushik", "nandikanti"])
  const queryTokens = lowerQuery.split(/\s+/).filter(t => t.length > 0);

  // 2. Filter using Best Token Matching
  const candidates = contacts.map(contact => {
    const lowerName = contact.name.toLowerCase();
    const contactTokens = lowerName.split(/\s+/);

    // A. Exact Name Match (Best)
    if (lowerName === lowerQuery) return { contact, score: 0 };
    if (lowerName.includes(lowerQuery)) return { contact, score: 0.1 };

    // B. Token-based Scoring
    // For every token in the query, find the BEST match in the contact's name tokens.
    // Sum these best distances to get a total score.
    let totalDist = 0;

    for (const qToken of queryTokens) {
      let bestMatchForToken = 999;

      for (const cToken of contactTokens) {
        const dist = levenshteinDistance(qToken, cToken);
        if (dist < bestMatchForToken) bestMatchForToken = dist;

        // StartsWith bonus (e.g. "Kous" matches "Koushik" better)
        if (cToken.startsWith(qToken)) {
          if (bestMatchForToken > 0.5) bestMatchForToken = 0.5;
        }
      }

      // If the query token is just getting started (length < 3), require exactish match
      if (qToken.length < 3 && bestMatchForToken > 0) bestMatchForToken = 10;

      totalDist += bestMatchForToken;
    }

    // Penalize if contact has WAY more words than query? Maybe not for now.

    // Normalize score by query length to allow some flexibility
    return { contact, score: totalDist };
  });

  // 3. Sort by Score (Lower is better)
  candidates.sort((a, b) => a.score - b.score);

  // 4. Return top matches within threshold 
  // Threshold depends on query length. 
  // E.g. "Kaushik" (1 token) -> allow approx 2 edits.
  // "Kaushik Nandikanti" (2 tokens) -> allow approx 4 edits total.
  const threshold = queryTokens.length * 2.5;

  return candidates
    .filter(c => c.score <= threshold)
    .map(c => c.contact)
    .slice(0, 5);
};
