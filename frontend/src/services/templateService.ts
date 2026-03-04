import { invoke } from '@tauri-apps/api/core';

/**
 * Template section definition
 */
export interface TemplateSection {
  title: string;
  instruction: string;
  format: 'paragraph' | 'list' | 'string';
  item_format?: string;
  example_item_format?: string;
}

/**
 * Full template structure
 */
export interface Template {
  name: string;
  description: string;
  sections: TemplateSection[];
}

/**
 * Basic template info for lists
 */
export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
}

/**
 * Extended template info with builtin flag
 */
export interface TemplateInfoExtended extends TemplateInfo {
  is_builtin: boolean;
}

/**
 * Template details with section titles
 */
export interface TemplateDetails {
  id: string;
  name: string;
  description: string;
  sections: string[];
}

/**
 * Service for managing meeting summary templates
 */
class TemplateService {
  /**
   * List all available templates
   */
  async listTemplates(): Promise<TemplateInfo[]> {
    return invoke<TemplateInfo[]>('api_list_templates');
  }

  /**
   * List all templates with extended info (including builtin flag)
   */
  async listTemplatesExtended(): Promise<TemplateInfoExtended[]> {
    return invoke<TemplateInfoExtended[]>('api_list_templates_extended');
  }

  /**
   * Get detailed info about a specific template
   */
  async getTemplateDetails(templateId: string): Promise<TemplateDetails> {
    return invoke<TemplateDetails>('api_get_template_details', { templateId });
  }

  /**
   * Get the full template JSON as a string
   */
  async getTemplateJson(templateId: string): Promise<string> {
    return invoke<string>('api_get_template_json', { templateId });
  }

  /**
   * Validate a template JSON string
   * @returns The template name if valid
   */
  async validateTemplate(templateJson: string): Promise<string> {
    return invoke<string>('api_validate_template', { templateJson });
  }

  /**
   * Save a custom template
   * @param templateId - Unique identifier (alphanumeric and underscores only)
   * @param template - Template object to save
   */
  async saveCustomTemplate(templateId: string, template: Template): Promise<void> {
    const templateJson = JSON.stringify(template, null, 2);
    return invoke<void>('api_save_custom_template', { templateId, templateJson });
  }

  /**
   * Save a custom template from JSON string
   * @param templateId - Unique identifier (alphanumeric and underscores only)
   * @param templateJson - JSON string of the template
   */
  async saveCustomTemplateJson(templateId: string, templateJson: string): Promise<void> {
    return invoke<void>('api_save_custom_template', { templateId, templateJson });
  }

  /**
   * Delete a custom template
   * Note: Built-in templates cannot be deleted
   * @param templateId - Template identifier to delete
   */
  async deleteCustomTemplate(templateId: string): Promise<void> {
    return invoke<void>('api_delete_custom_template', { templateId });
  }

  /**
   * Check if a template ID is valid (alphanumeric and underscores only)
   */
  async isValidTemplateId(templateId: string): Promise<boolean> {
    return invoke<boolean>('api_is_valid_template_id', { templateId });
  }

  /**
   * Get the path to the custom templates directory
   */
  async getTemplatesDirectory(): Promise<string> {
    return invoke<string>('api_get_templates_directory');
  }

  /**
   * Create a default template structure
   */
  createDefaultTemplate(): Template {
    return {
      name: '',
      description: '',
      sections: [
        {
          title: 'Summary',
          instruction: 'Provide a brief summary of the meeting.',
          format: 'paragraph',
        },
      ],
    };
  }

  /**
   * Convert template name to a valid ID
   * @param name - Template name
   * @returns Valid template ID
   */
  nameToId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}

export const templateService = new TemplateService();
export default templateService;
