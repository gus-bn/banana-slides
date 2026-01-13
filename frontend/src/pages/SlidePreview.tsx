// TODO: split components
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Home,
  ArrowLeft,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Upload,
  Image as ImageIcon,
  ImagePlus,
  Settings,
  CheckSquare,
  Square,
  Check,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button, Loading, Modal, Textarea, useToast, useConfirm, MaterialSelector, Markdown, ProjectSettingsModal, ExportTasksPanel } from '@/components/shared';
import { MaterialGeneratorModal } from '@/components/shared/MaterialGeneratorModal';
import { TemplateSelector, getTemplateFile } from '@/components/shared/TemplateSelector';
import { listUserTemplates, type UserTemplate } from '@/api/endpoints';
import { materialUrlToFile } from '@/components/shared/MaterialSelector';
import type { Material } from '@/api/endpoints';
import { SlideCard } from '@/components/preview/SlideCard';
import { useProjectStore } from '@/store/useProjectStore';
import { useExportTasksStore, type ExportTaskType } from '@/store/useExportTasksStore';
import { getImageUrl } from '@/api/client';
import { getPageImageVersions, setCurrentImageVersion, updateProject, uploadTemplate, exportPPTX as apiExportPPTX, exportPDF as apiExportPDF, exportEditablePPTX as apiExportEditablePPTX } from '@/api/endpoints';
import type { ImageVersion, DescriptionContent, ExportExtractorMethod, ExportInpaintMethod } from '@/types';
import { normalizeErrorMessage } from '@/utils';

export const SlidePreview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const fromHistory = (location.state as any)?.from === 'history';
  const {
    currentProject,
    syncProject,
    generateImages,
    editPageImage,
    deletePageById,
    isGlobalLoading,
    taskProgress,
    pageGeneratingTasks,
  } = useProjectStore();
  
  const { addTask, pollTask: pollExportTask, tasks: exportTasks, restoreActiveTasks } = useExportTasksStore();

  // Restore ongoing export tasks on mount (after page refresh)
  useEffect(() => {
    restoreActiveTasks();
  }, [restoreActiveTasks]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showExportTasksPanel, setShowExportTasksPanel] = useState(false);
  // Multi-select export related states
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [isOutlineExpanded, setIsOutlineExpanded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [imageVersions, setImageVersions] = useState<ImageVersion[]>([]);
  const [showVersionMenu, setShowVersionMenu] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedPresetTemplateId, setSelectedPresetTemplateId] = useState<string | null>(null);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [selectedContextImages, setSelectedContextImages] = useState<{
    useTemplate: boolean;
    descImageUrls: string[];
    uploadedFiles: File[];
  }>({
    useTemplate: false,
    descImageUrls: [],
    uploadedFiles: [],
  });
  const [extraRequirements, setExtraRequirements] = useState<string>('');
  const [isSavingRequirements, setIsSavingRequirements] = useState(false);
  const isEditingRequirements = useRef(false); // Track if user is editing extra requirements
  const [templateStyle, setTemplateStyle] = useState<string>('');
  const [isSavingTemplateStyle, setIsSavingTemplateStyle] = useState(false);
  const isEditingTemplateStyle = useRef(false); // Track if user is editing style description
  const lastProjectId = useRef<string | null>(null); // Track last project ID
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  // Material generator modal switch (reusable module, just entry here)
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  // Material selector modal switch
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [isMaterialSelectorOpen, setIsMaterialSelectorOpen] = useState(false);
  // Export settings
  const [exportExtractorMethod, setExportExtractorMethod] = useState<ExportExtractorMethod>(
    (currentProject?.export_extractor_method as ExportExtractorMethod) || 'hybrid'
  );
  const [exportInpaintMethod, setExportInpaintMethod] = useState<ExportInpaintMethod>(
    (currentProject?.export_inpaint_method as ExportInpaintMethod) || 'hybrid'
  );
  const [isSavingExportSettings, setIsSavingExportSettings] = useState(false);
  // Per-page edit parameters cache (cached in session, for easy re-execution)
  const [editContextByPage, setEditContextByPage] = useState<Record<string, {
    prompt: string;
    contextImages: {
      useTemplate: boolean;
      descImageUrls: string[];
      uploadedFiles: File[];
    };
  }>>({});

  // Preview image rectangle selection state (inside edit modal)
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isRegionSelectionMode, setIsRegionSelectionMode] = useState(false);
  const [isSelectingRegion, setIsSelectingRegion] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const { show, ToastContainer } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  // Memoize pages with generated images to avoid re-computing in multiple places
  const pagesWithImages = useMemo(() => {
    return currentProject?.pages.filter(p => p.id && p.generated_image_path) || [];
  }, [currentProject?.pages]);

  // Load project data & user templates
  useEffect(() => {
    if (projectId && (!currentProject || currentProject.id !== projectId)) {
      // Directly use projectId to sync project data
      syncProject(projectId);
    }
    
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
  }, [projectId, currentProject, syncProject]);

  // After project load, initialize extra requirements and template style
  // Only initialize on first load or when projectId changes to avoid overwriting user input
  useEffect(() => {
    if (currentProject) {
      // Check if it's a new project
      const isNewProject = lastProjectId.current !== currentProject.id;
      
      if (isNewProject) {
        // New project, initialize extra requirements and style description
        setExtraRequirements(currentProject.extra_requirements || '');
        setTemplateStyle(currentProject.template_style || '');
        // Initialize export settings
        setExportExtractorMethod((currentProject.export_extractor_method as ExportExtractorMethod) || 'hybrid');
        setExportInpaintMethod((currentProject.export_inpaint_method as ExportInpaintMethod) || 'hybrid');
        lastProjectId.current = currentProject.id || null;
        isEditingRequirements.current = false;
        isEditingTemplateStyle.current = false;
      } else {
        // Same project and user is not editing, can update (e.g. sync back from server)
        if (!isEditingRequirements.current) {
          setExtraRequirements(currentProject.extra_requirements || '');
        }
        if (!isEditingTemplateStyle.current) {
          setTemplateStyle(currentProject.template_style || '');
        }
      }
      // If user is editing, do not update local state
    }
  }, [currentProject?.id, currentProject?.extra_requirements, currentProject?.template_style]);

  // Load history versions for current page
  useEffect(() => {
    const loadVersions = async () => {
      if (!currentProject || !projectId || selectedIndex < 0 || selectedIndex >= currentProject.pages.length) {
        setImageVersions([]);
        setShowVersionMenu(false);
        return;
      }

      const page = currentProject.pages[selectedIndex];
      if (!page?.id) {
        setImageVersions([]);
        setShowVersionMenu(false);
        return;
      }

      try {
        const response = await getPageImageVersions(projectId, page.id);
        if (response.data?.versions) {
          setImageVersions(response.data.versions);
        }
      } catch (error) {
        console.error('Failed to load image versions:', error);
        setImageVersions([]);
      }
    };

    loadVersions();
  }, [currentProject, selectedIndex, projectId]);

  const handleGenerateAll = async () => {
    const pageIds = getSelectedPageIdsForExport();
    const isPartialGenerate = isMultiSelectMode && selectedPageIds.size > 0;
    
    // 检查要生成的页面中是否有已有图片的
    const pagesToGenerate = isPartialGenerate
      ? currentProject?.pages.filter(p => p.id && selectedPageIds.has(p.id))
      : currentProject?.pages;
    const hasImages = pagesToGenerate?.some((p) => p.generated_image_path);
    
    const executeGenerate = async () => {
      await generateImages(pageIds);
    };
    
    if (hasImages) {
      const message = isPartialGenerate
        ? `Will regenerate the selected ${selectedPageIds.size} pages (history will be saved). Continue?`
        : 'Will regenerate all pages (history will be saved). Continue?';
      confirm(
        message,
        executeGenerate,
        { title: 'Confirm Regenerate', variant: 'warning' }
      );
    } else {
      await executeGenerate();
    }
  };

  const handleRegeneratePage = useCallback(async () => {
    if (!currentProject) return;
    const page = currentProject.pages[selectedIndex];
    if (!page.id) return;
    
    // If the page is already generating, do not resubmit
    if (pageGeneratingTasks[page.id]) {
      show({ message: 'This page is generating, please wait...', type: 'info' });
      return;
    }
    
    try {
      // Use unified generateImages, passing a single page ID
      await generateImages([page.id]);
      show({ message: 'Started generating image, please wait...', type: 'success' });
    } catch (error: any) {
      // Extract more specific error message from backend
      let errorMessage = 'Generation failed';
      const respData = error?.response?.data;

      if (respData) {
        if (respData.error?.message) {
          errorMessage = respData.error.message;
        } else if (respData.message) {
          errorMessage = respData.message;
        } else if (respData.error) {
          errorMessage =
            typeof respData.error === 'string'
              ? respData.error
              : respData.error.message || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // 使用统一的错误消息规范化函数
      errorMessage = normalizeErrorMessage(errorMessage);

      show({
        message: errorMessage,
        type: 'error',
      });
    }
  }, [currentProject, selectedIndex, pageGeneratingTasks, generateImages, show]);

  const handleSwitchVersion = async (versionId: string) => {
    if (!currentProject || !selectedPage?.id || !projectId) return;
    
    try {
      await setCurrentImageVersion(projectId, selectedPage.id, versionId);
      await syncProject(projectId);
      setShowVersionMenu(false);
      show({ message: 'Switched to this version', type: 'success' });
    } catch (error: any) {
      show({ 
        message: `Switch failed: ${error.message || 'Unknown error'}`, 
        type: 'error' 
      });
    }
  };

  // 从描述内容中提取图片URL
  const extractImageUrlsFromDescription = (descriptionContent: DescriptionContent | undefined): string[] => {
    if (!descriptionContent) return [];
    
    // 处理两种格式
    let text: string = '';
    if ('text' in descriptionContent) {
      text = descriptionContent.text as string;
    } else if ('text_content' in descriptionContent && Array.isArray(descriptionContent.text_content)) {
      text = descriptionContent.text_content.join('\n');
    }
    
    if (!text) return [];
    
    // 匹配 markdown 图片语法: ![](url) 或 ![alt](url)
    const pattern = /!\[.*?\]\((.*?)\)/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    
    while ((match = pattern.exec(text)) !== null) {
      const url = match[1]?.trim();
      // 只保留有效的HTTP/HTTPS URL
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        matches.push(url);
      }
    }
    
    return matches;
  };

  const handleEditPage = () => {
    if (!currentProject) return;
    const page = currentProject.pages[selectedIndex];
    const pageId = page?.id;

    setIsOutlineExpanded(false);
    setIsDescriptionExpanded(false);

    if (pageId && editContextByPage[pageId]) {
      // 恢复该页上次编辑的内容和图片选择
      const cached = editContextByPage[pageId];
      setEditPrompt(cached.prompt);
      setSelectedContextImages({
        useTemplate: cached.contextImages.useTemplate,
        descImageUrls: [...cached.contextImages.descImageUrls],
        uploadedFiles: [...cached.contextImages.uploadedFiles],
      });
    } else {
      // 首次编辑该页，使用默认值
      setEditPrompt('');
      setSelectedContextImages({
        useTemplate: false,
        descImageUrls: [],
        uploadedFiles: [],
      });
    }

    // 打开编辑弹窗时，清空上一次的选区和模式
    setIsRegionSelectionMode(false);
    setSelectionStart(null);
    setSelectionRect(null);
    setIsSelectingRegion(false);

    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = useCallback(async () => {
    if (!currentProject || !editPrompt.trim()) return;
    
    const page = currentProject.pages[selectedIndex];
    if (!page.id) return;

    // 调用后端编辑接口
    await editPageImage(
      page.id,
      editPrompt,
      {
        useTemplate: selectedContextImages.useTemplate,
        descImageUrls: selectedContextImages.descImageUrls,
        uploadedFiles: selectedContextImages.uploadedFiles.length > 0 
          ? selectedContextImages.uploadedFiles 
          : undefined,
      }
    );

    // 缓存当前页的编辑上下文，便于后续快速重复执行
    setEditContextByPage((prev) => ({
      ...prev,
      [page.id!]: {
        prompt: editPrompt,
        contextImages: {
          useTemplate: selectedContextImages.useTemplate,
          descImageUrls: [...selectedContextImages.descImageUrls],
          uploadedFiles: [...selectedContextImages.uploadedFiles],
        },
      },
    }));

    setIsEditModalOpen(false);
  }, [currentProject, selectedIndex, editPrompt, selectedContextImages, editPageImage]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedContextImages((prev) => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...files],
    }));
  };

  const removeUploadedFile = (index: number) => {
    setSelectedContextImages((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index),
    }));
  };

  const handleSelectMaterials = async (materials: Material[]) => {
    try {
      // 将选中的素材转换为File对象并添加到上传列表
      const files = await Promise.all(
        materials.map((material) => materialUrlToFile(material))
      );
      setSelectedContextImages((prev) => ({
        ...prev,
        uploadedFiles: [...prev.uploadedFiles, ...files],
      }));
      show({ message: `Added ${materials.length} materials`, type: 'success' });
    } catch (error: any) {
      console.error('Failed to load materials:', error);
      show({
        message: 'Failed to load materials: ' + (error.message || 'Unknown error'),
        type: 'error',
      });
    }
  };

  // 编辑弹窗打开时，实时把输入与图片选择写入缓存（前端会话内）
  useEffect(() => {
    if (!isEditModalOpen || !currentProject) return;
    const page = currentProject.pages[selectedIndex];
    const pageId = page?.id;
    if (!pageId) return;

    setEditContextByPage((prev) => ({
      ...prev,
      [pageId]: {
        prompt: editPrompt,
        contextImages: {
          useTemplate: selectedContextImages.useTemplate,
          descImageUrls: [...selectedContextImages.descImageUrls],
          uploadedFiles: [...selectedContextImages.uploadedFiles],
        },
      },
    }));
  }, [isEditModalOpen, currentProject, selectedIndex, editPrompt, selectedContextImages]);

  // ========== 预览图矩形选择相关逻辑（编辑弹窗内） ==========
  const handleSelectionMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRegionSelectionMode || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    setIsSelectingRegion(true);
    setSelectionStart({ x, y });
    setSelectionRect(null);
  };

  const handleSelectionMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRegionSelectionMode || !isSelectingRegion || !selectionStart || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clampedX = Math.max(0, Math.min(x, rect.width));
    const clampedY = Math.max(0, Math.min(y, rect.height));

    const left = Math.min(selectionStart.x, clampedX);
    const top = Math.min(selectionStart.y, clampedY);
    const width = Math.abs(clampedX - selectionStart.x);
    const height = Math.abs(clampedY - selectionStart.y);

    setSelectionRect({ left, top, width, height });
  };

  const handleSelectionMouseUp = async () => {
    if (!isRegionSelectionMode || !isSelectingRegion || !selectionRect || !imageRef.current) {
      setIsSelectingRegion(false);
      setSelectionStart(null);
      return;
    }

    // 结束拖拽，但保留选中的矩形，直到用户手动退出区域选图模式
    setIsSelectingRegion(false);
    setSelectionStart(null);

    try {
      const img = imageRef.current;
      const { left, top, width, height } = selectionRect;
      if (width < 10 || height < 10) {
        // 选区太小，忽略
        return;
      }

      // 将选区从展示尺寸映射到原始图片尺寸
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      const displayWidth = img.clientWidth;
      const displayHeight = img.clientHeight;

      if (!naturalWidth || !naturalHeight || !displayWidth || !displayHeight) return;

      const scaleX = naturalWidth / displayWidth;
      const scaleY = naturalHeight / displayHeight;

      const sx = left * scaleX;
      const sy = top * scaleY;
      const sWidth = width * scaleX;
      const sHeight = height * scaleY;

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(sWidth));
      canvas.height = Math.max(1, Math.round(sHeight));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        ctx.drawImage(
          img,
          sx,
          sy,
          sWidth,
          sHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );

        canvas.toBlob((blob) => {
          if (!blob) return;
          const file = new File([blob], `crop-${Date.now()}.png`, { type: 'image/png' });
          // 把选中区域作为额外参考图片加入上传列表
          setSelectedContextImages((prev) => ({
            ...prev,
            uploadedFiles: [...prev.uploadedFiles, file],
          }));
          // Give user feedback: Selection added as reference image
          show({
            message: 'Selected region added as reference image, check/remove in "Upload Images" below',
            type: 'success',
          });
        }, 'image/png');
      } catch (e: any) {
        console.error('Failed to crop selection (possibly cross-origin image tainting canvas):', e);
        show({
          message: 'Cannot crop region from current image (browser security restriction). Try uploading reference image manually.',
          type: 'error',
        });
      }
    } finally {
      // Do not clear selectionRect, let selection stay visible
    }
  };

  // Multi-select related functions
  const togglePageSelection = (pageId: string) => {
    setSelectedPageIds(prev => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const selectAllPages = () => {
    const allPageIds = pagesWithImages.map(p => p.id!);
    setSelectedPageIds(new Set(allPageIds));
  };

  const deselectAllPages = () => {
    setSelectedPageIds(new Set());
  };

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(prev => {
      if (prev) {
        // Clear selection when exiting multi-select mode
        setSelectedPageIds(new Set());
      }
      return !prev;
    });
  };

  // Get selected page IDs for export
  const getSelectedPageIdsForExport = (): string[] | undefined => {
    if (!isMultiSelectMode || selectedPageIds.size === 0) {
      return undefined; // Export all
    }
    return Array.from(selectedPageIds);
  };

  const handleExport = async (type: 'pptx' | 'pdf' | 'editable-pptx') => {
    setShowExportMenu(false);
    if (!projectId) return;
    
    const pageIds = getSelectedPageIdsForExport();
    const exportTaskId = `export-${Date.now()}`;
    
    try {
      if (type === 'pptx' || type === 'pdf') {
        // Synchronous export - direct download, create completed task directly
        const response = type === 'pptx' 
          ? await apiExportPPTX(projectId, pageIds)
          : await apiExportPDF(projectId, pageIds);
        const downloadUrl = response.data?.download_url || response.data?.download_url_absolute;
        if (downloadUrl) {
          addTask({
            id: exportTaskId,
            taskId: '',
            projectId,
            type: type as ExportTaskType,
            status: 'COMPLETED',
            downloadUrl,
            pageIds: pageIds,
          });
          window.open(downloadUrl, '_blank');
        }
      } else if (type === 'editable-pptx') {
        // Async export - create processing task and start polling
        addTask({
          id: exportTaskId,
          taskId: '', // Will be updated below
          projectId,
          type: 'editable-pptx',
          status: 'PROCESSING',
          pageIds: pageIds,
        });
        
        show({ message: 'Export task started, check progress in Export Tasks panel', type: 'success' });
        
        const response = await apiExportEditablePPTX(projectId, undefined, pageIds);
        const taskId = response.data?.task_id;
        
        if (taskId) {
          // Update task with real taskId
          addTask({
            id: exportTaskId,
            taskId,
            projectId,
            type: 'editable-pptx',
            status: 'PROCESSING',
            pageIds: pageIds,
          });
          
          // Start polling in background (non-blocking)
          pollExportTask(exportTaskId, projectId, taskId);
        }
      }
    } catch (error: any) {
      // Update task as failed
      addTask({
        id: exportTaskId,
        taskId: '',
        projectId,
        type: type as ExportTaskType,
        status: 'FAILED',
        errorMessage: normalizeErrorMessage(error.message || 'Export failed'),
        pageIds: pageIds,
      });
      show({ message: normalizeErrorMessage(error.message || 'Export failed'), type: 'error' });
    }
  };

  const handleRefresh = useCallback(async () => {
    const targetProjectId = projectId || currentProject?.id;
    if (!targetProjectId) {
      show({ message: 'Refresh failed: Missing project ID', type: 'error' });
      return;
    }

    setIsRefreshing(true);
    try {
      await syncProject(targetProjectId);
      show({ message: 'Refresh successful', type: 'success' });
    } catch (error: any) {
      show({ 
        message: error.message || 'Refresh failed, please try again later', 
        type: 'error' 
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [projectId, currentProject?.id, syncProject, show]);

  const handleSaveExtraRequirements = useCallback(async () => {
    if (!currentProject || !projectId) return;
    
    setIsSavingRequirements(true);
    try {
      await updateProject(projectId, { extra_requirements: extraRequirements || '' });
      // After successful save, mark as not editing to allow sync update
      isEditingRequirements.current = false;
      // Update local project state
      await syncProject(projectId);
      show({ message: 'Extra requirements saved', type: 'success' });
    } catch (error: any) {
      show({ 
        message: `Save failed: ${error.message || 'Unknown error'}`, 
        type: 'error' 
      });
    } finally {
      setIsSavingRequirements(false);
    }
  }, [currentProject, projectId, extraRequirements, syncProject, show]);

  const handleSaveTemplateStyle = useCallback(async () => {
    if (!currentProject || !projectId) return;
    
    setIsSavingTemplateStyle(true);
    try {
      await updateProject(projectId, { template_style: templateStyle || '' });
      // After successful save, mark as not editing to allow sync update
      isEditingTemplateStyle.current = false;
      // Update local project state
      await syncProject(projectId);
      show({ message: 'Style description saved', type: 'success' });
    } catch (error: any) {
      show({ 
        message: `Save failed: ${error.message || 'Unknown error'}`, 
        type: 'error' 
      });
    } finally {
      setIsSavingTemplateStyle(false);
    }
  }, [currentProject, projectId, templateStyle, syncProject, show]);

  const handleSaveExportSettings = useCallback(async () => {
    if (!currentProject || !projectId) return;
    
    setIsSavingExportSettings(true);
    try {
      await updateProject(projectId, { 
        export_extractor_method: exportExtractorMethod,
        export_inpaint_method: exportInpaintMethod 
      });
      // Update local project state
      await syncProject(projectId);
      show({ message: 'Export settings saved', type: 'success' });
    } catch (error: any) {
      show({ 
        message: `Save failed: ${error.message || 'Unknown error'}`, 
        type: 'error' 
      });
    } finally {
      setIsSavingExportSettings(false);
    }
  }, [currentProject, projectId, exportExtractorMethod, exportInpaintMethod, syncProject, show]);

  const handleTemplateSelect = async (templateFile: File | null, templateId?: string) => {
    if (!projectId) return;
    
    // If templateId provided, load File on demand
    let file = templateFile;
    if (templateId && !file) {
      file = await getTemplateFile(templateId, userTemplates);
      if (!file) {
        show({ message: 'Failed to load template', type: 'error' });
        return;
      }
    }
    
    if (!file) {
      // If no file and no ID, likely cancelled
      return;
    }
    
    setIsUploadingTemplate(true);
    try {
      await uploadTemplate(projectId, file);
      await syncProject(projectId);
      setIsTemplateModalOpen(false);
      show({ message: 'Template changed successfully', type: 'success' });
      
      // Update selection state
      if (templateId) {
        // Determine if user template or preset template (short ID usually preset)
        if (templateId.length <= 3 && /^\d+$/.test(templateId)) {
          setSelectedPresetTemplateId(templateId);
          setSelectedTemplateId(null);
        } else {
          setSelectedTemplateId(templateId);
          setSelectedPresetTemplateId(null);
        }
      }
    } catch (error: any) {
      show({ 
        message: `Failed to change template: ${error.message || 'Unknown error'}`, 
        type: 'error' 
      });
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  if (!currentProject) {
    return <Loading fullscreen message="Loading project..." />;
  }

  if (isGlobalLoading) {
    // Show different messages based on task progress
    let loadingMessage = "Processing...";
    if (taskProgress && typeof taskProgress === 'object') {
      const progressData = taskProgress as any;
      if (progressData.current_step) {
        // Use current step info from backend
        const stepMap: Record<string, string> = {
          'Generating clean backgrounds': 'Generating clean backgrounds...',
          'Creating PDF': 'Creating PDF...',
          'Parsing with MinerU': 'Parsing content...',
          'Creating editable PPTX': 'Creating editable PPTX...',
          'Complete': 'Complete!'
        };
        loadingMessage = stepMap[progressData.current_step] || progressData.current_step;
      }
      // No longer show "Processing (X/Y)..." format, percentage is shown in progress bar
    }
    
    return (
      <Loading
        fullscreen
        message={loadingMessage}
        progress={taskProgress || undefined}
      />
    );
  }

  const selectedPage = currentProject.pages[selectedIndex];
  const imageUrl = selectedPage?.generated_image_path
    ? getImageUrl(selectedPage.generated_image_path, selectedPage.updated_at)
    : '';

  const hasAllImages = currentProject.pages.every(
    (p) => p.generated_image_path
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 md:h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-3 md:px-6 flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Home size={16} className="md:w-[18px] md:h-[18px]" />}
            onClick={() => navigate('/')}
            className="hidden sm:inline-flex flex-shrink-0"
          >
            <span className="hidden md:inline">Home</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={16} className="md:w-[18px] md:h-[18px]" />}
            onClick={() => {
              if (fromHistory) {
                navigate('/history');
              } else {
                navigate(`/project/${projectId}/detail`);
              }
            }}
            className="flex-shrink-0"
          >
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
            <span className="text-xl md:text-2xl">🍌</span>
            <span className="text-base md:text-xl font-bold truncate">Banana Slides</span>
          </div>
          <span className="text-gray-400 hidden md:inline">|</span>
          <span className="text-sm md:text-lg font-semibold truncate hidden sm:inline">Preview</span>
        </div>
        <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            icon={<Settings size={16} className="md:w-[18px] md:h-[18px]" />}
            onClick={() => setIsProjectSettingsOpen(true)}
            className="hidden lg:inline-flex"
          >
            <span className="hidden xl:inline">Project Settings</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Upload size={16} className="md:w-[18px] md:h-[18px]" />}
            onClick={() => setIsTemplateModalOpen(true)}
            className="hidden lg:inline-flex"
          >
            <span className="hidden xl:inline">Change Template</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<ImagePlus size={16} className="md:w-[18px] md:h-[18px]" />}
            onClick={() => setIsMaterialModalOpen(true)}
            className="hidden lg:inline-flex"
          >
            <span className="hidden xl:inline">Material Generation</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<ArrowLeft size={16} className="md:w-[18px] md:h-[18px]" />}
            onClick={() => navigate(`/project/${projectId}/detail`)}
            className="hidden sm:inline-flex"
          >
            <span className="hidden md:inline">Previous</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={16} className={`md:w-[18px] md:h-[18px] ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="hidden md:inline-flex"
          >
            <span className="hidden lg:inline">Refresh</span>
          </Button>
          
          {/* Export Task Button */}
          {exportTasks.filter(t => t.projectId === projectId).length > 0 && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowExportTasksPanel(!showExportTasksPanel);
                  setShowExportMenu(false);
                }}
                className="relative"
              >
                {exportTasks.filter(t => t.projectId === projectId && (t.status === 'PROCESSING' || t.status === 'RUNNING' || t.status === 'PENDING')).length > 0 ? (
                  <Loader2 size={16} className="animate-spin text-banana-500" />
                ) : (
                  <FileText size={16} />
                )}
                <span className="ml-1 text-xs">
                  {exportTasks.filter(t => t.projectId === projectId).length}
                </span>
              </Button>
              {showExportTasksPanel && (
                <div className="absolute right-0 mt-2 z-20">
                  <ExportTasksPanel 
                    projectId={projectId} 
                    pages={currentProject?.pages || []}
                    className="w-96 max-h-[28rem] shadow-lg" 
                  />
                </div>
              )}
            </div>
          )}
          
          <div className="relative">
            <Button
              variant="primary"
              size="sm"
              icon={<Download size={16} className="md:w-[18px] md:h-[18px]" />}
              onClick={() => {
                setShowExportMenu(!showExportMenu);
                setShowExportTasksPanel(false);
              }}
              disabled={isMultiSelectMode ? selectedPageIds.size === 0 : !hasAllImages}
              className="text-xs md:text-sm"
            >
              <span className="hidden sm:inline">
                {isMultiSelectMode && selectedPageIds.size > 0 
                  ? `Export (${selectedPageIds.size})` 
                  : 'Export'}
              </span>
              <span className="sm:hidden">
                {isMultiSelectMode && selectedPageIds.size > 0 
                  ? `(${selectedPageIds.size})` 
                  : 'Export'}
              </span>
            </Button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                {isMultiSelectMode && selectedPageIds.size > 0 && (
                  <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                    Exporting {selectedPageIds.size} selected pages
                  </div>
                )}
                <button
                  onClick={() => handleExport('pptx')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                >
                  Export as PPTX
                </button>
                <button
                  onClick={() => handleExport('editable-pptx')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                >
                  Export Editable PPTX (Beta)
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-w-0 min-h-0">
        {/* 左侧：缩略图列表 */}
        <aside className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-3 md:p-4 border-b border-gray-200 flex-shrink-0 space-y-2 md:space-y-3">
            <Button
              variant="primary"
              icon={<Sparkles size={16} className="md:w-[18px] md:h-[18px]" />}
              onClick={handleGenerateAll}
              className="w-full text-sm md:text-base"
              disabled={isMultiSelectMode && selectedPageIds.size === 0}
            >
              {isMultiSelectMode && selectedPageIds.size > 0
                ? `Generate selected (${selectedPageIds.size})`
                : `Batch generate images (${currentProject.pages.length})`}
            </Button>
          </div>
          
          {/* Thumbnail list: vertical on desktop, horizontal scroll on mobile */}
          <div className="flex-1 overflow-y-auto md:overflow-y-auto overflow-x-auto md:overflow-x-visible p-3 md:p-4 min-h-0">
            {/* Multi-select mode toggle - compact layout */}
            <div className="flex items-center gap-2 text-xs mb-3">
              <button
                onClick={toggleMultiSelectMode}
                className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                  isMultiSelectMode 
                    ? 'bg-banana-100 text-banana-700 hover:bg-banana-200' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {isMultiSelectMode ? <CheckSquare size={14} /> : <Square size={14} />}
                <span>{isMultiSelectMode ? 'Cancel multi-select' : 'Multi-select'}</span>
              </button>
              {isMultiSelectMode && (
                <>
                  <button
                    onClick={selectedPageIds.size === pagesWithImages.length ? deselectAllPages : selectAllPages}
                    className="text-gray-500 hover:text-banana-600 transition-colors"
                  >
                    {selectedPageIds.size === pagesWithImages.length ? 'Unselect all' : 'Select all'}
                  </button>
                  {selectedPageIds.size > 0 && (
                    <span className="text-banana-600 font-medium">
                      ({selectedPageIds.size} pages)
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex md:flex-col gap-2 md:gap-4 min-w-max md:min-w-0">
              {currentProject.pages.map((page, index) => (
                <div key={page.id} className="md:w-full flex-shrink-0 relative">
                  {/* 移动端：简化缩略图 */}
                  <div className="md:hidden relative">
                    <button
                      onClick={() => {
                        if (isMultiSelectMode && page.id && page.generated_image_path) {
                          togglePageSelection(page.id);
                        } else {
                          setSelectedIndex(index);
                        }
                      }}
                      className={`w-20 h-14 rounded border-2 transition-all ${
                        selectedIndex === index
                          ? 'border-banana-500 shadow-md'
                          : 'border-gray-200'
                      } ${isMultiSelectMode && page.id && selectedPageIds.has(page.id) ? 'ring-2 ring-banana-400' : ''}`}
                    >
                      {page.generated_image_path ? (
                        <img
                          src={getImageUrl(page.generated_image_path, page.updated_at)}
                          alt={`Slide ${index + 1}`}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                          {index + 1}
                        </div>
                      )}
                    </button>
                    {/* 多选复选框（移动端） */}
                    {isMultiSelectMode && page.id && page.generated_image_path && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePageSelection(page.id!);
                        }}
                        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          selectedPageIds.has(page.id)
                            ? 'bg-banana-500 text-white'
                            : 'bg-white border-2 border-gray-300'
                        }`}
                      >
                        {selectedPageIds.has(page.id) && <Check size={12} />}
                      </button>
                    )}
                  </div>
                  {/* 桌面端：完整卡片 */}
                  <div className="hidden md:block relative">
                    {/* 多选复选框（桌面端） */}
                    {isMultiSelectMode && page.id && page.generated_image_path && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePageSelection(page.id!);
                        }}
                        className={`absolute top-2 left-2 z-10 w-6 h-6 rounded flex items-center justify-center transition-all ${
                          selectedPageIds.has(page.id)
                            ? 'bg-banana-500 text-white shadow-md'
                            : 'bg-white/90 border-2 border-gray-300 hover:border-banana-400'
                        }`}
                      >
                        {selectedPageIds.has(page.id) && <Check size={14} />}
                      </button>
                    )}
                    <SlideCard
                      page={page}
                      index={index}
                      isSelected={selectedIndex === index}
                      onClick={() => {
                        if (isMultiSelectMode && page.id && page.generated_image_path) {
                          togglePageSelection(page.id);
                        } else {
                          setSelectedIndex(index);
                        }
                      }}
                      onEdit={() => {
                        setSelectedIndex(index);
                        handleEditPage();
                      }}
                      onDelete={() => page.id && deletePageById(page.id)}
                      isGenerating={page.id ? !!pageGeneratingTasks[page.id] : false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right side: large image preview */}
        <main className="flex-1 flex flex-col bg-gradient-to-br from-banana-50 via-white to-gray-50 min-w-0 overflow-hidden">
          {currentProject.pages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center overflow-y-auto">
              <div className="text-center">
                <div className="text-4xl md:text-6xl mb-4">📊</div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
                  No pages yet
                </h3>
                <p className="text-sm md:text-base text-gray-500 mb-6">
                  Please return to editor to add content
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/project/${projectId}/outline`)}
                  className="text-sm md:text-base"
                >
                  Return to Edit
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* 预览区 */}
              <div className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center p-4 md:p-8">
                <div className="max-w-5xl w-full">
                  <div className="relative aspect-video bg-white rounded-lg shadow-xl overflow-hidden touch-manipulation">
                    {selectedPage?.generated_image_path ? (
                      <img
                        src={imageUrl}
                        alt={`Slide ${selectedIndex + 1}`}
                        className="w-full h-full object-contain select-none"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <div className="text-6xl mb-4">🍌</div>
                          <p className="text-gray-500 mb-4">
                            {selectedPage?.id && pageGeneratingTasks[selectedPage.id]
                              ? 'Generating...'
                              : selectedPage?.status === 'GENERATING'
                              ? 'Generating...'
                              : 'Image not generated yet'}
                          </p>
                          {(!selectedPage?.id || !pageGeneratingTasks[selectedPage.id]) && 
                           selectedPage?.status !== 'GENERATING' && (
                            <Button
                              variant="primary"
                              onClick={handleRegeneratePage}
                            >
                              Generate this page
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 控制栏 */}
              <div className="bg-white border-t border-gray-200 px-3 md:px-6 py-3 md:py-4 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-5xl mx-auto">
                  {/* Navigation */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<ChevronLeft size={16} className="md:w-[18px] md:h-[18px]" />}
                      onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                      disabled={selectedIndex === 0}
                      className="text-xs md:text-sm"
                    >
                      <span className="hidden sm:inline">Previous page</span>
                      <span className="sm:hidden">Prev</span>
                    </Button>
                    <span className="px-2 md:px-4 text-xs md:text-sm text-gray-600 whitespace-nowrap">
                      {selectedIndex + 1} / {currentProject.pages.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<ChevronRight size={16} className="md:w-[18px] md:h-[18px]" />}
                      onClick={() =>
                        setSelectedIndex(
                          Math.min(currentProject.pages.length - 1, selectedIndex + 1)
                        )
                      }
                      disabled={selectedIndex === currentProject.pages.length - 1}
                      className="text-xs md:text-sm"
                    >
                      <span className="hidden sm:inline">Next page</span>
                      <span className="sm:hidden">Next</span>
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 md:gap-2 w-full sm:w-auto justify-center">
                    {/* Mobile: template change button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Upload size={16} />}
                      onClick={() => setIsTemplateModalOpen(true)}
                      className="lg:hidden text-xs"
                      title="Change template"
                    />
                    {/* Mobile: material generation button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<ImagePlus size={16} />}
                      onClick={() => setIsMaterialModalOpen(true)}
                      className="lg:hidden text-xs"
                      title="Material generation"
                    />
                    {/* Mobile: refresh button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />}
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="md:hidden text-xs"
                      title="Refresh"
                    />
                    {imageVersions.length > 1 && (
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowVersionMenu(!showVersionMenu)}
                          className="text-xs md:text-sm"
                        >
                          <span className="hidden md:inline">History versions ({imageVersions.length})</span>
                          <span className="md:hidden">Versions</span>
                        </Button>
                        {showVersionMenu && (
                          <div className="absolute right-0 bottom-full mb-2 w-56 md:w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 max-h-96 overflow-y-auto">
                            {imageVersions.map((version) => (
                              <button
                                key={version.version_id}
                                onClick={() => handleSwitchVersion(version.version_id)}
                                className={`w-full px-3 md:px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between text-xs md:text-sm ${
                                  version.is_current ? 'bg-banana-50' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span>
                                    Version {version.version_number}
                                  </span>
                                  {version.is_current && (
                                    <span className="text-xs text-banana-600 font-medium">
                                      (Current)
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400 hidden md:inline">
                                  {version.created_at
                                    ? new Date(version.created_at).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : ''}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleEditPage}
                      disabled={!selectedPage?.generated_image_path}
                      className="text-xs md:text-sm flex-1 sm:flex-initial"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRegeneratePage}
                      disabled={selectedPage?.id && pageGeneratingTasks[selectedPage.id] ? true : false}
                      className="text-xs md:text-sm flex-1 sm:flex-initial"
                    >
                      {selectedPage?.id && pageGeneratingTasks[selectedPage.id]
                        ? 'Generating...'
                        : 'Regenerate'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Page"
        size="lg"
      >
        <div className="space-y-4">
          {/* Image (Supports rectangle region selection) */}
          <div
            className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative"
            onMouseDown={handleSelectionMouseDown}
            onMouseMove={handleSelectionMouseMove}
            onMouseUp={handleSelectionMouseUp}
            onMouseLeave={handleSelectionMouseUp}
          >
            {imageUrl && (
              <>
                {/* Top left: Region selection mode switch */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle rectangle selection mode
                    setIsRegionSelectionMode((prev) => !prev);
                    // Clear current selection when switching modes
                    setSelectionStart(null);
                    setSelectionRect(null);
                    setIsSelectingRegion(false);
                  }}
                  className="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-white/80 text-[10px] text-gray-700 hover:bg-banana-50 shadow-sm flex items-center gap-1"
                >
                  <Sparkles size={12} />
                  <span>{isRegionSelectionMode ? 'End region selection' : 'Region selection'}</span>
                </button>

                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Current slide"
                  className="w-full h-full object-contain select-none"
                  draggable={false}
                  crossOrigin="anonymous"
                />
                {selectionRect && (
                  <div
                    className="absolute border-2 border-banana-500 bg-banana-400/10 pointer-events-none"
                    style={{
                      left: selectionRect.left,
                      top: selectionRect.top,
                      width: selectionRect.width,
                      height: selectionRect.height,
                    }}
                  />
                )}
              </>
            )}
          </div>

          {/* Outline content - collapsible */}
          {selectedPage?.outline_content && (
            <div className="bg-gray-50 rounded-lg border border-gray-200">
              <button
                onClick={() => setIsOutlineExpanded(!isOutlineExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <h4 className="text-sm font-semibold text-gray-700">Page Outline</h4>
                {isOutlineExpanded ? (
                  <ChevronUp size={18} className="text-gray-500" />
                ) : (
                  <ChevronDown size={18} className="text-gray-500" />
                )}
              </button>
              {isOutlineExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    {selectedPage.outline_content.title}
                  </div>
                  {selectedPage.outline_content.points && selectedPage.outline_content.points.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <Markdown>{selectedPage.outline_content.points.join('\n')}</Markdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Description content - collapsible */}
          {selectedPage?.description_content && (
            <div className="bg-blue-50 rounded-lg border border-blue-200">
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition-colors"
              >
                <h4 className="text-sm font-semibold text-gray-700">Page Description</h4>
                {isDescriptionExpanded ? (
                  <ChevronUp size={18} className="text-gray-500" />
                ) : (
                  <ChevronDown size={18} className="text-gray-500" />
                )}
              </button>
              {isDescriptionExpanded && (
                <div className="px-4 pb-4">
                  <div className="text-sm text-gray-700 max-h-48 overflow-y-auto">
                    <Markdown>
                      {(() => {
                        const desc = selectedPage.description_content;
                        if (!desc) return 'No description';
                        // Handle both formats
                        if ('text' in desc) {
                          return desc.text;
                        } else if ('text_content' in desc && Array.isArray(desc.text_content)) {
                          return desc.text_content.join('\n');
                        }
                        return 'No description';
                      })() as string}
                    </Markdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Context image selection */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Select context images (optional)</h4>
            
            {/* Template image selection */}
            {currentProject?.template_image_path && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="use-template"
                  checked={selectedContextImages.useTemplate}
                  onChange={(e) =>
                    setSelectedContextImages((prev) => ({
                      ...prev,
                      useTemplate: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-banana-600 rounded focus:ring-banana-500"
                />
                <label htmlFor="use-template" className="flex items-center gap-2 cursor-pointer">
                  <ImageIcon size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-700">Use template image</span>
                  {currentProject.template_image_path && (
                    <img
                      src={getImageUrl(currentProject.template_image_path, currentProject.updated_at)}
                      alt="Template"
                      className="w-16 h-10 object-cover rounded border border-gray-300"
                    />
                  )}
                </label>
              </div>
            )}

            {/* Images in Desc */}
            {selectedPage?.description_content && (() => {
              const descImageUrls = extractImageUrlsFromDescription(selectedPage.description_content);
              return descImageUrls.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Images in description:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {descImageUrls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={url}
                          alt={`Desc image ${idx + 1}`}
                          className="w-full h-20 object-cover rounded border-2 border-gray-300 cursor-pointer transition-all"
                          style={{
                            borderColor: selectedContextImages.descImageUrls.includes(url)
                              ? '#f59e0b'
                              : '#d1d5db',
                          }}
                          onClick={() => {
                            setSelectedContextImages((prev) => {
                              const isSelected = prev.descImageUrls.includes(url);
                              return {
                                ...prev,
                                descImageUrls: isSelected
                                  ? prev.descImageUrls.filter((u) => u !== url)
                                  : [...prev.descImageUrls, url],
                              };
                            });
                          }}
                        />
                        {selectedContextImages.descImageUrls.includes(url) && (
                          <div className="absolute inset-0 bg-banana-500/20 border-2 border-banana-500 rounded flex items-center justify-center">
                            <div className="w-6 h-6 bg-banana-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Upload image */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Upload images:</label>
                {projectId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<ImagePlus size={16} />}
                    onClick={() => setIsMaterialSelectorOpen(true)}
                  >
                    Select from library
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedContextImages.uploadedFiles.map((file, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Uploaded ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded border border-gray-300"
                    />
                    <button
                      onClick={() => removeUploadedFile(idx)}
                      className="no-min-touch-target absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-banana-500 transition-colors">
                  <Upload size={20} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Edit prompt */}
          <Textarea
            label="Input modification instruction (will automatically add page description)"
            placeholder="E.g., remove materials in the selected area, change background to blue, increase title font size, change text box style to dashed..."
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitEdit}
              disabled={!editPrompt.trim()}
            >
              Generate
            </Button>
          </div>
        </div>
      </Modal>
      <ToastContainer />
      {ConfirmDialog}
      
      {/* Template Selection Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Change Template"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Selecting a new template will apply to future PPT page generation (does not affect pages already generated). You can choose from preset templates, existing templates, or upload a new template.
          </p>
          <TemplateSelector
            onSelect={handleTemplateSelect}
            selectedTemplateId={selectedTemplateId}
            selectedPresetTemplateId={selectedPresetTemplateId}
            showUpload={false} // Template uploaded on preview page directly applies to project, not saved to user template library
            projectId={projectId || null}
          />
          {isUploadingTemplate && (
            <div className="text-center py-2 text-sm text-gray-500">
              Uploading template...
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => setIsTemplateModalOpen(false)}
              disabled={isUploadingTemplate}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
      {/* 素材生成模态组件（可复用模块，这里只是示例挂载） */}
      {projectId && (
        <>
          <MaterialGeneratorModal
            projectId={projectId}
            isOpen={isMaterialModalOpen}
            onClose={() => setIsMaterialModalOpen(false)}
          />
          {/* 素材选择器 */}
          <MaterialSelector
            projectId={projectId}
            isOpen={isMaterialSelectorOpen}
            onClose={() => setIsMaterialSelectorOpen(false)}
            onSelect={handleSelectMaterials}
            multiple={true}
          />
          {/* 项目设置模态框 */}
          <ProjectSettingsModal
            isOpen={isProjectSettingsOpen}
            onClose={() => setIsProjectSettingsOpen(false)}
            extraRequirements={extraRequirements}
            templateStyle={templateStyle}
            onExtraRequirementsChange={(value) => {
              isEditingRequirements.current = true;
              setExtraRequirements(value);
            }}
            onTemplateStyleChange={(value) => {
              isEditingTemplateStyle.current = true;
              setTemplateStyle(value);
            }}
            onSaveExtraRequirements={handleSaveExtraRequirements}
            onSaveTemplateStyle={handleSaveTemplateStyle}
            isSavingRequirements={isSavingRequirements}
            isSavingTemplateStyle={isSavingTemplateStyle}
            // 导出设置
            exportExtractorMethod={exportExtractorMethod}
            exportInpaintMethod={exportInpaintMethod}
            onExportExtractorMethodChange={setExportExtractorMethod}
            onExportInpaintMethodChange={setExportInpaintMethod}
            onSaveExportSettings={handleSaveExportSettings}
            isSavingExportSettings={isSavingExportSettings}
          />
        </>
      )}
      
    </div>
  );
};

