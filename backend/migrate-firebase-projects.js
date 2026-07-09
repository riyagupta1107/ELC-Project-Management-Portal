/**
 * migrate-firebase-projects.js
 * 
 * ONE-TIME migration script to delete Project and Application records
 * that were created with Firebase UIDs before the JWT migration.
 *
 * A "Firebase-era" project is identified by a professorUid that is NOT
 * a valid 24-character MongoDB ObjectId hex string.
 *
 * HOW TO RUN:
 *   node migrate-firebase-projects.js
 *
 * SAFE TO RUN MULTIPLE TIMES — it is idempotent.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error("❌  MONGO_URI not set in .env — aborting.");
    process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log("✅  MongoDB connected");

const Project    = mongoose.model("Project",    new mongoose.Schema({ professorUid: String }, { strict: false }));
const Application = mongoose.model("Application", new mongoose.Schema({ projectId: mongoose.Schema.Types.ObjectId }, { strict: false }));

// 1. Find all projects whose professorUid is NOT a valid ObjectId (legacy Firebase UIDs)
const allProjects = await Project.find({}).lean();

const legacyProjects = allProjects.filter(
    p => !p.professorUid || !mongoose.Types.ObjectId.isValid(p.professorUid)
);

if (legacyProjects.length === 0) {
    console.log("✅  No legacy Firebase-era projects found. Database is clean.");
    await mongoose.disconnect();
    process.exit(0);
}

console.log(`\n⚠️   Found ${legacyProjects.length} legacy project(s) with Firebase UIDs:`);
legacyProjects.forEach(p => {
    console.log(`   - [${p._id}] "${p.title}" — professorUid: ${p.professorUid}`);
});

const legacyProjectIds = legacyProjects.map(p => p._id);

// 2. Delete orphaned applications for these projects
const appResult = await Application.deleteMany({ projectId: { $in: legacyProjectIds } });
console.log(`\n🗑️   Deleted ${appResult.deletedCount} orphaned application(s).`);

// 3. Delete the legacy projects
const projResult = await Project.deleteMany({ _id: { $in: legacyProjectIds } });
console.log(`🗑️   Deleted ${projResult.deletedCount} legacy project(s).`);

console.log("\n✅  Migration complete. All legacy Firebase-era records removed.");

await mongoose.disconnect();
