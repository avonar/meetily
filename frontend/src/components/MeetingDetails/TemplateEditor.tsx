"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, GripVertical, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import templateService, {
    Template,
    TemplateSection,
    TemplateInfoExtended,
} from '@/services/templateService';

interface TemplateEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTemplatesChanged?: () => void;
}

interface SectionEditorProps {
    section: TemplateSection;
    index: number;
    onUpdate: (index: number, section: TemplateSection) => void;
    onDelete: (index: number) => void;
    canDelete: boolean;
}

function SectionEditor({
    section,
    index,
    onUpdate,
    onDelete,
    canDelete,
}: SectionEditorProps) {
    const handleChange = (field: keyof TemplateSection, value: string) => {
        onUpdate(index, { ...section, [field]: value });
    };

    return (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="text-sm font-medium">Section {index + 1}</span>
                </div>
                {canDelete && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div className="grid gap-3">
                <div>
                    <Label htmlFor={`section-title-${index}`} className="text-xs">
                        Title
                    </Label>
                    <Input
                        id={`section-title-${index}`}
                        value={section.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="e.g., Summary, Action Items"
                        className="h-8"
                    />
                </div>

                <div>
                    <Label htmlFor={`section-instruction-${index}`} className="text-xs">
                        Instruction for AI
                    </Label>
                    <Textarea
                        id={`section-instruction-${index}`}
                        value={section.instruction}
                        onChange={(e) => handleChange('instruction', e.target.value)}
                        placeholder="Instructions for the AI on what to include in this section"
                        className="min-h-[60px] resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label htmlFor={`section-format-${index}`} className="text-xs">
                            Format
                        </Label>
                        <Select
                            value={section.format}
                            onValueChange={(value) => handleChange('format', value)}
                        >
                            <SelectTrigger id={`section-format-${index}`} className="h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="paragraph">Paragraph</SelectItem>
                                <SelectItem value="list">List</SelectItem>
                                <SelectItem value="string">String</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {section.format === 'list' && (
                        <div>
                            <Label htmlFor={`section-item-format-${index}`} className="text-xs">
                                Item Format (optional)
                            </Label>
                            <Input
                                id={`section-item-format-${index}`}
                                value={section.item_format || ''}
                                onChange={(e) => handleChange('item_format', e.target.value)}
                                placeholder="e.g., | Owner | Task |"
                                className="h-8"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function TemplateEditor({
    open,
    onOpenChange,
    onTemplatesChanged,
}: TemplateEditorProps) {
    const [templates, setTemplates] = useState<TemplateInfoExtended[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [template, setTemplate] = useState<Template>(templateService.createDefaultTemplate());
    const [templateId, setTemplateId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isCreating, setIsCreating] = useState(true);

    // Load templates list
    const loadTemplates = useCallback(async () => {
        try {
            const list = await templateService.listTemplatesExtended();
            setTemplates(list);
        } catch (error) {
            console.error('Failed to load templates:', error);
            toast.error('Failed to load templates');
        }
    }, []);

    useEffect(() => {
        if (open) {
            loadTemplates();
        }
    }, [open, loadTemplates]);

    // Load selected template
    const loadTemplate = useCallback(async (id: string) => {
        setIsLoading(true);
        try {
            const json = await templateService.getTemplateJson(id);
            const parsed = JSON.parse(json) as Template;
            setTemplate(parsed);
            setTemplateId(id);
            setIsCreating(false);
        } catch (error) {
            console.error('Failed to load template:', error);
            toast.error('Failed to load template');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Handle template selection
    const handleTemplateSelect = (id: string) => {
        if (id === '__new__') {
            setSelectedTemplateId(null);
            setTemplate(templateService.createDefaultTemplate());
            setTemplateId('');
            setIsCreating(true);
        } else {
            setSelectedTemplateId(id);
            loadTemplate(id);
        }
    };

    // Update section
    const handleUpdateSection = (index: number, section: TemplateSection) => {
        const newSections = [...template.sections];
        newSections[index] = section;
        setTemplate({ ...template, sections: newSections });
    };

    // Delete section
    const handleDeleteSection = (index: number) => {
        const newSections = template.sections.filter((_, i) => i !== index);
        setTemplate({ ...template, sections: newSections });
    };

    // Add section
    const handleAddSection = () => {
        setTemplate({
            ...template,
            sections: [
                ...template.sections,
                {
                    title: '',
                    instruction: '',
                    format: 'paragraph',
                },
            ],
        });
    };

    // Generate ID from name
    const handleNameChange = (name: string) => {
        setTemplate({ ...template, name });
        if (isCreating) {
            setTemplateId(templateService.nameToId(name));
        }
    };

    // Save template
    const handleSave = async () => {
        if (!template.name.trim()) {
            toast.error('Template name is required');
            return;
        }
        if (!template.description.trim()) {
            toast.error('Template description is required');
            return;
        }
        if (!templateId.trim()) {
            toast.error('Template ID is required');
            return;
        }

        // Validate sections
        for (const section of template.sections) {
            if (!section.title.trim()) {
                toast.error('All sections must have a title');
                return;
            }
            if (!section.instruction.trim()) {
                toast.error('All sections must have an instruction');
                return;
            }
        }

        setIsSaving(true);
        try {
            await templateService.saveCustomTemplate(templateId, template);
            toast.success(`Template "${template.name}" saved successfully`);
            await loadTemplates();
            setSelectedTemplateId(templateId);
            setIsCreating(false);
            onTemplatesChanged?.();
        } catch (error) {
            console.error('Failed to save template:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to save template');
        } finally {
            setIsSaving(false);
        }
    };

    // Delete template
    const handleDelete = async () => {
        if (!selectedTemplateId) return;

        const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
        if (selectedTemplate?.is_builtin) {
            toast.error('Cannot delete built-in templates');
            return;
        }

        setIsDeleting(true);
        try {
            await templateService.deleteCustomTemplate(selectedTemplateId);
            toast.success('Template deleted successfully');
            await loadTemplates();
            setSelectedTemplateId(null);
            setTemplate(templateService.createDefaultTemplate());
            setTemplateId('');
            setIsCreating(true);
            onTemplatesChanged?.();
        } catch (error) {
            console.error('Failed to delete template:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to delete template');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const selectedTemplateInfo = templates.find((t) => t.id === selectedTemplateId);
    const canDelete = selectedTemplateId && !selectedTemplateInfo?.is_builtin;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Template Editor</DialogTitle>
                        <DialogDescription>
                            Create or edit summary templates. Custom templates are saved to your data directory.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {/* Template selector */}
                        <div className="flex items-center gap-2">
                            <Select
                                value={selectedTemplateId || '__new__'}
                                onValueChange={handleTemplateSelect}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select template to edit or create new" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__new__">
                                        <span className="flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            Create New Template
                                        </span>
                                    </SelectItem>
                                    {templates.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            <span className="flex items-center gap-2">
                                                {t.name}
                                                {t.is_builtin && (
                                                    <span className="text-xs text-muted-foreground">(built-in)</span>
                                                )}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {canDelete && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isDeleting}
                                    className="text-destructive hover:text-destructive"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </Button>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Template metadata */}
                                <div className="grid gap-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label htmlFor="template-name">Template Name</Label>
                                            <Input
                                                id="template-name"
                                                value={template.name}
                                                onChange={(e) => handleNameChange(e.target.value)}
                                                placeholder="e.g., Daily Standup"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="template-id">
                                                Template ID
                                                {selectedTemplateInfo?.is_builtin && (
                                                    <span className="text-xs text-muted-foreground ml-1">(read-only)</span>
                                                )}
                                            </Label>
                                            <Input
                                                id="template-id"
                                                value={templateId}
                                                onChange={(e) => setTemplateId(e.target.value.replace(/[^a-zA-Z0-9_]/g, '_'))}
                                                placeholder="e.g., daily_standup"
                                                disabled={selectedTemplateInfo?.is_builtin}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="template-description">Description</Label>
                                        <Textarea
                                            id="template-description"
                                            value={template.description}
                                            onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                                            placeholder="Brief description of when to use this template"
                                            className="min-h-[60px] resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Sections */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Sections</Label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddSection}
                                            className="h-7"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Section
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {template.sections.map((section, index) => (
                                            <SectionEditor
                                                key={index}
                                                section={section}
                                                index={index}
                                                onUpdate={handleUpdateSection}
                                                onDelete={handleDeleteSection}
                                                canDelete={template.sections.length > 1}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || isLoading || selectedTemplateInfo?.is_builtin}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {selectedTemplateInfo?.is_builtin ? 'Built-in (Read-only)' : 'Save Template'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{selectedTemplateInfo?.name}&quot;? This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export default TemplateEditor;
