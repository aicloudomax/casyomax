const pool = require("../../config/db");
const contactModel = require("../contactModel");

/**
 * These specs exercise the PUBLIC behavior of contactModel.searchContacts
 * (fuzzy contact lookup) without a real database. We stub the single point of
 * I/O — pool.query — and assert on what callers observe: which contacts come
 * back. The tests describe WHAT the search does, not HOW the scoring works, so
 * they survive a rewrite of the internal Levenshtein math.
 *
 * Sample/seed test for the Jest setup. Delete or expand as real coverage grows.
 */
describe("contactModel.searchContacts", () => {
  const seedContacts = (rows) => {
    pool.query = jest.fn().mockResolvedValue({ rows });
  };

  it("finds a contact despite a one-character typo in the name", async () => {
    seedContacts([
      { id: 1, user_id: 1, name: "Koushik", email: "k@example.com" },
      { id: 2, user_id: 1, name: "Alice", email: "alice@example.com" },
    ]);

    const results = await contactModel.searchContacts(1, "Kaushik");

    expect(results.map((c) => c.name)).toContain("Koushik");
    expect(results.map((c) => c.name)).not.toContain("Alice");
  });

  it("returns an empty list when the user has no contacts", async () => {
    seedContacts([]);

    const results = await contactModel.searchContacts(1, "anyone");

    expect(results).toEqual([]);
  });

  it("excludes contacts that are nothing like the query", async () => {
    seedContacts([
      { id: 1, user_id: 1, name: "Bob", email: "bob@example.com" },
    ]);

    const results = await contactModel.searchContacts(1, "Zxqwerty");

    expect(results).toEqual([]);
  });

  it("ranks an exact (case-insensitive) match first", async () => {
    seedContacts([
      { id: 1, user_id: 1, name: "Alicia", email: "alicia@example.com" },
      { id: 2, user_id: 1, name: "Alice", email: "alice@example.com" },
    ]);

    const results = await contactModel.searchContacts(1, "alice");

    expect(results[0].name).toBe("Alice");
  });
});
