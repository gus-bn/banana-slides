import React, { useState, useEffect } from 'react';
import { ImageIcon, RefreshCw, Upload, Sparkles, X } from 'lucide-react';
import { Button, useToast, Modal } from '@/components/shared';
import { listMaterials, uploadMaterial, listProjects, deleteMaterial, type Material } from '@/api/endpoints';
import type { Project } from '@/types';
import { getImageUrl } from '@/api/client';
import { MaterialGeneratorModal } from './MaterialGeneratorModal';

interface MaterialSelectorProps {
  projectId?: string; // Optional, use global interface if not provided
  isOpen: boolean;
  onClose: () => void;
  onSelect: (materials: Material[], saveAsTemplate?: boolean) => void;
  multiple?: boolean; // Whether to support multiple selection
  maxSelection?: number; // Maximum number of selections
  showSaveAsTemplateOption?: boolean; // Whether to show "Save as Template" option
}

/**
 * Material Selector Component
 * - Browse all materials under the project
 * - Support single/multiple selection
 * - Can convert selected materials to File objects or use URL directly
 * - Support uploading images as materials
 * - Support entering material generation component
 * - Support filtering materials by project
 */
export const MaterialSelector: React.FC<MaterialSelectorProps> = ({
  projectId,
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  maxSelection,
  showSaveAsTemplateOption = false,
}) => {
  const { show } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState<string>('all'); // Default to show all materials
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(true); // Default checked: Save as Template
  const [showAllProjects, setShowAllProjects] = useState(false); // Control whether to show all projects

  // No longer automatically change filter based on projectId, user can choose manually

  useEffect(() => {
    if (isOpen) {
      if (!projectsLoaded) {
        loadProjects();
      }
      loadMaterials();
      // Reset expanded state every time it opens
      setShowAllProjects(false);
    }
  }, [isOpen, filterProjectId, projectsLoaded]);

  const loadProjects = async () => {
    try {
      const response = await listProjects(100, 0);
      if (response.data?.projects) {
        setProjects(response.data.projects);
        setProjectsLoaded(true);
      }
    } catch (error: any) {
      console.error('Failed to load project list:', error);
    }
  };

  const getMaterialKey = (m: Material): string => m.id;
  const getMaterialDisplayName = (m: Material) =>
    (m.prompt && m.prompt.trim()) ||
    (m.name && m.name.trim()) ||
    (m.original_filename && m.original_filename.trim()) ||
    (m.source_filename && m.source_filename.trim()) ||
    m.filename ||
    m.url;

  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      // If filterProjectId is 'all', pass 'all'; if 'none', pass 'none'; otherwise pass actual project ID
      const targetProjectId = filterProjectId === 'all' ? 'all' : filterProjectId === 'none' ? 'none' : filterProjectId;
      const response = await listMaterials(targetProjectId);
      if (response.data?.materials) {
        setMaterials(response.data.materials);
      }
    } catch (error: any) {
      console.error('Failed to load material list:', error);
      show({
        message: error?.response?.data?.error?.message || error.message || 'Failed to load material list',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMaterial = (material: Material) => {
    const key = getMaterialKey(material);
    if (multiple) {
      const newSelected = new Set(selectedMaterials);
      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else {
        if (maxSelection && newSelected.size >= maxSelection) {
          show({
            message: `Can only select up to ${maxSelection} materials`,
            type: 'info',
          });
          return;
        }
        newSelected.add(key);
      }
      setSelectedMaterials(newSelected);
    } else {
      setSelectedMaterials(new Set([key]));
    }
  };

  const handleConfirm = () => {
    const selected = materials.filter((m) => selectedMaterials.has(getMaterialKey(m)));
    if (selected.length === 0) {
      show({ message: 'Please select at least one material', type: 'info' });
      return;
    }
    // If "Save as Template" option is enabled, pass saveAsTemplate state
    onSelect(selected, showSaveAsTemplateOption ? saveAsTemplate : undefined);
    onClose();
  };

  const handleClear = () => {
    setSelectedMaterials(new Set());
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      show({ message: 'Unsupported image format', type: 'error' });
      return;
    }

    setIsUploading(true);
    try {
      // Simplified upload logic: upload as global material (not associated with project) when filtering 'all' or 'none'
      const targetProjectId = (filterProjectId === 'all' || filterProjectId === 'none')
        ? null
        : filterProjectId;

      const response = await uploadMaterial(
        file,
        targetProjectId
      );
      
      if (response.data) {
        show({ message: 'Material uploaded successfully', type: 'success' });
        loadMaterials(); // Reload material list
      }
    } catch (error: any) {
      console.error('Material upload failed:', error);
      show({
        message: error?.response?.data?.error?.message || error.message || 'Material upload failed',
        type: 'error',
      });
    } finally {
      setIsUploading(false);
      // Clear input value to allow re-selecting the same file
      e.target.value = '';
    }
  };

  const handleGeneratorClose = () => {
    setIsGeneratorOpen(false);
    loadMaterials(); // Reload material list
  };

  const handleDeleteMaterial = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    material: Material
  ) => {
    e.stopPropagation();
    const materialId = material.id;
    const key = getMaterialKey(material);

    if (!materialId) {
      show({ message: 'Cannot delete: Missing material ID', type: 'error' });
      return;
    }

    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.add(materialId);
      return next;
    });

    try {
      await deleteMaterial(materialId);
      setMaterials((prev) => prev.filter((m) => getMaterialKey(m) !== key));
      setSelectedMaterials((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      show({ message: 'Material deleted', type: 'success' });
    } catch (error: any) {
      console.error('Failed to delete material:', error);
      show({
        message: error?.response?.data?.error?.message || error.message || 'Failed to delete material',
        type: 'error',
      });
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(materialId);
        return next;
      });
    }
  };

  const renderProjectLabel = (p: Project) => {
    const text = p.idea_prompt || p.outline_text || `Project ${p.project_id.slice(0, 8)}`;
    return text.length > 20 ? `${text.slice(0, 20)}…` : text;
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Select Material" size="lg">
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{materials.length > 0 ? `Total ${materials.length} materials` : 'No materials'}</span>
              {selectedMaterials.size > 0 && (
                <span className="ml-2 text-banana-600">
                  {selectedMaterials.size} selected
                </span>
              )}
              {isLoading && materials.length > 0 && (
                <RefreshCw size={14} className="animate-spin text-gray-400" />
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Project Filter Dropdown */}
              <select
                value={filterProjectId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'show_more') {
                    // Expand list when clicking "Show more projects"
                    setShowAllProjects(true);
                    return;
                  }
                  setFilterProjectId(value);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-banana-500 w-40 sm:w-48 max-w-[200px] truncate"
              >
                {/* Fixed first three options */}
                <option value="all">All Materials</option>
                <option value="none">Unassociated</option>
                {projectId && (
                  <option value={projectId}>
                    Current Project{projects.find(p => p.project_id === projectId) ? `: ${renderProjectLabel(projects.find(p => p.project_id === projectId)!)}` : ''}
                  </option>
                )}
                
                {/* Show all projects after expansion */}
                {showAllProjects ? (
                  <>
                    <option disabled>───────────</option>
                    {projects.filter(p => p.project_id !== projectId).map((p) => (
                      <option key={p.project_id} value={p.project_id} title={p.idea_prompt || p.outline_text}>
                        {renderProjectLabel(p)}
                      </option>
                    ))}
                  </>
                ) : (
                  // Show "Show more projects" option when not expanded
                  projects.length > (projectId ? 1 : 0) && (
                    <option value="show_more">+ Show more projects...</option>
                  )
                )}
              </select>
              
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw size={16} />}
                onClick={loadMaterials}
                disabled={isLoading}
              >
                Refresh
              </Button>
              
              {/* Upload Button */}
              <label className="inline-block cursor-pointer">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Upload size={16} />
                  <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
              
              {/* Material Generate Button */}
              {projectId && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Sparkles size={16} />}
                  onClick={() => setIsGeneratorOpen(true)}
                >
                  Generate Material
                </Button>
              )}
              
              {selectedMaterials.size > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  Clear Selection
                </Button>
              )}
            </div>
          </div>

          {/* Material Grid */}
          {isLoading && materials.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : materials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 p-4">
              <ImageIcon size={48} className="mb-4 opacity-50" />
              <div className="text-sm">No materials yet</div>
              <div className="text-xs mt-1">
                {projectId ? 'You can upload images or use the material generation feature to create materials' : 'You can upload images as materials'}
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-4 gap-4 max-h-96 overflow-y-auto  p-4">
            {materials.map((material) => {
              const key = getMaterialKey(material);
              const isSelected = selectedMaterials.has(key);
              const isDeleting = deletingIds.has(material.id);
              return (
                <div
                  key={key}
                  onClick={() => handleSelectMaterial(material)}
                  className={`aspect-video rounded-lg border-2 cursor-pointer transition-all relative group ${
                    isSelected
                      ? 'border-banana-500 ring-2 ring-banana-200'
                      : 'border-gray-200 hover:border-banana-300'
                  }`}
                >
                  <img
                    src={getImageUrl(material.url)}
                    alt={getMaterialDisplayName(material)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Delete Button: Top right, center on corner */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteMaterial(e, material)}
                    disabled={isDeleting}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow z-10 disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label="Delete Material"
                  >
                    {isDeleting ? <RefreshCw size={12} className="animate-spin" /> : <X size={12} />}
                  </button>
                  {isSelected && (
                    <div className="absolute inset-0 bg-banana-500 bg-opacity-20 flex items-center justify-center">
                      <div className="bg-banana-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                    </div>
                  )}
                  {/* Show filename on hover */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {getMaterialDisplayName(material)}
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-4 border-t">
            {/* Save as Template Option */}
            {showSaveAsTemplateOption && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    className="w-4 h-4 text-banana-500 border-gray-300 rounded focus:ring-banana-500"
                  />
                  <span className="text-sm text-gray-700">
                    Also save to my template library
                  </span>
                </label>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={selectedMaterials.size === 0}
              >
                Confirm Selection ({selectedMaterials.size})
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Material Generation Component */}
      {projectId && (
        <MaterialGeneratorModal
          projectId={projectId}
          isOpen={isGeneratorOpen}
          onClose={handleGeneratorClose}
        />
      )}
    </>
  );
};

/**
 * Convert material URL to File object
 * Used for scenarios requiring File objects (e.g., uploading reference images)
 */
export const materialUrlToFile = async (
  material: Material,
  filename?: string
): Promise<File> => {
  const imageUrl = getImageUrl(material.url);
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const file = new File(
    [blob],
    filename || material.filename,
    { type: blob.type || 'image/png' }
  );
  return file;
};

