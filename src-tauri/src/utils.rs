use std::env;
use std::path::PathBuf;
use crate::error::{Result, ApiError};
pub fn get_resource_path() -> Result<PathBuf> {
    if tauri::is_dev() {
        let current_path = env::current_dir()?;
        Ok(current_path.join("resources"))
    } else {
        let current_path = env::current_exe()?;
        let base_path = current_path
            .parent()
            .ok_or(ApiError::Error("err parent".to_string()))?;
        Ok(base_path.join("resources"))
    }
}
