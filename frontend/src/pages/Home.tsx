import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, FileText, FileEdit, ImagePlus, Paperclip, Palette, Lightbulb, Search, Settings } from 'lucide-react';
import { Button, Textarea, Card, useToast, MaterialGeneratorModal, ReferenceFileList, ReferenceFileSelector, FilePreviewModal, ImagePreviewList } from '@/components/shared';
import { TemplateSelector, getTemplateFile } from '@/components/shared/TemplateSelector';
import { listUserTemplates, type UserTemplate, uploadReferenceFile, type ReferenceFile, associateFileToProject, triggerFileParse, uploadMaterial, associateMaterialsToProject } from '@/api/endpoints';
import { useProjectStore } from '@/store/useProjectStore';
import { PRESET_STYLES } from '@/config/presetStyles';

type CreationType = 'idea' | 'outline' | 'description';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { initializeProject, isGlobalLoading } = useProjectStore();
  const { show, ToastContainer } = useToast();
  
  const [activeTab, setActiveTab] = useState<CreationType>('idea');
  const [content, setContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<File | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedPresetTemplateId, setSelectedPresetTemplateId] = useState<string | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isFileSelectorOpen, setIsFileSelectorOpen] = useState(false);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [useTemplateStyle, setUseTemplateStyle] = useState(false);
  const [templateStyle, setTemplateStyle] = useState('');
  const [hoveredPresetId, setHoveredPresetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if there is a current project & load user templates
  useEffect(() => {
    const projectId = localStorage.getItem('currentProjectId');
    setCurrentProjectId(projectId);
    
    // Load user template list (for on-demand File retrieval)
    const loadTemplates = async () => {
      try {
        const response = await listUserTemplates();
        if (response.data?.templates) {
          setUserTemplates(response.data.templates);
        }
      } catch (error) {
        console.error('Failed to load user templates:', error);
      }
    };
    loadTemplates();
  }, []);

  const handleOpenMaterialModal = () => {
    // Always generate global materials on the home page, not associated with any project
    setIsMaterialModalOpen(true);
  };

  // Detect paste events, automatically upload files and images
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    console.log('Paste event triggered');
    const items = e.clipboardData?.items;
    if (!items) {
      console.log('No clipboard items');
      return;
    }

    console.log('Clipboard items:', items.length);
    
    // Check for files or images
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`Item ${i}:`, { kind: item.kind, type: item.type });
      
      if (item.kind === 'file') {
        const file = item.getAsFile();
        console.log('Got file:', file);
        
        if (file) {
          console.log('File details:', { name: file.name, type: file.type, size: file.size });
          
          // Check if it is an image
          if (file.type.startsWith('image/')) {
            console.log('Image detected, uploading...');
            e.preventDefault(); // Prevent default paste behavior
            await handleImageUpload(file);
            return;
          }
          
          // Check file type (reference file)
          const allowedExtensions = ['pdf', 'docx', 'pptx', 'doc', 'ppt', 'xlsx', 'xls', 'csv', 'txt', 'md'];
          const fileExt = file.name.split('.').pop()?.toLowerCase();
          
          console.log('File extension:', fileExt);
          
          if (fileExt && allowedExtensions.includes(fileExt)) {
            console.log('File type allowed, uploading...');
            e.preventDefault(); // Prevent default paste behavior
            await handleFileUpload(file);
          } else {
            console.log('File type not allowed');
            show({ message: `Unsupported file type: ${fileExt}`, type: 'info' });
          }
        }
      }
    }
  };

  // Upload image
  // On the Home page, images are always uploaded as global materials (not associated with a project) because there is no project yet
  const handleImageUpload = async (file: File) => {
    if (isUploadingFile) return;

    setIsUploadingFile(true);
    try {
      // Show uploading prompt
      show({ message: 'Uploading image...', type: 'info' });
      
      // Save current cursor position
      const cursorPosition = textareaRef.current?.selectionStart || content.length;
      
      // Upload image to material library (global material)
      const response = await uploadMaterial(file, null);
      
      if (response?.data?.url) {
        const imageUrl = response.data.url;
        
        // Generate markdown image link
        const markdownImage = `![image](${imageUrl})`;
        
        // Insert image link at cursor position
        setContent(prev => {
          const before = prev.slice(0, cursorPosition);
          const after = prev.slice(cursorPosition);
          
          // If there is content before the cursor and it doesn't end with a newline, add a newline
          const prefix = before && !before.endsWith('\n') ? '\n' : '';
          // If there is content after the cursor and it doesn't start with a newline, add a newline
          const suffix = after && !after.startsWith('\n') ? '\n' : '';
          
          return before + prefix + markdownImage + suffix + after;
        });
        
        // Restore cursor position (move to after the inserted content)
        setTimeout(() => {
          if (textareaRef.current) {
            const newPosition = cursorPosition + (content.slice(0, cursorPosition) && !content.slice(0, cursorPosition).endsWith('\n') ? 1 : 0) + markdownImage.length;
            textareaRef.current.selectionStart = newPosition;
            textareaRef.current.selectionEnd = newPosition;
            textareaRef.current.focus();
          }
        }, 0);
        
        show({ message: 'Image uploaded successfully! Inserted at cursor position', type: 'success' });
      } else {
        show({ message: 'Image upload failed: No image info returned', type: 'error' });
      }
    } catch (error: any) {
      console.error('Image upload failed:', error);
      show({ 
        message: `Image upload failed: ${error?.response?.data?.error?.message || error.message || 'Unknown error'}`, 
        type: 'error' 
      });
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Upload file
  // On the Home page, files are always uploaded as global files (not associated with a project) because there is no project yet
  const handleFileUpload = async (file: File) => {
    if (isUploadingFile) return;

    // Check file size (frontend pre-check)
    const maxSize = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSize) {
      show({ 
        message: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB, max support 200MB`, 
        type: 'error' 
      });
      return;
    }

    // Check if it is a PPT file, suggest using PDF
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt === 'ppt' || fileExt === 'pptx') 
      show({  message: '💡 Tip: Converting PPT to PDF format for upload is recommended for better parsing results',    type: 'info' });
    
    setIsUploadingFile(true);
    try {
      // On the Home page, always upload as global file
      const response = await uploadReferenceFile(file, null);
      if (response?.data?.file) {
        const uploadedFile = response.data.file;
        setReferenceFiles(prev => [...prev, uploadedFile]);
        show({ message: 'File uploaded successfully', type: 'success' });
        
        // If file status is pending, trigger parsing automatically
        if (uploadedFile.parse_status === 'pending') {
          try {
            const parseResponse = await triggerFileParse(uploadedFile.id);
            // Update status using the file object returned by the parsing interface
            if (parseResponse?.data?.file) {
              const parsedFile = parseResponse.data.file;
              setReferenceFiles(prev => 
                prev.map(f => f.id === uploadedFile.id ? parsedFile : f)
              );
            } else {
              // If no file object returned, manually update status to parsing (async thread will update later)
              setReferenceFiles(prev => 
                prev.map(f => f.id === uploadedFile.id ? { ...f, parse_status: 'parsing' as const } : f)
              );
            }
          } catch (parseError: any) {
            console.error('Failed to trigger file parsing:', parseError);
            // Parsing trigger failure does not affect upload success prompt
          }
        }
      } else {
        show({ message: 'File upload failed: No file info returned', type: 'error' });
      }
    } catch (error: any) {
      console.error('File upload failed:', error);
      
      // Special handling for 413 error
      if (error?.response?.status === 413) {
        show({ 
          message: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB, max support 200MB`, 
          type: 'error' 
        });
      } else {
        show({ 
          message: `File upload failed: ${error?.response?.data?.error?.message || error.message || 'Unknown error'}`, 
          type: 'error' 
        });
      }
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Remove file reference from current project (does not delete file itself)
  const handleFileRemove = (fileId: string) => {
    setReferenceFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // File status change callback
  const handleFileStatusChange = (updatedFile: ReferenceFile) => {
    setReferenceFiles(prev => 
      prev.map(f => f.id === updatedFile.id ? updatedFile : f)
    );
  };

  // Click paperclip button - Open file selector
  const handlePaperclipClick = () => {
    setIsFileSelectorOpen(true);
  };

  // Callback after files selected from selector
  const handleFilesSelected = (selectedFiles: ReferenceFile[]) => {
    // Merge new files into list (deduplicate)
    setReferenceFiles(prev => {
      const existingIds = new Set(prev.map(f => f.id));
      const newFiles = selectedFiles.filter(f => !existingIds.has(f.id));
      // When merging, if file already exists, update its status (parsing status might have changed)
      const updated = prev.map(f => {
        const updatedFile = selectedFiles.find(sf => sf.id === f.id);
        return updatedFile || f;
      });
      return [...updated, ...newFiles];
    });
    show({ message: `Added ${selectedFiles.length} reference files`, type: 'success' });
  };

  // Get list of currently selected file IDs to pass to selector (use useMemo to avoid recalculation on every render)
  const selectedFileIds = useMemo(() => {
    return referenceFiles.map(f => f.id);
  }, [referenceFiles]);

  // Remove specified image markdown link from editor content
  const handleRemoveImage = (imageUrl: string) => {
    setContent(prev => {
      // Remove all markdown image links matching the URL
      const imageRegex = new RegExp(`!\\[[^\\]]*\\]\\(${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
      let newContent = prev.replace(imageRegex, '');
      
      // Clean up extra empty lines (keep at most one empty line)
      newContent = newContent.replace(/\n{3,}/g, '\n\n');
      
      return newContent.trim();
    });
    
    show({ message: 'Image removed', type: 'success' });
  };

  // File selection change
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      await handleFileUpload(files[i]);
    }

    // Clear input to allow re-selecting the same file
    e.target.value = '';
  };

  const tabConfig = {
    idea: {
      icon: <Sparkles size={20} />,
      label: 'Idea to PPT',
      placeholder: 'E.g., Generate a presentation about the history of AI development',
      description: 'Enter your idea, and AI will generate a complete PPT for you',
    },
    outline: {
      icon: <FileText size={20} />,
      label: 'Outline to PPT',
      placeholder: 'Paste your PPT outline...\n\nExample:\nPart 1: The Origin of AI\n- The beginning of the 1950s\n- The Dartmouth Conference\n\nPart 2: Development History\n...',
      description: 'Have an outline? Paste it directly to generate quickly, AI will automatically split it into a structured outline',
    },
    description: {
      icon: <FileEdit size={20} />,
      label: 'Description to PPT',
      placeholder: 'Paste your complete page descriptions...\n\nExample:\nPage 1\nTitle: The Birth of Artificial Intelligence\nContent: In 1950, Turing proposed the "Turing Test"...\n\nPage 2\nTitle: History of AI Development\nContent: 1950s: Symbolism...\n...',
      description: 'Have a complete description? AI will automatically parse the outline and split it into page descriptions, generating images directly',
    },
  };

  const handleTemplateSelect = async (templateFile: File | null, templateId?: string) => {
    // Always set file (if provided)
    if (templateFile) {
      setSelectedTemplate(templateFile);
    }
    
    // Handle template ID
    if (templateId) {
      // Determine if it is a user template or a preset template
      // Preset template IDs are usually short strings like '1', '2', '3'
      // User template IDs are usually long (UUID format)
      if (templateId.length <= 3 && /^\d+$/.test(templateId)) {
        // Preset template
        setSelectedPresetTemplateId(templateId);
        setSelectedTemplateId(null);
      } else {
        // User template
        setSelectedTemplateId(templateId);
        setSelectedPresetTemplateId(null);
      }
    } else {
      // If no templateId, it might be a directly uploaded file
      // Clear all selection states
      setSelectedTemplateId(null);
      setSelectedPresetTemplateId(null);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      show({ message: 'Please enter content', type: 'error' });
      return;
    }

    // Check if there are files currently parsing
    const parsingFiles = referenceFiles.filter(f => 
      f.parse_status === 'pending' || f.parse_status === 'parsing'
    );
    if (parsingFiles.length > 0) {
      show({ 
        message: `${parsingFiles.length} reference files are still parsing, please wait for completion`, 
        type: 'info' 
      });
      return;
    }

    try {
      // If there is a template ID but no File, load on demand
      let templateFile = selectedTemplate;
      if (!templateFile && (selectedTemplateId || selectedPresetTemplateId)) {
        const templateId = selectedTemplateId || selectedPresetTemplateId;
        if (templateId) {
          templateFile = await getTemplateFile(templateId, userTemplates);
        }
      }
      
      // Pass style description (pass as long as there is content, regardless of switch state)
      const styleDesc = templateStyle.trim() ? templateStyle.trim() : undefined;
      
      await initializeProject(activeTab, content, templateFile || undefined, styleDesc);
      
      // Navigate to different pages based on type
      const projectId = localStorage.getItem('currentProjectId');
      if (!projectId) {
        show({ message: 'Failed to create project', type: 'error' });
        return;
      }
      
      // Associate reference files to project
      if (referenceFiles.length > 0) {
        console.log(`Associating ${referenceFiles.length} reference files to project ${projectId}:`, referenceFiles);
        try {
          // Batch update file project_id
          const results = await Promise.all(
            referenceFiles.map(async file => {
              const response = await associateFileToProject(file.id, projectId);
              console.log(`Associated file ${file.id}:`, response);
              return response;
            })
          );
          console.log('Reference files associated successfully:', results);
        } catch (error) {
          console.error('Failed to associate reference files:', error);
          // Do not affect main flow, continue execution
        }
      } else {
        console.log('No reference files to associate');
      }
      
      // Associate image materials to project (parse markdown image links in content)
      const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      const materialUrls: string[] = [];
      let match;
      while ((match = imageRegex.exec(content)) !== null) {
        materialUrls.push(match[2]); // match[2] is URL
      }
      
      if (materialUrls.length > 0) {
        console.log(`Associating ${materialUrls.length} materials to project ${projectId}:`, materialUrls);
        try {
          const response = await associateMaterialsToProject(projectId, materialUrls);
          console.log('Materials associated successfully:', response);
        } catch (error) {
          console.error('Failed to associate materials:', error);
          // Do not affect main flow, continue execution
        }
      } else {
        console.log('No materials to associate');
      }
      
      if (activeTab === 'idea' || activeTab === 'outline') {
        navigate(`/project/${projectId}/outline`);
      } else if (activeTab === 'description') {
        // Description generation: Jump directly to description generation page (because outline and description are already automatically generated)
        navigate(`/project/${projectId}/detail`);
      }
    } catch (error: any) {
      console.error('Failed to create project:', error);
      // Errors are already handled and displayed in store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50/30 to-pink-50/50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-banana-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-yellow-400/5 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative h-16 md:h-18 bg-white/40 backdrop-blur-2xl">

        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="Banana Slides Logo"
                className="h-10 md:h-12 w-auto rounded-lg object-contain"
              />
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-banana-600 via-orange-500 to-pink-500 bg-clip-text text-transparent">
              Banana Slides
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {/* Desktop: Material generation button with text */}
            <Button
              variant="ghost"
              size="sm"
              icon={<ImagePlus size={16} className="md:w-[18px] md:h-[18px]" />}
              onClick={handleOpenMaterialModal}
              className="hidden sm:inline-flex hover:bg-banana-100/60 hover:shadow-sm hover:scale-105 transition-all duration-200 font-medium"
            >
              <span className="hidden md:inline">Generate Material</span>
            </Button>
            {/* Mobile: Material generation button icon only */}
            <Button
              variant="ghost"
              size="sm"
              icon={<ImagePlus size={16} />}
              onClick={handleOpenMaterialModal}
              className="sm:hidden hover:bg-banana-100/60 hover:shadow-sm hover:scale-105 transition-all duration-200"
              title="Generate Material"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/history')}
              className="text-xs md:text-sm hover:bg-banana-100/60 hover:shadow-sm hover:scale-105 transition-all duration-200 font-medium"
            >
              <span className="hidden sm:inline">History</span>
              <span className="sm:hidden">History</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Settings size={16} className="md:w-[18px] md:h-[18px]" />}
              onClick={() => navigate('/settings')}
              className="text-xs md:text-sm hover:bg-banana-100/60 hover:shadow-sm hover:scale-105 transition-all duration-200 font-medium"
            >
              <span className="hidden md:inline">Settings</span>
              <span className="sm:hidden">Set</span>
            </Button>
            <Button variant="ghost" size="sm" className="hidden md:inline-flex hover:bg-banana-50/50">Help</Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative max-w-5xl mx-auto px-3 md:px-4 py-8 md:py-12">
        {/* Hero Title Area */}
        <div className="text-center mb-10 md:mb-16 space-y-4 md:space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-banana-200/50 shadow-sm mb-4">
            <span className="text-2xl animate-pulse"><Sparkles size={20} color="orange" /></span>
            <span className="text-sm font-medium text-gray-700">Native AI PPT Generator based on nano banana pro🍌</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
            <span className="bg-gradient-to-r from-yellow-600 via-orange-500 to-pink-500 bg-clip-text text-transparent" style={{
              backgroundSize: '200% auto',
              animation: 'gradient 3s ease infinite',
            }}>
              Banana Slides
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-light">
            Vibe your PPT like vibing code
          </p>

          {/* Feature Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 pt-4">
            {[
              { icon: <Sparkles size={14} className="text-yellow-600" />, label: 'One-sentence PPT Generation' },
              { icon: <FileEdit size={14} className="text-blue-500" />, label: 'Natural Language Editing' },
              { icon: <Search size={14} className="text-orange-500" />, label: 'Region-specific Editing' },
              
              { icon: <Paperclip size={14} className="text-green-600" />, label: 'One-click Export PPTX/PDF' },
            ].map((feature, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/70 backdrop-blur-sm rounded-full text-xs md:text-sm text-gray-700 border border-gray-200/50 shadow-sm hover:shadow-md transition-all hover:scale-105 cursor-default"
              >
                {feature.icon}
                {feature.label}
              </span>
            ))}
          </div>
        </div>

        {/* Creation Card */}
        <Card className="p-4 md:p-10 bg-white/90 backdrop-blur-xl shadow-2xl border-0 hover:shadow-3xl transition-all duration-300">
          {/* Tabs */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6 md:mb-8">
            {(Object.keys(tabConfig) as CreationType[]).map((type) => {
              const config = tabConfig[type];
              return (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3 rounded-lg font-medium transition-all text-sm md:text-base touch-manipulation ${
                    activeTab === type
                      ? 'bg-gradient-to-r from-banana-500 to-banana-600 text-black shadow-yellow'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-banana-50 active:bg-banana-100'
                  }`}
                >
                  <span className="scale-90 md:scale-100">{config.icon}</span>
                  <span className="truncate">{config.label}</span>
                </button>
              );
            })}
          </div>

          {/* Description */}
          <div className="relative">
            <p className="text-sm md:text-base mb-4 md:mb-6 leading-relaxed">
              <span className="inline-flex items-center gap-2 text-gray-600">
                <Lightbulb size={16} className="text-banana-600 flex-shrink-0" />
                <span className="font-semibold">
                  {tabConfig[activeTab].description}
                </span>
              </span>
            </p>
          </div>

          {/* Input Area - With Buttons */}
          <div className="relative mb-2 group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-banana-400 to-orange-400 rounded-lg opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
            <Textarea
              ref={textareaRef}
              placeholder={tabConfig[activeTab].placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handlePaste}
              rows={activeTab === 'idea' ? 4 : 8}
              className="relative pr-20 md:pr-28 pb-12 md:pb-14 text-sm md:text-base border-2 border-gray-200 focus:border-banana-400 transition-colors duration-200" // Leave space for buttons in bottom right
            />

            {/* Bottom Left: Upload File Button (Paperclip Icon) */}
            <button
              type="button"
              onClick={handlePaperclipClick}
              className="absolute left-2 md:left-3 bottom-2 md:bottom-3 z-10 p-1.5 md:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors active:scale-95 touch-manipulation"
              title="Select reference file"
            >
              <Paperclip size={18} className="md:w-5 md:h-5" />
            </button>

            {/* Bottom Right: Start Generating Button */}
            <div className="absolute right-2 md:right-3 bottom-2 md:bottom-3 z-10">
              <Button
                size="sm"
                onClick={handleSubmit}
                loading={isGlobalLoading}
                disabled={
                  !content.trim() || 
                  referenceFiles.some(f => f.parse_status === 'pending' || f.parse_status === 'parsing')
                }
                className="shadow-sm text-xs md:text-sm px-3 md:px-4"
              >
                {referenceFiles.some(f => f.parse_status === 'pending' || f.parse_status === 'parsing')
                  ? 'Parsing...'
                  : 'Next'}
              </Button>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Image Preview List */}
          <ImagePreviewList
            content={content}
            onRemoveImage={handleRemoveImage}
            className="mb-4"
          />

          <ReferenceFileList
            files={referenceFiles}
            onFileClick={setPreviewFileId}
            onFileDelete={handleFileRemove}
            onFileStatusChange={handleFileStatusChange}
            deleteMode="remove"
            className="mb-4"
          />

          {/* Template Selection */}
          <div className="mb-6 md:mb-8 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <Palette size={18} className="text-orange-600 flex-shrink-0" />
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  Select Style Template
                </h3>
              </div>
              {/* No Template Image Mode Switch */}
              <label className="flex items-center gap-2 cursor-pointer group">
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  Use Text Description for Style
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={useTemplateStyle}
                    onChange={(e) => {
                      setUseTemplateStyle(e.target.checked);
                      // Clear template selection when switching to no template image mode
                      if (e.target.checked) {
                        setSelectedTemplate(null);
                        setSelectedTemplateId(null);
                        setSelectedPresetTemplateId(null);
                      }
                      // Do not clear style description, allow user to keep entered content
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-banana-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-banana-500"></div>
                </div>
              </label>
            </div>
            
            {/* Show different content based on mode */}
            {useTemplateStyle ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Describe your desired PPT style, e.g., Minimalist business style, using blue and white color scheme, clear and generous fonts..."
                  value={templateStyle}
                  onChange={(e) => setTemplateStyle(e.target.value)}
                  rows={3}
                  className="text-sm border-2 border-gray-200 focus:border-banana-400 transition-colors duration-200"
                />
                
                {/* Preset Style Buttons */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">
                    Quick Select Preset Style:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_STYLES.map((preset) => (
                      <div key={preset.id} className="relative">
                        <button
                          type="button"
                          onClick={() => setTemplateStyle(preset.description)}
                          onMouseEnter={() => setHoveredPresetId(preset.id)}
                          onMouseLeave={() => setHoveredPresetId(null)}
                          className="px-3 py-1.5 text-xs font-medium rounded-full border-2 border-gray-200 hover:border-banana-400 hover:bg-banana-50 transition-all duration-200 hover:shadow-sm"
                        >
                          {preset.name}
                        </button>
                        
                        {/* Show preview image on hover */}
                        {hoveredPresetId === preset.id && preset.previewImage && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="bg-white rounded-lg shadow-2xl border-2 border-banana-400 p-2.5 w-72">
                              <img
                                src={preset.previewImage}
                                alt={preset.name}
                                className="w-full h-40 object-cover rounded"
                                onError={(e) => {
                                  // Hide preview if image fails to load
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <p className="text-xs text-gray-600 mt-2 px-1 line-clamp-3">
                                {preset.description}
                              </p>
                            </div>
                            {/* Triangle indicator */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                              <div className="w-3 h-3 bg-white border-r-2 border-b-2 border-banana-400 transform rotate-45"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">
                  💡 Tip: Click preset style to quick fill, or customize style description, color scheme, layout requirements, etc.
                </p>
              </div>
            ) : (
              <TemplateSelector
                onSelect={handleTemplateSelect}
                selectedTemplateId={selectedTemplateId}
                selectedPresetTemplateId={selectedPresetTemplateId}
                showUpload={true} // Uploaded templates on home page are saved to user template library
                projectId={currentProjectId}
              />
            )}
          </div>

        </Card>
      </main>
      <ToastContainer />
      {/* Material Generation Modal - Always generate global materials on home page */}
      <MaterialGeneratorModal
        projectId={null}
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
      />
      {/* Reference File Selector */}
      {/* On Home page, always query global files because there is no project yet */}
      <ReferenceFileSelector
        projectId={null}
        isOpen={isFileSelectorOpen}
        onClose={() => setIsFileSelectorOpen(false)}
        onSelect={handleFilesSelected}
        multiple={true}
        initialSelectedIds={selectedFileIds}
      />
      
      <FilePreviewModal fileId={previewFileId} onClose={() => setPreviewFileId(null)} />
    </div>
  );
};
