-- Add summary_prompt_template column to settings table
-- This allows users to customize the default prompt template for AI summary generation
ALTER TABLE settings ADD COLUMN summaryPromptTemplate TEXT DEFAULT '';
