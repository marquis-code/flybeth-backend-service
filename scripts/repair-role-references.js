/**
 * Repairs user role references that point at the retired `roleentities`
 * collection.
 *
 * `RoleEntity` used to map to the `roleentities` collection and now maps to
 * `roles` (`access-control/schemas/role.schema.ts`). Any user created before the
 * move still references a `roleentities` id, so `populate('role')` resolves to
 * null and every role-gated endpoint answers 403 for that user.
 *
 * This script re-points those users at the equivalent role in `roles`, matched
 * by name. Idempotent and safe to re-run.
 *
 * Usage: node scripts/repair-role-references.js [--dry-run]
 */
const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const DRY_RUN = process.argv.includes("--dry-run");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const current = await db.collection("roles").find({}).toArray();
  const legacyExists = (await db.listCollections({ name: "roleentities" }).toArray()).length > 0;
  const legacy = legacyExists
    ? await db.collection("roleentities").find({}).toArray()
    : [];

  const byName = new Map(
    current.map((r) => [String(r.name || "").toLowerCase(), r]),
  );
  const legacyById = new Map(legacy.map((r) => [String(r._id), r]));
  const currentIds = new Set(current.map((r) => String(r._id)));

  console.log(`roles: ${current.length} | legacy roleentities: ${legacy.length}`);
  console.log(`current roles: ${[...byName.values()].map((r) => r.name).join(", ")}`);

  const users = await db.collection("users").find({}).toArray();
  let repaired = 0;
  let unrecoverable = 0;

  for (const user of users) {
    if (!user.role) continue;
    const roleId = String(user.role);
    if (currentIds.has(roleId)) continue;

    const legacyRole = legacyById.get(roleId);
    const targetName = legacyRole ? String(legacyRole.name || "").toLowerCase() : null;
    const target = targetName ? byName.get(targetName) : null;

    if (!target) {
      unrecoverable++;
      console.log(
        `  ! ${user.email}: role ${roleId} (${legacyRole ? legacyRole.name : "unknown"}) has no match in 'roles'`,
      );
      continue;
    }

    console.log(
      `  > ${user.email}: ${roleId} (${legacyRole.name}) -> ${target._id} (${target.name})`,
    );
    if (!DRY_RUN) {
      await db
        .collection("users")
        .updateOne({ _id: user._id }, { $set: { role: target._id } });
    }
    repaired++;
  }

  // Invitations reference roles the same way.
  const invitations = await db.collection("invitations").find({}).toArray();
  let invRepaired = 0;
  for (const inv of invitations) {
    if (!inv.role) continue;
    const roleId = String(inv.role);
    if (currentIds.has(roleId)) continue;
    const legacyRole = legacyById.get(roleId);
    const target = legacyRole
      ? byName.get(String(legacyRole.name || "").toLowerCase())
      : null;
    if (!target) continue;
    console.log(`  > invitation ${inv.email}: ${roleId} -> ${target._id} (${target.name})`);
    if (!DRY_RUN) {
      await db
        .collection("invitations")
        .updateOne({ _id: inv._id }, { $set: { role: target._id } });
    }
    invRepaired++;
  }

  console.log(
    `\n${DRY_RUN ? "[dry-run] " : ""}repaired ${repaired} users, ${invRepaired} invitations; ${unrecoverable} could not be matched.`,
  );
  await mongoose.disconnect();
})().catch((err) => {
  console.error("Repair failed:", err.message);
  process.exit(1);
});
