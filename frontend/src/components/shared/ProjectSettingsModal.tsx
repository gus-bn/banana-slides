import React, { useState } from 'react';
import { X, FileText, Settings as SettingsIcon, Download, Sparkles, AlertTriangle } from 'lucide-react';
import { Button, Textarea } from '@/components/shared';
import { Settings } from '@/pages/Settings';
import type { ExportExtractorMethod, ExportInpaintMethod } from '@/types';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Project settings
  extraRequirements: string;
  templateStyle: string;
  onExtraRequirementsChange: (value: string) => void;
  onTemplateStyleChange: (value: string) => void;
  onSaveExtraRequirements: () => void;
  onSaveTemplateStyle: () => void;
  isSavingRequirements: boolean;
  isSavingTemplateStyle: boolean;
  // Export settings
  exportExtractorMethod?: ExportExtractorMethod;
  exportInpaintMethod?: ExportInpaintMethod;
  onExportExtractorMethodChange?: (value: ExportExtractorMethod) => void;
  onExportInpaintMethodChange?: (value: ExportInpaintMethod) => void;
  onSaveExportSettings?: () => void;
  isSavingExportSettings?: boolean;
}

type SettingsTab = 'project' | 'global' | 'export';

// Component extractor method options
const EXTRACTOR_METHOD_OPTIONS: { value: ExportExtractorMethod; label: string; description: string }[] = [
  { 
    value: 'hybrid', 
    label: 'Hybrid Extraction (Recommended)', 
    description: 'MinerU layout analysis + Baidu high-precision OCR, more accurate text recognition' 
  },
  { 
    value: 'mineru', 
    label: 'MinerU Extraction', 
    description: 'Only use MinerU for layout analysis and text recognition' 
  },
];

// Background image acquisition method options
const INPAINT_METHOD_OPTIONS: { value: ExportInpaintMethod; label: string; description: string; usesAI: boolean }[] = [
  { 
    value: 'hybrid', 
    label: 'Hybrid Mode (Recommended)', 
    description: 'Baidu precise text removal + Generative model image enhancement',
    usesAI: true 
  },
  { 
    value: 'generative', 
    label: 'Generative Mode', 
    description: 'Use generative LLM (e.g., Gemini) to directly generate background, high quality but risk of residual elements',
    usesAI: true 
  },
  { 
    value: 'baidu', 
    label: 'Baidu Erasure Service', 
    description: 'Use Baidu Image Inpainting API, fast but average quality',
    usesAI: false 
  },
];

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  extraRequirements,
  templateStyle,
  onExtraRequirementsChange,
  onTemplateStyleChange,
  onSaveExtraRequirements,
  onSaveTemplateStyle,
  isSavingRequirements,
  isSavingTemplateStyle,
  // Export settings
  exportExtractorMethod = 'hybrid',
  exportInpaintMethod = 'hybrid',
  onExportExtractorMethodChange,
  onExportInpaintMethodChange,
  onSaveExportSettings,
  isSavingExportSettings = false,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('project');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Top Title Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Sidebar */}
          <aside className="w-64 bg-gray-50 border-r border-gray-200 flex-shrink-0">
            <nav className="p-4 space-y-2">
              <button
                onClick={() => setActiveTab('project')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === 'project'
                    ? 'bg-banana-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText size={20} />
                <span className="font-medium">Project Settings</span>
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === 'export'
                    ? 'bg-banana-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Download size={20} />
                <span className="font-medium">Export Settings</span>
              </button>
              <button
                onClick={() => setActiveTab('global')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === 'global'
                    ? 'bg-banana-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <SettingsIcon size={20} />
                <span className="font-medium">Global Settings</span>
              </button>
            </nav>
          </aside>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'project' ? (
              <div className="max-w-3xl space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Configuration</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    These settings only apply to the current project and do not affect others.
                  </p>
                </div>

                {/* Extra Requirements */}
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-2">Extra Requirements</h4>
                    <p className="text-sm text-gray-600">
                      AI will refer to these extra requirements when generating each page.
                    </p>
                  </div>
                  <Textarea
                    value={extraRequirements}
                    onChange={(e) => onExtraRequirementsChange(e.target.value)}
                    placeholder="E.g., Use compact layout, show level 1 outline title at top, include richer PPT illustrations..."
                    rows={4}
                    className="text-sm"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onSaveExtraRequirements}
                    disabled={isSavingRequirements}
                    className="w-full sm:w-auto"
                  >
                    {isSavingRequirements ? 'Saving...' : 'Save Extra Requirements'}
                  </Button>
                </div>

                {/* Style Description */}
                <div className="bg-blue-50 rounded-lg p-6 space-y-4">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-2">Style Description</h4>
                    <p className="text-sm text-gray-600">
                      Describe your desired overall PPT style, and AI will generate pages accordingly.
                    </p>
                  </div>
                  <Textarea
                    value={templateStyle}
                    onChange={(e) => onTemplateStyleChange(e.target.value)}
                    placeholder="E.g., Minimalist business style, using deep blue and white color scheme, clear and generous fonts, neat layout..."
                    rows={5}
                    className="text-sm"
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onSaveTemplateStyle}
                      disabled={isSavingTemplateStyle}
                      className="w-full sm:w-auto"
                    >
                      {isSavingTemplateStyle ? 'Saving...' : 'Save Style Description'}
                    </Button>
                  </div>
                  <div className="bg-blue-100 rounded-md p-3">
                    <p className="text-xs text-blue-900">
                      💡 <strong>Tip:</strong> Style description will be automatically added to the prompt when generating images.
                      If a template image is uploaded, the style description will serve as supplementary instruction.
                    </p>
                  </div>
                </div>
              </div>
            ) : activeTab === 'export' ? (
              <div className="max-w-3xl space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Editable PPTX Export Settings</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure how "Export Editable PPTX" function works. These settings affect export quality and API costs.
                  </p>
                </div>

                {/* Extractor Method */}
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-2">Component Extraction Method</h4>
                    <p className="text-sm text-gray-600">
                      Choose how to extract editable components like text and tables from PPT images.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {EXTRACTOR_METHOD_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          exportExtractorMethod === option.value
                            ? 'border-banana-500 bg-banana-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="extractorMethod"
                          value={option.value}
                          checked={exportExtractorMethod === option.value}
                          onChange={(e) => onExportExtractorMethodChange?.(e.target.value as ExportExtractorMethod)}
                          className="mt-1 w-4 h-4 text-banana-500 focus:ring-banana-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Background Inpaint Method */}
                <div className="bg-orange-50 rounded-lg p-6 space-y-4">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-2">Background Acquisition Method</h4>
                    <p className="text-sm text-gray-600">
                      Choose how to generate clean background images (removing text from original image for PPT background).
                    </p>
                  </div>
                  <div className="space-y-3">
                    {INPAINT_METHOD_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          exportInpaintMethod === option.value
                            ? 'border-banana-500 bg-banana-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="inpaintMethod"
                          value={option.value}
                          checked={exportInpaintMethod === option.value}
                          onChange={(e) => onExportInpaintMethodChange?.(e.target.value as ExportInpaintMethod)}
                          className="mt-1 w-4 h-4 text-banana-500 focus:ring-banana-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{option.label}</span>
                            {option.usesAI && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                <Sparkles size={12} />
                                Uses Text-to-Image Model
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="bg-amber-100 rounded-md p-3 flex items-start gap-2">
                    <AlertTriangle size={16} className="text-amber-700 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900">
                      <strong>Cost Note:</strong> Options marked with "Uses Text-to-Image Model" will call AI image generation APIs (like Gemini),
                      incurring extra API costs per page. If cost control is needed, choose "Baidu Erasure Service".
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                {onSaveExportSettings && (
                  <div className="flex justify-end pt-4">
                    <Button
                      variant="primary"
                      onClick={onSaveExportSettings}
                      disabled={isSavingExportSettings}
                    >
                      {isSavingExportSettings ? 'Saving...' : 'Save Export Settings'}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-4xl">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Global Settings</h3>
                  <p className="text-sm text-gray-600">
                    These settings apply to all projects.
                  </p>
                </div>
                {/* Reuse Settings Component Content */}
                <Settings />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

