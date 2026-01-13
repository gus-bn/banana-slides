import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, ImagePlus, Upload, X, FolderOpen } from 'lucide-react';
import { Modal, Textarea, Button, useToast, MaterialSelector, Skeleton } from '@/components/shared';
import { generateMaterialImage, getTaskStatus } from '@/api/endpoints';
import { getImageUrl } from '@/api/client';
import { materialUrlToFile } from './MaterialSelector';
import type { Material } from '@/api/endpoints';
import type { Task } from '@/types';

interface MaterialGeneratorModalProps {
  projectId?: string | null; // Optional, generates global material if not provided
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Material Generator Modal Card
 * - Input prompt + upload reference images
 * - Prompt is sent as-is to text-to-image model (no extra decoration)
 * - Generated result displayed at the top of the modal
 * - Results are unified saved in the project's historical material library (backend /uploads/{projectId}/materials)
 */
export const MaterialGeneratorModal: React.FC<MaterialGeneratorModalProps> = ({
  projectId,
  isOpen,
  onClose,
}) => {
  const { show } = useToast();
  const [prompt, setPrompt] = useState('');
  const [refImage, setRefImage] = useState<File | null>(null);
  const [extraImages, setExtraImages] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMaterialSelectorOpen, setIsMaterialSelectorOpen] = useState(false);

  const handleRefImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target.files && e.target.files[0]) || null;
    if (file) {
      setRefImage(file);
    }
  };

  const handleExtraImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // If there is no main reference image yet, prioritize the first one as main reference image, others as extra reference images
    if (!refImage) {
      const [first, ...rest] = files;
      setRefImage(first);
      if (rest.length > 0) {
        setExtraImages((prev) => [...prev, ...rest]);
      }
    } else {
      setExtraImages((prev) => [...prev, ...files]);
    }
  };

  const removeExtraImage = (index: number) => {
    setExtraImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectMaterials = async (materials: Material[]) => {
    try {
      // Convert selected materials to File objects
      const files = await Promise.all(
        materials.map((material) => materialUrlToFile(material))
      );

      if (files.length === 0) return;

      // If no main image, prioritize the first one as main reference image
      if (!refImage) {
        const [first, ...rest] = files;
        setRefImage(first);
        if (rest.length > 0) {
          setExtraImages((prev) => [...prev, ...rest]);
        }
      } else {
        setExtraImages((prev) => [...prev, ...files]);
      }

      show({ message: `Added ${files.length} materials`, type: 'success' });
    } catch (error: any) {
      console.error('Failed to load materials:', error);
      show({
        message: 'Failed to load materials: ' + (error.message || 'Unknown error'),
        type: 'error',
      });
    }
  };

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear polling
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const pollMaterialTask = async (taskId: string) => {
    const targetProjectId = projectId || 'global'; // Use 'global' as project_id for Task
    const maxAttempts = 60; // Max poll 60 times (approx 2 minutes)
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        const response = await getTaskStatus(targetProjectId, taskId);
        const task: Task = response.data;

        if (task.status === 'COMPLETED') {
          // Task completed, get result from progress
          const progress = task.progress || {};
          const imageUrl = progress.image_url;
          
          if (imageUrl) {
            setPreviewUrl(getImageUrl(imageUrl));
            const message = projectId 
              ? 'Material generated successfully, saved to history library' 
              : 'Material generated successfully, saved to global library';
            show({ message, type: 'success' });
          } else {
            show({ message: 'Material generation completed, but image URL not found', type: 'error' });
          }
          
          setIsGenerating(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (task.status === 'FAILED') {
          show({
            message: task.error_message || 'Material generation failed',
            type: 'error',
          });
          setIsGenerating(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (task.status === 'PENDING' || task.status === 'PROCESSING') {
          // Continue polling
          if (attempts >= maxAttempts) {
            show({ message: 'Material generation timed out, please check library later', type: 'warning' });
            setIsGenerating(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        }
      } catch (error: any) {
        console.error('Failed to poll task status:', error);
        if (attempts >= maxAttempts) {
          show({ message: 'Failed to poll task status, please check library later', type: 'error' });
          setIsGenerating(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      }
    };

    // Execute immediately once, then poll every 2 seconds
    poll();
    pollingIntervalRef.current = setInterval(poll, 2000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      show({ message: 'Please enter prompt', type: 'error' });
      return;
    }

    setIsGenerating(true);
    try {
      // If no projectId, use 'none' to indicate global material generation (backend will convert to 'global' for Task)
      const targetProjectId = projectId || 'none';
      const resp = await generateMaterialImage(targetProjectId, prompt.trim(), refImage as File, extraImages);
      const taskId = resp.data?.task_id;
      
      if (taskId) {
        // Start polling task status
        await pollMaterialTask(taskId);
      } else {
        show({ message: 'Material generation failed: No task ID returned', type: 'error' });
        setIsGenerating(false);
      }
    } catch (error: any) {
      show({
        message: error?.response?.data?.error?.message || error.message || 'Material generation failed',
        type: 'error',
      });
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Material Generation" size="lg">
      <blockquote className="text-sm text-gray-500 mb-4">Generated materials will be saved to the material library</blockquote>
      <div className="space-y-4">
        {/* Top: Generation Result Preview (Always show latest generation) */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Generation Result</h4>
          {isGenerating ? (
            <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
              <Skeleton className="w-full h-full" />
            </div>
          ) : previewUrl ? (
            <div className="aspect-video bg-white rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Generated Material"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-400 text-sm">
              <div className="text-3xl mb-2">🎨</div>
              <div>Generated material will be displayed here</div>
            </div>
          )}
        </div>

        {/* Prompt: Sent as-is to model */}
        <Textarea
          label="Prompt (Sent as-is to text-to-image model)"
          placeholder="E.g., Blue-purple gradient background, with geometric shapes and tech lines, for tech theme title page..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
        />

        {/* Reference Image Upload Area */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <ImagePlus size={16} className="text-gray-500" />
              <span className="font-medium">Reference Images (Optional)</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={<FolderOpen size={16} />}
              onClick={() => setIsMaterialSelectorOpen(true)}
            >
              Select from Library
            </Button>
          </div>
          <div className="flex flex-wrap gap-4">
            {/* Main Reference Image (Optional) */}
            <div className="space-y-2">
              <div className="text-xs text-gray-600">Main Ref Image (Optional)</div>
              <label className="w-40 h-28 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-banana-500 transition-colors bg-white relative group">
                {refImage ? (
                  <>
                    <img
                      src={URL.createObjectURL(refImage)}
                      alt="Main Ref Image"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setRefImage(null);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow z-10"
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <>
                    <ImageIcon size={24} className="text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Upload</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleRefImageChange}
                />
              </label>
            </div>

            {/* Extra Reference Images (Optional) */}
            <div className="flex-1 space-y-2 min-w-[180px]">
              <div className="text-xs text-gray-600">Extra Ref Images (Optional, Multiple)</div>
              <div className="flex flex-wrap gap-2">
                {extraImages.map((file, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`extra-${idx + 1}`}
                      className="w-20 h-20 object-cover rounded border border-gray-300"
                    />
                    <button
                      onClick={() => removeExtraImage(idx)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-banana-500 transition-colors bg-white">
                  <Upload size={18} className="text-gray-400 mb-1" />
                  <span className="text-[11px] text-gray-500">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleExtraImagesChange}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={handleClose} disabled={isGenerating}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </div>
      </div>
      {/* Material Selector */}
      <MaterialSelector
        projectId={projectId}
        isOpen={isMaterialSelectorOpen}
        onClose={() => setIsMaterialSelectorOpen(false)}
        onSelect={handleSelectMaterials}
        multiple={true}
      />
    </Modal>
  );
};


