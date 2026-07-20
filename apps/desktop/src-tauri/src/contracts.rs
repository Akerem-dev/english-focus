use std::sync::OnceLock;

use jsonschema::Validator;
use serde::Serialize;
use serde_json::Value;

struct JsonContract {
    label: &'static str,
    schema: &'static str,
    validator: OnceLock<Result<Validator, String>>,
}

impl JsonContract {
    const fn new(label: &'static str, schema: &'static str) -> Self {
        Self {
            label,
            schema,
            validator: OnceLock::new(),
        }
    }

    fn validator(&self) -> Result<&Validator, String> {
        match self.validator.get_or_init(|| {
            let schema: Value = serde_json::from_str(self.schema)
                .map_err(|error| format!("{} schema is invalid: {error}", self.label))?;
            jsonschema::validator_for(&schema)
                .map_err(|error| format!("{} schema could not compile: {error}", self.label))
        }) {
            Ok(validator) => Ok(validator),
            Err(error) => Err(error.clone()),
        }
    }

    fn validate<T: Serialize>(&self, value: &T) -> Result<(), String> {
        let value = serde_json::to_value(value)
            .map_err(|error| format!("{} could not be serialized: {error}", self.label))?;
        let errors: Vec<String> = self
            .validator()?
            .iter_errors(&value)
            .take(5)
            .map(|error| error.to_string())
            .collect();

        if errors.is_empty() {
            Ok(())
        } else {
            Err(format!(
                "{} does not match the desktop contract: {}",
                self.label,
                errors.join("; ")
            ))
        }
    }
}

static ACTIVITY_RECORD: JsonContract = JsonContract::new(
    "Activity record",
    include_str!("../schemas/activity-record.schema.json"),
);
static BACKUP_DESCRIPTOR: JsonContract = JsonContract::new(
    "Backup descriptor",
    include_str!("../schemas/backup-descriptor.schema.json"),
);
static BACKUP_VALIDATION_RESULT: JsonContract = JsonContract::new(
    "Backup validation result",
    include_str!("../schemas/backup-validation-result.schema.json"),
);
static BACKUP_RESTORE_RESULT: JsonContract = JsonContract::new(
    "Backup restore result",
    include_str!("../schemas/backup-restore-result.schema.json"),
);
static UNAVAILABLE_BACKUP: JsonContract = JsonContract::new(
    "Unavailable backup",
    include_str!("../schemas/unavailable-backup.schema.json"),
);
static DIAGNOSTIC_REPORT: JsonContract = JsonContract::new(
    "Diagnostic report",
    include_str!("../schemas/diagnostic-report.schema.json"),
);
static SAFE_MAINTENANCE_RESULT: JsonContract = JsonContract::new(
    "Safe maintenance result",
    include_str!("../schemas/safe-maintenance-result.schema.json"),
);
static DIAGNOSTIC_SCAN_COVERAGE: JsonContract = JsonContract::new(
    "Diagnostic scan coverage",
    include_str!("../schemas/diagnostic-scan-coverage.schema.json"),
);
static LOCAL_DATA_SNAPSHOT: JsonContract = JsonContract::new(
    "Local data snapshot",
    include_str!("../schemas/local-data-snapshot.schema.json"),
);
static RESET_LOCAL_DATA_RESULT: JsonContract = JsonContract::new(
    "Local data reset result",
    include_str!("../schemas/reset-local-data-result.schema.json"),
);

pub(crate) fn validate_activity_record<T: Serialize>(value: &T) -> Result<(), String> {
    ACTIVITY_RECORD.validate(value)
}

pub(crate) fn validate_backup_descriptor<T: Serialize>(value: &T) -> Result<(), String> {
    BACKUP_DESCRIPTOR.validate(value)
}

pub(crate) fn validate_backup_validation_result<T: Serialize>(value: &T) -> Result<(), String> {
    BACKUP_VALIDATION_RESULT.validate(value)
}

pub(crate) fn validate_backup_restore_result<T: Serialize>(value: &T) -> Result<(), String> {
    BACKUP_RESTORE_RESULT.validate(value)
}

pub(crate) fn validate_unavailable_backup<T: Serialize>(value: &T) -> Result<(), String> {
    UNAVAILABLE_BACKUP.validate(value)
}

pub(crate) fn validate_diagnostic_report<T: Serialize>(value: &T) -> Result<(), String> {
    DIAGNOSTIC_REPORT.validate(value)
}

pub(crate) fn validate_safe_maintenance_result<T: Serialize>(value: &T) -> Result<(), String> {
    SAFE_MAINTENANCE_RESULT.validate(value)
}

pub(crate) fn validate_diagnostic_scan_coverage<T: Serialize>(value: &T) -> Result<(), String> {
    DIAGNOSTIC_SCAN_COVERAGE.validate(value)
}

pub(crate) fn validate_local_data_snapshot<T: Serialize>(value: &T) -> Result<(), String> {
    LOCAL_DATA_SNAPSHOT.validate(value)
}

pub(crate) fn validate_reset_local_data_result<T: Serialize>(value: &T) -> Result<(), String> {
    RESET_LOCAL_DATA_RESULT.validate(value)
}

#[cfg(test)]
mod tests {
    use serde_json::Value;

    use super::{
        ACTIVITY_RECORD, BACKUP_DESCRIPTOR, BACKUP_RESTORE_RESULT, BACKUP_VALIDATION_RESULT,
        DIAGNOSTIC_REPORT, DIAGNOSTIC_SCAN_COVERAGE, LOCAL_DATA_SNAPSHOT,
        RESET_LOCAL_DATA_RESULT, SAFE_MAINTENANCE_RESULT, UNAVAILABLE_BACKUP,
    };

    fn fixtures() -> Value {
        serde_json::from_str(include_str!(
            "../../../../testing/contracts/native-boundary-fixtures.json"
        ))
        .expect("native boundary fixtures must be valid JSON")
    }

    #[test]
    fn shared_boundary_fixtures_match_every_generated_native_contract() {
        let fixtures = fixtures();
        for (key, contract) in [
            ("activityRecord", &ACTIVITY_RECORD),
            ("backupDescriptor", &BACKUP_DESCRIPTOR),
            ("backupValidationResult", &BACKUP_VALIDATION_RESULT),
            ("backupValidationWithoutDescriptor", &BACKUP_VALIDATION_RESULT),
            ("backupRestoreResult", &BACKUP_RESTORE_RESULT),
            ("unavailableBackup", &UNAVAILABLE_BACKUP),
            ("diagnosticReport", &DIAGNOSTIC_REPORT),
            ("safeMaintenanceResult", &SAFE_MAINTENANCE_RESULT),
            ("diagnosticScanCoverage", &DIAGNOSTIC_SCAN_COVERAGE),
            ("localDataSnapshot", &LOCAL_DATA_SNAPSHOT),
            ("resetLocalDataResult", &RESET_LOCAL_DATA_RESULT),
        ] {
            contract
                .validate(&fixtures[key])
                .unwrap_or_else(|error| panic!("fixture '{key}' failed: {error}"));
        }
    }

    #[test]
    fn generated_contracts_reject_unknown_fields() {
        let mut fixture = fixtures()["activityRecord"].clone();
        fixture["privateNote"] = Value::String("must not cross the bridge".to_string());

        assert!(ACTIVITY_RECORD.validate(&fixture).is_err());
    }
}
