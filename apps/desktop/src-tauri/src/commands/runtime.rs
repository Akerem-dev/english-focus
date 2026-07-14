use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeInfo {
    product_name: &'static str,
    app_version: &'static str,
    runtime: &'static str,
}

#[tauri::command]
pub fn runtime_info() -> RuntimeInfo {
    RuntimeInfo {
        product_name: "English Focus",
        app_version: env!("CARGO_PKG_VERSION"),
        runtime: "Tauri 2 + Rust",
    }
}
