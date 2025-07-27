use thiserror::Error;
use specta::Type;
use serde::{Serialize, Deserialize};
pub type Result<T> = std::result::Result<T, ApiError>;

#[derive(Type, Serialize, Deserialize, Error, Debug)]
#[derive(PartialEq)]
pub enum ApiError {
    #[error("Error: {0}")]
    Error(String),

    #[error("JSON error: {0}")]
    JsonError(String),

    #[error("Tokio error: {0}")]
    TokioError(String),

    #[error("IoError: {0}")]
    IoError(String),


    #[error("NetstatError: {0}")]
    NetstatError(String),
}

impl From<serde_json::error::Error> for ApiError {
    fn from(e: serde_json::error::Error) -> Self {
        ApiError::JsonError(e.to_string())
    }
}

impl From<tokio::sync::oneshot::error::RecvError> for ApiError {
    fn from(e: tokio::sync::oneshot::error::RecvError) -> Self {
        ApiError::TokioError(e.to_string())
    }
}

impl From<std::io::Error> for ApiError {
    fn from(e: std::io::Error) -> Self {
        ApiError::IoError(e.to_string())
    }
}

impl From<netstat2::error::Error> for ApiError {
    fn from(e: netstat2::error::Error) -> Self {
        ApiError::NetstatError(e.to_string())
    }
}

