# CP30 Test Plan

1. Verify the CP29 release-candidate lock and restore the developer's original app-data.
2. Merge and tag CP29, then create `cp30/v1-final-release`.
3. Apply the CP30 patch and run `promote-to-v1.mjs`.
4. Run final metadata verification and the complete release gate.
5. Build and verify NSIS/MSI 1.0.0 artifacts.
6. Smoke-test fresh installation and 0.9.0-to-1.0.0 upgrade data preservation.
7. Commit the tested V1 source and rebuild artifacts from the clean commit.
8. Create and commit the final release lock as the only second commit.
9. Verify the final lock, produce delivery ZIP/checksum, merge to main and tag `v1.0.0`.
