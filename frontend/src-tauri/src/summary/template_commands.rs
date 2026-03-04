use crate::summary::templates;
use serde::{Deserialize, Serialize};
use tauri::Runtime;
use tracing::{info, warn};

/// Template metadata for UI display
#[derive(Debug, Serialize, Deserialize)]
pub struct TemplateInfo {
    /// Template identifier (e.g., "daily_standup", "standard_meeting")
    pub id: String,

    /// Display name for the template
    pub name: String,

    /// Brief description of the template's purpose
    pub description: String,
}

/// Detailed template structure for preview/debugging
#[derive(Debug, Serialize, Deserialize)]
pub struct TemplateDetails {
    /// Template identifier
    pub id: String,

    /// Display name
    pub name: String,

    /// Description
    pub description: String,

    /// List of section titles in order
    pub sections: Vec<String>,
}

/// Lists all available templates
///
/// Returns templates from both built-in (embedded) and custom (user data directory) sources.
/// Templates are automatically discovered - no code changes needed to add new templates.
///
/// # Returns
/// Vector of TemplateInfo with id, name, and description for each template
#[tauri::command]
pub async fn api_list_templates<R: Runtime>(
    _app: tauri::AppHandle<R>,
) -> Result<Vec<TemplateInfo>, String> {
    info!("api_list_templates called");

    let templates = templates::list_templates();

    let template_infos: Vec<TemplateInfo> = templates
        .into_iter()
        .map(|(id, name, description)| TemplateInfo {
            id,
            name,
            description,
        })
        .collect();

    info!("Found {} available templates", template_infos.len());

    Ok(template_infos)
}

/// Gets detailed information about a specific template
///
/// # Arguments
/// * `template_id` - Template identifier (e.g., "daily_standup")
///
/// # Returns
/// TemplateDetails with full template structure
#[tauri::command]
pub async fn api_get_template_details<R: Runtime>(
    _app: tauri::AppHandle<R>,
    template_id: String,
) -> Result<TemplateDetails, String> {
    info!("api_get_template_details called for template_id: {}", template_id);

    let template = templates::get_template(&template_id)?;

    let section_titles: Vec<String> = template
        .sections
        .iter()
        .map(|section| section.title.clone())
        .collect();

    let details = TemplateDetails {
        id: template_id,
        name: template.name,
        description: template.description,
        sections: section_titles,
    };

    info!("Retrieved template details for '{}'", details.name);

    Ok(details)
}

/// Validates a custom template JSON string
///
/// Useful for template editor UI or validation before saving custom templates
///
/// # Arguments
/// * `template_json` - Raw JSON string of the template
///
/// # Returns
/// Ok(template_name) if valid, Err(error_message) if invalid
#[tauri::command]
pub async fn api_validate_template<R: Runtime>(
    _app: tauri::AppHandle<R>,
    template_json: String,
) -> Result<String, String> {
    info!("api_validate_template called");

    match templates::validate_and_parse_template(&template_json) {
        Ok(template) => {
            info!("Template '{}' validated successfully", template.name);
            Ok(template.name)
        }
        Err(e) => {
            warn!("Template validation failed: {}", e);
            Err(e)
        }
    }
}

/// Extended template info with builtin flag
#[derive(Debug, Serialize, Deserialize)]
pub struct TemplateInfoExtended {
    /// Template identifier (e.g., "daily_standup", "standard_meeting")
    pub id: String,

    /// Display name for the template
    pub name: String,

    /// Brief description of the template's purpose
    pub description: String,

    /// Whether this is a built-in template (cannot be deleted)
    pub is_builtin: bool,
}

/// Lists all available templates with extended info including builtin flag
///
/// # Returns
/// Vector of TemplateInfoExtended
#[tauri::command]
pub async fn api_list_templates_extended<R: Runtime>(
    _app: tauri::AppHandle<R>,
) -> Result<Vec<TemplateInfoExtended>, String> {
    info!("api_list_templates_extended called");

    let template_list = templates::list_templates();

    let template_infos: Vec<TemplateInfoExtended> = template_list
        .into_iter()
        .map(|(id, name, description)| {
            let is_builtin = templates::is_builtin_template(&id);
            TemplateInfoExtended {
                id,
                name,
                description,
                is_builtin,
            }
        })
        .collect();

    info!("Found {} available templates (extended)", template_infos.len());

    Ok(template_infos)
}

/// Saves a custom template to the user's templates directory
///
/// # Arguments
/// * `template_id` - Template identifier (alphanumeric and underscores only)
/// * `template_json` - JSON content of the template
///
/// # Returns
/// Ok(()) on success, Err(error_message) on failure
#[tauri::command]
pub async fn api_save_custom_template<R: Runtime>(
    _app: tauri::AppHandle<R>,
    template_id: String,
    template_json: String,
) -> Result<(), String> {
    info!("api_save_custom_template called for template_id: {}", template_id);

    templates::save_custom_template(&template_id, &template_json)?;

    info!("Custom template '{}' saved successfully", template_id);
    Ok(())
}

/// Deletes a custom template from the user's templates directory
///
/// Note: Built-in templates cannot be deleted.
///
/// # Arguments
/// * `template_id` - Template identifier
///
/// # Returns
/// Ok(()) on success, Err(error_message) on failure
#[tauri::command]
pub async fn api_delete_custom_template<R: Runtime>(
    _app: tauri::AppHandle<R>,
    template_id: String,
) -> Result<(), String> {
    info!("api_delete_custom_template called for template_id: {}", template_id);

    templates::delete_custom_template(&template_id)?;

    info!("Custom template '{}' deleted successfully", template_id);
    Ok(())
}

/// Gets the full template JSON content
///
/// Useful for template editor to load and edit existing templates
///
/// # Arguments
/// * `template_id` - Template identifier
///
/// # Returns
/// The template JSON string
#[tauri::command]
pub async fn api_get_template_json<R: Runtime>(
    _app: tauri::AppHandle<R>,
    template_id: String,
) -> Result<String, String> {
    info!("api_get_template_json called for template_id: {}", template_id);

    let template = templates::get_template(&template_id)?;

    // Serialize back to pretty JSON
    let json = serde_json::to_string_pretty(&template)
        .map_err(|e| format!("Failed to serialize template: {}", e))?;

    info!("Retrieved template JSON for '{}'", template_id);
    Ok(json)
}

/// Checks if a template ID is valid (alphanumeric and underscores only)
///
/// # Arguments
/// * `template_id` - Template identifier to validate
///
/// # Returns
/// Ok(true) if valid, Ok(false) if invalid
#[tauri::command]
pub async fn api_is_valid_template_id<R: Runtime>(
    _app: tauri::AppHandle<R>,
    template_id: String,
) -> Result<bool, String> {
    let is_valid = !template_id.is_empty() 
        && template_id.chars().all(|c| c.is_alphanumeric() || c == '_');
    
    Ok(is_valid)
}

/// Gets the path to the custom templates directory
///
/// # Returns
/// The path string if available
#[tauri::command]
pub async fn api_get_templates_directory<R: Runtime>(
    _app: tauri::AppHandle<R>,
) -> Result<String, String> {
    templates::get_custom_templates_directory()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not determine templates directory".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_list_templates() {
        // This test requires the templates to be embedded/available
        // In a real test environment, you might want to mock the templates module

        // For now, just verify the function compiles and runs
        // You can expand this with more specific assertions
    }

    #[tokio::test]
    async fn test_validate_template_valid() {
        let valid_json = r#"
        {
            "name": "Test Template",
            "description": "A test template",
            "sections": [
                {
                    "title": "Summary",
                    "instruction": "Provide a summary",
                    "format": "paragraph"
                }
            ]
        }"#;

        // Mock app handle would be needed for actual testing
        // For now, test the validation logic directly
        let result = templates::validate_and_parse_template(valid_json);
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_validate_template_invalid() {
        let invalid_json = "invalid json";

        let result = templates::validate_and_parse_template(invalid_json);
        assert!(result.is_err());
    }
}
