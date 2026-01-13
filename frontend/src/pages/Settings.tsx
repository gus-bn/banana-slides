import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Key, Image, Zap, Save, RotateCcw, Globe, FileText } from 'lucide-react';
import { Button, Input, Card, Loading, useToast, useConfirm } from '@/components/shared';
import * as api from '@/api/endpoints';
import type { OutputLanguage } from '@/api/endpoints';
import { OUTPUT_LANGUAGE_OPTIONS } from '@/api/endpoints';
import type { Settings as SettingsType } from '@/types';

// Configuration item type definition
type FieldType = 'text' | 'password' | 'number' | 'select' | 'buttons';

interface FieldConfig {
  key: keyof typeof initialFormData;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  sensitiveField?: boolean;  // Whether it is a sensitive field (like API Key)
  lengthKey?: keyof SettingsType;  // Key used to display existing length (like api_key_length)
  options?: { value: string; label: string }[];  // Options for select type
  min?: number;
  max?: number;
}

interface SectionConfig {
  title: string;
  icon: React.ReactNode;
  fields: FieldConfig[];
}

// Initial form data
const initialFormData = {
  ai_provider_format: 'gemini' as 'openai' | 'gemini',
  api_base_url: '',
  api_key: '',
  text_model: '',
  image_model: '',
  image_caption_model: '',
  mineru_api_base: '',
  mineru_token: '',
  image_resolution: '2K',
  image_aspect_ratio: '16:9',
  max_description_workers: 5,
  max_image_workers: 8,
  output_language: 'zh' as OutputLanguage,
};

// Configuration-driven form section definition
const settingsSections: SectionConfig[] = [
  {
    title: 'LLM API Configuration',
    icon: <Key size={20} />,
    fields: [
      {
        key: 'ai_provider_format',
        label: 'AI Provider Format',
        type: 'buttons',
        description: 'Select API request format, affecting how the backend constructs and sends requests. Effective after saving.',
        options: [
          { value: 'openai', label: 'OpenAI Format' },
          { value: 'gemini', label: 'Gemini Format' },
        ],
      },
      {
        key: 'api_base_url',
        label: 'API Base URL',
        type: 'text',
        placeholder: 'https://api.example.com',
        description: 'Set the base URL for the LLM provider API',
      },
      {
        key: 'api_key',
        label: 'API Key',
        type: 'password',
        placeholder: 'Enter new API Key',
        sensitiveField: true,
        lengthKey: 'api_key_length',
        description: 'Leave blank to keep current settings, enter new value to update',
      },
    ],
  },
  {
    title: 'Model Configuration',
    icon: <FileText size={20} />,
    fields: [
      {
        key: 'text_model',
        label: 'Text Model',
        type: 'text',
        placeholder: 'Leave blank to use environment variable (e.g., gemini-2.0-flash-exp)',
        description: 'Model name used for generating outlines, descriptions, etc.',
      },
      {
        key: 'image_model',
        label: 'Image Generation Model',
        type: 'text',
        placeholder: 'Leave blank to use environment variable (e.g., imagen-3.0-generate-001)',
        description: 'Model name used for generating page images',
      },
      {
        key: 'image_caption_model',
        label: 'Image Recognition Model',
        type: 'text',
        placeholder: 'Leave blank to use environment variable (e.g., gemini-2.0-flash-exp)',
        description: 'Used to recognize images in reference files and generate descriptions',
      },
    ],
  },
  {
    title: 'MinerU Configuration',
    icon: <FileText size={20} />,
    fields: [
      {
        key: 'mineru_api_base',
        label: 'MinerU API Base',
        type: 'text',
        placeholder: 'Leave blank to use environment variable (e.g., https://mineru.net)',
        description: 'MinerU service address, used for parsing reference files',
      },
      {
        key: 'mineru_token',
        label: 'MinerU Token',
        type: 'password',
        placeholder: 'Enter new MinerU Token',
        sensitiveField: true,
        lengthKey: 'mineru_token_length',
        description: 'Leave blank to keep current settings, enter new value to update',
      },
    ],
  },
  {
    title: 'Image Generation Configuration',
    icon: <Image size={20} />,
    fields: [
      {
        key: 'image_resolution',
        label: 'Image Resolution (May not be effective for some OpenAI format relays)',
        type: 'select',
        description: 'Higher resolution generates more detailed images but takes longer',
        options: [
          { value: '1K', label: '1K (1024px)' },
          { value: '2K', label: '2K (2048px)' },
          { value: '4K', label: '4K (4096px)' },
        ],
      },
    ],
  },
  {
    title: 'Performance Configuration',
    icon: <Zap size={20} />,
    fields: [
      {
        key: 'max_description_workers',
        label: 'Max Description Workers',
        type: 'number',
        min: 1,
        max: 20,
        description: 'Max concurrent worker threads for description generation (1-20), larger is faster',
      },
      {
        key: 'max_image_workers',
        label: 'Max Image Workers',
        type: 'number',
        min: 1,
        max: 20,
        description: 'Max concurrent worker threads for image generation (1-20), larger is faster',
      },
    ],
  },
  {
    title: 'Output Language Settings',
    icon: <Globe size={20} />,
    fields: [
      {
        key: 'output_language',
        label: 'Default Output Language',
        type: 'buttons',
        description: 'Default language used when AI generates content',
        options: OUTPUT_LANGUAGE_OPTIONS,
      },
    ],
  },
];

// Settings Component - Pure embedded mode (reusable)
export const Settings: React.FC = () => {
  const { show, ToastContainer } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await api.getSettings();
      if (response.data) {
        setSettings(response.data);
        setFormData({
          ai_provider_format: response.data.ai_provider_format || 'gemini',
          api_base_url: response.data.api_base_url || '',
          api_key: '',
          image_resolution: response.data.image_resolution || '2K',
          image_aspect_ratio: response.data.image_aspect_ratio || '16:9',
          max_description_workers: response.data.max_description_workers || 5,
          max_image_workers: response.data.max_image_workers || 8,
          text_model: response.data.text_model || '',
          image_model: response.data.image_model || '',
          mineru_api_base: response.data.mineru_api_base || '',
          mineru_token: '',
          image_caption_model: response.data.image_caption_model || '',
          output_language: response.data.output_language || 'zh',
        });
      }
    } catch (error: any) {
      console.error('Failed to load settings:', error);
      show({
        message: 'Failed to load settings: ' + (error?.message || 'Unknown error'),
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { api_key, mineru_token, ...otherData } = formData;
      const payload: Parameters<typeof api.updateSettings>[0] = {
        ...otherData,
      };

      if (api_key) {
        payload.api_key = api_key;
      }

      if (mineru_token) {
        payload.mineru_token = mineru_token;
      }

      const response = await api.updateSettings(payload);
      if (response.data) {
        setSettings(response.data);
        show({ message: 'Settings saved successfully', type: 'success' });
        setFormData(prev => ({ ...prev, api_key: '', mineru_token: '' }));
      }
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      show({
        message: 'Failed to save settings: ' + (error?.response?.data?.error?.message || error?.message || 'Unknown error'),
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    confirm(
      'All configurations such as large models, image generation, and concurrency will be restored to environment defaults. Saved custom settings will be lost. Continue?',
      async () => {
        setIsSaving(true);
        try {
          const response = await api.resetSettings();
          if (response.data) {
            setSettings(response.data);
            setFormData({
              ai_provider_format: response.data.ai_provider_format || 'gemini',
              api_base_url: response.data.api_base_url || '',
              api_key: '',
              image_resolution: response.data.image_resolution || '2K',
              image_aspect_ratio: response.data.image_aspect_ratio || '16:9',
              max_description_workers: response.data.max_description_workers || 5,
              max_image_workers: response.data.max_image_workers || 8,
              text_model: response.data.text_model || '',
              image_model: response.data.image_model || '',
              mineru_api_base: response.data.mineru_api_base || '',
              mineru_token: '',
              image_caption_model: response.data.image_caption_model || '',
              output_language: response.data.output_language || 'zh',
            });
            show({ message: 'Settings reset', type: 'success' });
          }
        } catch (error: any) {
          console.error('Failed to reset settings:', error);
          show({
            message: 'Failed to reset settings: ' + (error?.message || 'Unknown error'),
            type: 'error'
          });
        } finally {
          setIsSaving(false);
        }
      },
      {
        title: 'Confirm Reset to Default',
        confirmText: 'Reset',
        cancelText: 'Cancel',
        variant: 'warning',
      }
    );
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const renderField = (field: FieldConfig) => {
    const value = formData[field.key];

    if (field.type === 'buttons' && field.options) {
      return (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label}
          </label>
          <div className="flex flex-wrap gap-2">
            {field.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleFieldChange(field.key, option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  value === option.value
                    ? option.value === 'openai'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                      : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {field.description && (
            <p className="mt-1 text-xs text-gray-500">{field.description}</p>
          )}
        </div>
      );
    }

    if (field.type === 'select' && field.options) {
      return (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label}
          </label>
          <select
            value={value as string}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="w-full h-10 px-4 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-banana-500 focus:border-transparent"
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {field.description && (
            <p className="mt-1 text-sm text-gray-500">{field.description}</p>
          )}
        </div>
      );
    }

    // text, password, number types
    const placeholder = field.sensitiveField && settings && field.lengthKey
      ? `Set (Length: ${settings[field.lengthKey]})`
      : field.placeholder || '';

    return (
      <div key={field.key}>
        <Input
          label={field.label}
          type={field.type === 'number' ? 'number' : field.type}
          placeholder={placeholder}
          value={value as string | number}
          onChange={(e) => {
            const newValue = field.type === 'number' 
              ? parseInt(e.target.value) || (field.min ?? 0)
              : e.target.value;
            handleFieldChange(field.key, newValue);
          }}
          min={field.min}
          max={field.max}
        />
        {field.description && (
          <p className="mt-1 text-sm text-gray-500">{field.description}</p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading message="Loading settings..." />
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      {ConfirmDialog}
      <div className="space-y-8">
        {/* Configuration Sections (Config Driven) */}
        <div className="space-y-8">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                {section.icon}
                <span className="ml-2">{section.title}</span>
              </h2>
              <div className="space-y-4">
                {section.fields.map((field) => renderField(field))}
                {section.title === 'LLM API Configuration' && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      Get API Key at{' '}
                      <a
                        href="https://aihubmix.com/?aff=17EC"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline font-medium"
                      >
                        AIHubmix
                      </a>
                      , reduce migration costs
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            icon={<RotateCcw size={18} />}
            onClick={handleReset}
            disabled={isSaving}
          >
            Reset to Default
          </Button>
          <Button
            variant="primary"
            icon={<Save size={18} />}
            onClick={handleSave}
            loading={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </>
  );
};

// SettingsPage Component - Full Page Wrapper
export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-banana-50 to-yellow-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-6 md:p-8">
          <div className="space-y-8">
            {/* Top Title */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-200">
              <div className="flex items-center">
                <Button
                  variant="secondary"
                  icon={<Home size={18} />}
                  onClick={() => navigate('/')}
                  className="mr-4"
                >
                  Home
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure application parameters
                  </p>
                </div>
              </div>
            </div>

            <Settings />
          </div>
        </Card>
      </div>
    </div>
  );
};
