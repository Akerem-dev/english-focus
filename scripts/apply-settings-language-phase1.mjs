import { readFile, writeFile } from "node:fs/promises";

async function replaceExact(path, replacements) {
  let content = await readFile(path, "utf8");

  for (const [before, after] of replacements) {
    if (!content.includes(before)) {
      throw new Error(`Expected text was not found in ${path}: ${before.slice(0, 120)}`);
    }
    content = content.replace(before, after);
  }

  await writeFile(path, content, "utf8");
}

await replaceExact("apps/desktop/src/modules/settings/components/BackupSettingsSection.tsx", [
  ["Backup summary and actions", "Backup status and actions"],
  ["Retained backups", "Saved backups"],
  ["Latest backup", "Most recent backup"],
  ["Create backup now", "Back up now"],
  ["Manage backups", "View backups"],
  [
    "Backup needs attention. Open the backup manager for details.",
    "A backup action could not be completed. Open your backups for details."
  ],
  [
    "Backups stay on this device. Automatic backups keep the newest seven and restore safety\n        backups keep the newest five.",
    "Backups stay on this device. English Focus keeps recent automatic backups and recovery\n        copies so older files do not pile up."
  ]
]);

await replaceExact("apps/desktop/src/modules/backup/overlays/BackupRestoreDialog.tsx", [
  [
    'const reason = backup.reason === "pre-restore" ? "Safety backup" : `${backup.reason} backup`;\n  return `${reason} · ${backup.counts.vocabularyEntries} entries · ${backup.counts.vocabularyMetadata} metadata records`;',
    'const reason = backup.reason === "pre-restore" ? "Recovery copy" : `${backup.reason} backup`;\n  return `${reason} · ${backup.counts.vocabularyEntries} saved words · ${backup.counts.vocabularyMetadata} personal details`;'
  ],
  ['return "Safety backup";', 'return "Recovery copy";'],
  [
    'description="Review retained local backups, validate integrity, and restore only after an explicit confirmation."',
    'description="Review backups saved on this device and restore one when you need it."'
  ],
  ["Validate selected", "Check backup"],
  ["Restore selected backup", "Restore backup"],
  ['title="Backup management"', 'title="Your backups"'],
  ["Backup operation needs attention.", "This backup action could not be completed."],
  ["Backup restored successfully", "Backup restored"],
  [
    '{lastRestore.restored.vocabularyEntries} vocabulary entries and{" "}\n              {lastRestore.restored.vocabularyMetadata} metadata records were restored. A safety\n              backup was created first.',
    '{lastRestore.restored.vocabularyEntries} saved words and{" "}\n              {lastRestore.restored.vocabularyMetadata} personal details were restored. A recovery\n              copy was created first.'
  ],
  ["No retained backups yet", "No backups yet"],
  ["Create a manual backup from the Data settings panel.", "Create one from Data & backups whenever you want."],
  ['aria-label="Retained backups"', 'aria-label="Saved backups"'],
  [
    "Choose one retained backup to inspect its counts and validate its checksum.",
    "Choose a backup to see what it contains and check that it can be restored."
  ],
  ['<p>{selected.fileName}</p>', '<p>{formatDate(selected.createdAt)} · {formatSize(selected.sizeBytes)}</p>'],
  ["Vocabulary entries", "Saved words"],
  ["Study metadata", "Favorites, notes & progress"],
  ["Settings records", "App settings"],
  ["Database schema", "Backup format"],
  [
    "Validate the selected file before restore. English Focus checks the backup type,\n                    version, item counts, and checksum locally.",
    "Check this backup before restoring it. The check happens only on this device."
  ],
  ["Integrity checks passed", "Backup is ready"],
  ["The backup is ready for an explicit restore confirmation.", "You can restore it after confirming below."],
  ["Backup is not safe to restore", "This backup cannot be restored"],
  [
    "I understand this replaces local vocabulary, study metadata, and settings.",
    "I understand this will replace my saved words, personal learning details, and app settings."
  ],
  ["A pre-restore safety backup will be created automatically.", "English Focus will create a recovery copy first."],
  ["Allow deletion of this retained backup", "I want to delete this backup"],
  ["Delete selected backup", "Delete backup"]
]);

await replaceExact("apps/desktop/src/modules/settings/components/ActivitySection.tsx", [
  [
    "A short local record of important actions. Personal notes, definitions, pasted JSON, and\n            file paths are never stored here.",
    "A short history of important actions saved on this device. Your word content, notes,\n            imported text, and file locations are not included."
  ],
  ['{status === "loading" ? "Loading" : `${activity.length} recent`}', '{status === "loading" ? "Loading" : `${activity.length} ${activity.length === 1 ? "item" : "items"}`}'],
  ["Recent activity could not be loaded.", "Some activity could not be shown."],
  [
    "Some older local activity records may be incompatible with this app version.",
    "Older history items may not work with this version. Your words and settings are unaffected."
  ],
  ["View technical details", "Technical details"],
  ['label="Activity area"', 'label="Show"'],
  ['<option value="all">All activity</option>', '<option value="all">All actions</option>'],
  ['<option value="vocabulary">Vocabulary</option>', '<option value="vocabulary">Words</option>'],
  ['<option value="backup">Backup</option>', '<option value="backup">Backups</option>'],
  ["Stored only in this app · excluded from exports and backups", "Saved only on this device · not included in exports or backups"],
  ["No activity in this view", "Nothing to show here"],
  ["Open a vocabulary entry or complete a local action to create a history item.", "Open a word or use the app to start building this list."],
  [
    "This removes only the local activity timeline. Vocabulary, study details, settings, and\n            backups are not changed.",
    "This clears only the activity list. Your words, notes, settings, and backups stay unchanged."
  ],
  ["I understand this clears the retained activity timeline.", "I understand this clears the activity list."]
]);

await replaceExact("apps/desktop/src/modules/settings/components/SettingsMaintenanceOverview.tsx", [
  ["System diagnostics", "App health"],
  ["Run diagnostics", "Check app health"],
  [
    "Check SQLite integrity, recovery readiness, and local data consistency.",
    "Check whether your words, settings, and backups are working normally."
  ],
  ["Read-only until maintenance is approved", "The check does not change your data"],
  ["Local data", "My data"],
  ["Manage local data", "Manage my data"],
  [
    "Remove selected local records or review a guarded full local reset.",
    "Review or remove the words, notes, settings, activity, and backups stored on this device."
  ],
  ["Bundled vocabulary is always protected", "Built-in vocabulary is always kept"]
]);

await replaceExact("apps/desktop/src/modules/settings/components/SettingsManagementDetail.tsx", [
  ["System diagnostics", "App health"],
  [
    "Run a read-only health scan and review safe recovery guidance.",
    "Check whether your local words, settings, and backups are working normally."
  ],
  ["Local data", "My data"],
  [
    "Review record counts and carefully remove only the data you choose.",
    "Review what is stored on this device and remove only what you choose."
  ]
]);

await replaceExact("apps/desktop/src/modules/settings/components/LocalDataControlsSection.tsx", [
  ["Study details", "Favorites, tags & notes"],
  [
    "Favorites, tags, personal notes, learning status, review status, and view history.",
    "Your favorites, tags, personal notes, and word-view history."
  ],
  ["User vocabulary", "Words I added"],
  [
    "Vocabulary entries created or imported by you. Their linked study details are removed too.",
    "Words you created or imported. Their linked favorites, tags, and notes are removed too."
  ],
  ["Core vocabulary overrides", "Built-in words I edited"],
  [
    "Your replacement versions are removed; bundled core entries become visible again.",
    "Your edits are removed and the original built-in versions are shown again."
  ],
  [
    "Theme, content display, accessibility, backup, and AI instruction preferences return to defaults.",
    "Theme, content, accessibility, backup, and explanation preferences return to their defaults."
  ],
  ["Only the privacy-safe local activity timeline is cleared.", "Only the activity list saved on this device is cleared."],
  ["Retained backups", "Saved backups"],
  [
    "Every retained backup file is permanently deleted. This cannot create a safety backup.",
    "Every saved backup is permanently deleted. A recovery copy cannot be created for this choice."
  ],
  ["Local data controls", "My data"],
  [
    "Review exact record counts, remove only selected categories, or return the application\n            to a clean local state without touching bundled core vocabulary.",
    "Review what English Focus stores on this device and remove only what you choose. Built-in\n            vocabulary is always kept."
  ],
  ["Loading counts", "Loading"],
  ["Removing locally", "Removing"],
  ["Protected actions", "Your data stays protected"],
  ["Local data controls need attention.", "Your data could not be loaded."],
  ["Core overrides", "Edited built-in words"],
  ["Activity records", "Activity items"],
  ["Choose data to remove", "Choose what to remove"],
  ["Review full local reset", "Reset the app"],
  [
    "Full local reset removes user vocabulary, overrides, study details, settings, and activity.\n        Retained backups stay available unless you explicitly select backup deletion.",
    "Resetting removes your added words, edits, notes, settings, and activity. Saved backups stay\n        available unless you choose to remove them too."
  ],
  [
    'description="Select only the local data categories you intend to remove. No operation begins until every confirmation step is complete."',
    'description="Choose what you want to remove from this device. Nothing is deleted until you confirm."'
  ],
  ['title="Review local data removal"', 'title="Remove data from this device"'],
  ["Choose categories", "Choose what to remove"],
  ["Bundled core vocabulary is never deleted by these controls.", "Built-in vocabulary is always kept."],
  ['formatCount(count, "record")', 'formatCount(count, "item")'],
  ["Recovery boundary", "Keep a recovery copy"],
  ["Create a safety backup before removal", "Back up before removing anything"],
  [
    "Recommended. Vocabulary, study details, and settings can be restored later.",
    "Recommended. Your words, notes, and settings can be restored later."
  ],
  [
    "Unavailable because retained backups are included in this deletion.",
    "Unavailable because saved backups are included in this removal."
  ],
  ["Not needed for the currently selected category.", "Not needed for what you selected."],
  ["Explicit confirmation", "Confirm removal"],
  ["Selected categories", "Selected items"],
  ["Current matching records", "Items found"],
  [
    "I reviewed the selected categories and understand the removal is permanent.",
    "I reviewed my choices and understand that this cannot be undone."
  ],
  ["Confirmation phrase", "Type to confirm"],
  ["Type ${expectedPhrase} exactly to enable the final action.", "For extra safety, type ${expectedPhrase} exactly."],
  ["Removal completed", "Your selected data was removed"],
  ["No safety backup was created.", "No recovery copy was created."],
  ["A retained safety backup was created before the transaction.", "A recovery copy was created first."]
]);

await replaceExact("apps/desktop/src/modules/settings/components/DiagnosticsSection.tsx", [
  [
    "  DiagnosticCheckStatus,",
    "  DiagnosticCheck,\n  DiagnosticCheckStatus,"
  ],
  [
    'function formatGeneratedAt(value: string): string {',
    `const FRIENDLY_CHECK_COPY: Readonly<\n  Record<string, { readonly title: string; readonly passed: string; readonly warning: string; readonly failed: string }>\n> = Object.freeze({\n  "sqlite-integrity": {\n    title: "App data files",\n    passed: "Your local data files can be read normally.",\n    warning: "One local data file may need attention.",\n    failed: "A local data file could not be read safely."\n  },\n  "schema-objects": {\n    title: "Required app storage",\n    passed: "Everything English Focus needs is available.",\n    warning: "A required storage item may need to be restored.",\n    failed: "A required storage item is missing."\n  },\n  "schema-version": {\n    title: "App data compatibility",\n    passed: "Your saved data matches this version of English Focus.",\n    warning: "Your saved data needs a small compatibility update.",\n    failed: "Your saved data is not compatible with this version."\n  },\n  "database-pragmas": {\n    title: "Data protection settings",\n    passed: "Recommended local protection settings are active.",\n    warning: "A local protection setting should be reapplied.",\n    failed: "A local protection setting is unavailable."\n  },\n  "data-consistency": {\n    title: "Saved data",\n    passed: "Your words, notes, and settings passed the local checks.",\n    warning: "Some saved information should be reviewed.",\n    failed: "Some saved information could not be verified."\n  },\n  "backup-availability": {\n    title: "Backup availability",\n    passed: "At least one backup is available on this device.",\n    warning: "No backup is currently available.",\n    failed: "Backups could not be checked."\n  }\n});\n\nfunction friendlyDiagnosticCheck(check: DiagnosticCheck) {\n  const copy = FRIENDLY_CHECK_COPY[check.id];\n  if (copy === undefined) {\n    return { title: "App check", summary: check.status === "passed" ? "This check passed." : "This check needs attention." };\n  }\n\n  return {\n    title: copy.title,\n    summary: check.status === "passed" ? copy.passed : check.status === "warning" ? copy.warning : copy.failed\n  };\n}\n\nfunction diagnosticStatusLabel(status: DiagnosticCheckStatus): string {\n  return status === "passed" ? "Good" : status === "warning" ? "Check" : "Problem";\n}\n\nfunction friendlyRecommendation(recommendation: string): string {\n  if (recommendation.includes("No action")) {\n    return "No action is needed.";\n  }\n  if (recommendation.toLowerCase().includes("maintenance")) {\n    return "Use the safe repair option below.";\n  }\n  if (recommendation.toLowerCase().includes("backup")) {\n    return "Open Data & backups and restore the newest backup that passes the check.";\n  }\n  return "Follow the suggested recovery step or keep a copy of this report for support.";\n}\n\nfunction formatGeneratedAt(value: string): string {`
  ],
  ["Local diagnostics completed", "App health check completed"],
  ["Diagnostics could not be completed.", "The app health check could not be completed."],
  ["Safe maintenance could not be completed.", "The safe repair could not be completed."],
  ["Local database health", "App health"],
  [
    "Scan SQLite integrity, schema objects, stored JSON, recovery readiness, and local data\n            consistency. No vocabulary content is uploaded.",
    "Check whether your local words, settings, and backups are working normally. Nothing is\n            uploaded."
  ],
  ['{report === undefined ? "Run diagnostics" : "Run diagnostics again"}', '{report === undefined ? "Check app health" : "Check again"}'],
  ["Diagnostics needs attention", "The app health check could not finish"],
  ["No diagnostic scan has been run in this session.", "No app health check has been run yet."],
  ["The scan is read-only until you explicitly approve safe maintenance.", "This check only reads local data and does not change anything."],
  ["Local storage is healthy", "Everything looks good"],
  ["Local storage needs minor attention", "A small issue was found"],
  ["Local storage needs recovery attention", "Action is needed"],
  [
    "Generated {formatGeneratedAt(report.generatedAt)} · app {report.appVersion} ·\n                database schema {report.databaseSchemaVersion}",
    "Checked {formatGeneratedAt(report.generatedAt)} · English Focus {report.appVersion}"
  ],
  ["Vocabulary", "Saved words"],
  ["user and override records", "words you added or edited"],
  ["Study metadata", "Personal learning details"],
  ["favorite, tags, notes, and progress", "favorites, tags, notes, and progress"],
  ["retained recovery files", "saved recovery copies"],
  ["Consistency issues", "Issues found"],
  ["invalid JSON or identity mismatches", "saved items that need attention"],
  ["Health checks", "What was checked"],
  ["Every result comes from the local Tauri and SQLite runtime.", "Detailed results from this device."],
  ["Summary copied", "Report copied"],
  ["Copy blocked", "Could not copy"],
  ["Copy summary", "Copy report"],
  ["<strong>{check.title}</strong>", "<strong>{friendlyDiagnosticCheck(check).title}</strong>"],
  ["<StatusBadge tone={badgeTone(check.status)}>{check.status}</StatusBadge>", "<StatusBadge tone={badgeTone(check.status)}>{diagnosticStatusLabel(check.status)}</StatusBadge>"],
  ["<p>{check.summary}</p>", "<p>{friendlyDiagnosticCheck(check).summary}</p>"],
  ["Recommended next actions", "What to do next"],
  ["<li key={recommendation}>{recommendation}</li>", "<li key={recommendation}>{friendlyRecommendation(recommendation)}</li>"],
  ["Non-destructive maintenance", "Safe repair"],
  ["Reapply safe database maintenance", "Fix app storage"],
  [
    "This can recreate missing schema objects, restore SQLite safety settings, and run\n                query-planner optimization. It never deletes vocabulary, metadata, settings, or\n                backups.",
    "English Focus can restore missing app storage and recommended protection settings. It does\n                not delete your words, notes, settings, or backups."
  ],
  [
    "critical consistency result(s) cannot be repaired\n                  automatically. Validate and restore a retained backup instead.",
    "serious issue(s) cannot be fixed automatically. Restore a checked backup instead."
  ],
  ["I understand this maintenance is non-destructive.", "I understand this repair will not delete my data."],
  [
    "It repairs schema and SQLite configuration only; it does not rewrite corrupt\n                  vocabulary content.",
    "It only restores app storage and protection settings."
  ],
  ["No repairable schema or SQLite configuration issue was found.", "No issue that can be fixed here was found."],
  ["Run safe maintenance", "Fix issue"]
]);

await replaceExact("apps/desktop/src/modules/settings/pages/SettingsPage.tsx", [
  ["Create a retained local backup when the selected interval is due.", "Create a backup automatically on the schedule you choose."],
  ["Choose how often an automatic local backup is retained.", "Choose how often English Focus creates a backup."],
  ["Activity needs attention", "Some activity cannot be shown"],
  ["Loading local activity", "Loading activity"],
  ['`${activity.length} recent ${activity.length === 1 ? "event" : "events"}`', '`${activity.length} activity ${activity.length === 1 ? "item" : "items"}`']
]);

await replaceExact("apps/desktop/tests/components/backup/BackupRestoreDialog.test.tsx", [
  ["renders retained backups and requires validation before restore", "renders saved backups and requires a check before restore"],
  ["Backup management", "Your backups"],
  ["Validate selected", "Check backup"],
  ["Restore selected backup", "Restore backup"]
]);

await replaceExact("apps/desktop/tests/components/settings/LocalDataControlsSection.test.tsx", [
  ["Local data controls", "My data"],
  ["Choose data to remove", "Choose what to remove"],
  ["Review full local reset", "Reset the app"],
  ["bundled core vocabulary", "Built-in vocabulary"],
  ["Retained backups stay available", "Saved backups stay"]
]);

await replaceExact("apps/desktop/tests/components/settings/SettingsMaintenanceOverview.test.tsx", [
  ["System diagnostics", "App health"],
  ["Local data", "My data"],
  ["Run diagnostics", "Check app health"],
  ["Manage local data", "Manage my data"],
  ["Health checks", "What was checked"],
  ["Activity area", "Show"],
  ["Choose data to remove", "Choose what to remove"],
  ["Review full local reset", "Reset the app"]
]);

await replaceExact("testing/e2e/backup-restore.spec.ts", [
  ["Manage backups", "View backups"]
]);

await replaceExact("testing/e2e/settings-navigation.spec.ts", [
  ["System diagnostics", "App health"]
]);

console.log("Applied user-friendly Settings language changes.");
