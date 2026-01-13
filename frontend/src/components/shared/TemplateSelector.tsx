import React, { useState, useEffect } from 'react';
import { Button, useToast, MaterialSelector } from '@/components/shared';
import { getImageUrl } from '@/api/client';
import { listUserTemplates, uploadUserTemplate, deleteUserTemplate, type UserTemplate } from '@/api/endpoints';
import { materialUrlToFile } from '@/components/shared/MaterialSelector';
import type { Material } from '@/api/endpoints';
import { ImagePlus, X } from 'lucide-react';

const presetTemplates = [
  { id: '1', name: 'Vintage Scroll', preview: '/templates/template_y.png' },
  { id: '2', name: 'Vector Illustration', preview: '/templates/template_vector_illustration.png' },
  { id: '3', name: 'Skeuomorphic Glass', preview: '/templates/template_glass.png' },
  
  { id: '4', name: 'Tech Blue', preview: '/templates/template_b.png' },
  { id: '5', name: 'Minimalist Business', preview: '/templates/template_s.png' },
  { id: '6', name: 'Academic Report', preview: '/templates/template_academic.jpg' },
];

interface TemplateSelectorProps {
  onSelect: (templateFile: File | null, templateId?: string) => void;
  selectedTemplateId?: string | null;
  selectedPresetTemplateId?: string | null;
  showUpload?: boolean; // Whether to show the option to upload to user template library
  projectId?: string | null; // Project ID, used for material selector
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelect,
  selectedTemplateId,
  selectedPresetTemplateId,
  showUpload = true,
  projectId,
}) => {
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isMaterialSelectorOpen, setIsMaterialSelectorOpen] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [saveToLibrary, setSaveToLibrary] = useState(true); // Upload template saves to template library by default
  const { show, ToastContainer } = useToast();

  // Load user templates
  useEffect(() => {
    loadUserTemplates();
  }, []);

  const loadUserTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await listUserTemplates();
      if (response.data?.templates) {
        setUserTemplates(response.data.templates);
      }
    } catch (error: any) {
      console.error('Failed to load user templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        if (showUpload) {
          // Home mode: Upload directly to user template library
          const response = await uploadUserTemplate(file);
          if (response.data) {
            const template = response.data;
            setUserTemplates(prev => [template, ...prev]);
            onSelect(null, template.template_id);
            show({ message: 'Template uploaded successfully', type: 'success' });
          }
        } else {
          // Preview mode: Decide whether to save to template library based on saveToLibrary state
          if (saveToLibrary) {
            // Save to template library and apply
            const response = await uploadUserTemplate(file);
            if (response.data) {
              const template = response.data;
              setUserTemplates(prev => [template, ...prev]);
              onSelect(file, template.template_id);
              show({ message: 'Template saved to library', type: 'success' });
            }
          } else {
            // Only apply to project
            onSelect(file);
          }
        }
      } catch (error: any) {
        console.error('Template upload failed:', error);
        show({ message: 'Template upload failed: ' + (error.message || 'Unknown error'), type: 'error' });
      }
    }
    // Clear input to allow re-selecting the same file
    e.target.value = '';
  };

  const handleSelectUserTemplate = (template: UserTemplate) => {
    // Immediately update selection state (do not load File, improve responsiveness)
    onSelect(null, template.template_id);
  };

  const handleSelectPresetTemplate = (templateId: string, preview: string) => {
    if (!preview) return;
    // Immediately update selection state (do not load File, improve responsiveness)
    onSelect(null, templateId);
  };

  const handleSelectMaterials = async (materials: Material[], saveAsTemplate?: boolean) => {
    if (materials.length === 0) return;
    
    try {
      // Convert first material to File object
      const file = await materialUrlToFile(materials[0]);
      
      // Decide whether to save to template library based on saveAsTemplate param
      if (saveAsTemplate) {
        // Save to user template library
        const response = await uploadUserTemplate(file);
        if (response.data) {
          const template = response.data;
          setUserTemplates(prev => [template, ...prev]);
          // Pass file and template ID, adapt to different usage scenarios
          onSelect(file, template.template_id);
          show({ message: 'Material saved to template library', type: 'success' });
        }
      } else {
        // Use as template only
        onSelect(file);
        show({ message: 'Selected from material library as template', type: 'success' });
      }
    } catch (error: any) {
      console.error('Failed to load material:', error);
      show({ message: 'Failed to load material: ' + (error.message || 'Unknown error'), type: 'error' });
    }
  };

  const handleDeleteUserTemplate = async (template: UserTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedTemplateId === template.template_id) {
      show({ message: 'Cannot delete currently active template, please unselect or switch first', type: 'info' });
      return;
    }
    setDeletingTemplateId(template.template_id);
    try {
      await deleteUserTemplate(template.template_id);
      setUserTemplates((prev) => prev.filter((t) => t.template_id !== template.template_id));
      show({ message: 'Template deleted', type: 'success' });
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      show({ message: 'Failed to delete template: ' + (error.message || 'Unknown error'), type: 'error' });
    } finally {
      setDeletingTemplateId(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* User Saved Templates */}
        {userTemplates.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">My Templates</h4>
            <div className="grid grid-cols-4 gap-4 mb-4">
              {userTemplates.map((template) => (
                <div
                  key={template.template_id}
                  onClick={() => handleSelectUserTemplate(template)}
                  className={`aspect-[4/3] rounded-lg border-2 cursor-pointer transition-all relative group ${
                    selectedTemplateId === template.template_id
                      ? 'border-banana-500 ring-2 ring-banana-200'
                      : 'border-gray-200 hover:border-banana-300'
                  }`}
                >
                  <img
                    src={getImageUrl(template.template_image_url)}
                    alt={template.name || 'Template'}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Delete button: Only for user templates, and shown when not selected (always visible) */}
                  {selectedTemplateId !== template.template_id && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteUserTemplate(template, e)}
                      disabled={deletingTemplateId === template.template_id}
                      className={`absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow z-20 opacity-0 group-hover:opacity-100 transition-opacity ${
                        deletingTemplateId === template.template_id ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                      aria-label="Delete Template"
                    >
                      <X size={12} />
                    </button>
                  )}
                  {selectedTemplateId === template.template_id && (
                    <div className="absolute inset-0 bg-banana-500 bg-opacity-20 flex items-center justify-center pointer-events-none">
                      <span className="text-white font-semibold text-sm">Selected</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Preset Templates</h4>
          <div className="grid grid-cols-4 gap-4">
            {/* Preset Templates */}
            {presetTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => template.preview && handleSelectPresetTemplate(template.id, template.preview)}
                className={`aspect-[4/3] rounded-lg border-2 cursor-pointer transition-all bg-gray-100 flex items-center justify-center relative ${
                  selectedPresetTemplateId === template.id
                    ? 'border-banana-500 ring-2 ring-banana-200'
                    : 'border-gray-200 hover:border-banana-500'
                }`}
              >
                {template.preview ? (
                  <>
                    <img
                      src={template.preview}
                      alt={template.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {selectedPresetTemplateId === template.id && (
                      <div className="absolute inset-0 bg-banana-500 bg-opacity-20 flex items-center justify-center pointer-events-none">
                        <span className="text-white font-semibold text-sm">Selected</span>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-gray-500">{template.name}</span>
                )}
              </div>
            ))}

            {/* Upload New Template */}
            <label className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-300 hover:border-banana-500 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden">
              <span className="text-2xl">+</span>
              <span className="text-sm text-gray-500">Upload</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleTemplateUpload}
                className="hidden"
                disabled={isLoadingTemplates}
              />
            </label>
          </div>
          
          {/* Show in preview page: Option to save to template library when uploading */}
          {!showUpload && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToLibrary}
                  onChange={(e) => setSaveToLibrary(e.target.checked)}
                  className="w-4 h-4 text-banana-500 border-gray-300 rounded focus:ring-banana-500"
                />
                <span className="text-sm text-gray-700">
                  Also save to my template library
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Select from Material Library */}
        {projectId && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Select from Material Library</h4>
            <Button
              variant="secondary"
              size="sm"
              icon={<ImagePlus size={16} />}
              onClick={() => setIsMaterialSelectorOpen(true)}
              className="w-full"
            >
              Select from Material Library as Template
            </Button>
          </div>
        )}
      </div>
      <ToastContainer />
      {/* Material Selector */}
      {projectId && (
        <MaterialSelector
          projectId={projectId}
          isOpen={isMaterialSelectorOpen}
          onClose={() => setIsMaterialSelectorOpen(false)}
          onSelect={handleSelectMaterials}
          multiple={false}
          showSaveAsTemplateOption={true}
        />
      )}
    </>
  );
};

/**
 * Get template File object by template ID (load on demand)
 * @param templateId Template ID
 * @param userTemplates User template list
 * @returns Promise<File | null>
 */
export const getTemplateFile = async (
  templateId: string,
  userTemplates: UserTemplate[]
): Promise<File | null> => {
  // Check if it is a preset template
  const presetTemplate = presetTemplates.find(t => t.id === templateId);
  if (presetTemplate && presetTemplate.preview) {
    try {
      const response = await fetch(presetTemplate.preview);
      const blob = await response.blob();
      return new File([blob], presetTemplate.preview.split('/').pop() || 'template.png', { type: blob.type });
    } catch (error) {
      console.error('Failed to load preset template:', error);
      return null;
    }
  }

  // Check if it is a user template
  const userTemplate = userTemplates.find(t => t.template_id === templateId);
  if (userTemplate) {
    try {
      const imageUrl = getImageUrl(userTemplate.template_image_url);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new File([blob], 'template.png', { type: blob.type });
    } catch (error) {
      console.error('Failed to load user template:', error);
      return null;
    }
  }

  return null;
};

