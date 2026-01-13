import { create } from 'zustand';
import type { Project, Task } from '@/types';
import * as api from '@/api/endpoints';
import { debounce, normalizeProject, normalizeErrorMessage } from '@/utils';

interface ProjectState {
  // 状态
  currentProject: Project | null;
  isGlobalLoading: boolean;
  activeTaskId: string | null;
  taskProgress: { total: number; completed: number } | null;
  error: string | null;
  // 每个页面的生成任务ID映射 (pageId -> taskId)
  pageGeneratingTasks: Record<string, string>;
  // 每个页面的描述生成状态 (pageId -> boolean)
  pageDescriptionGeneratingTasks: Record<string, boolean>;

  // Actions
  setCurrentProject: (project: Project | null) => void;
  setGlobalLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 项目操作
  initializeProject: (type: 'idea' | 'outline' | 'description', content: string, templateImage?: File, templateStyle?: string) => Promise<void>;
  syncProject: (projectId?: string) => Promise<void>;
  
  // 页面操作
  updatePageLocal: (pageId: string, data: any) => void;
  saveAllPages: () => Promise<void>;
  reorderPages: (newOrder: string[]) => Promise<void>;
  addNewPage: () => Promise<void>;
  deletePageById: (pageId: string) => Promise<void>;
  
  // 异步任务
  startAsyncTask: (apiCall: () => Promise<any>) => Promise<void>;
  pollTask: (taskId: string) => Promise<void>;
  pollImageTask: (taskId: string, pageIds: string[]) => void;
  
  // 生成操作
  generateOutline: () => Promise<void>;
  generateFromDescription: () => Promise<void>;
  generateDescriptions: () => Promise<void>;
  generatePageDescription: (pageId: string) => Promise<void>;
  generateImages: (pageIds?: string[]) => Promise<void>;
  editPageImage: (
    pageId: string,
    editPrompt: string,
    contextImages?: {
      useTemplate?: boolean;
      descImageUrls?: string[];
      uploadedFiles?: File[];
    }
  ) => Promise<void>;
  
  // 导出
  exportPPTX: (pageIds?: string[]) => Promise<void>;
  exportPDF: (pageIds?: string[]) => Promise<void>;
  exportEditablePPTX: (filename?: string, pageIds?: string[]) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => {
  // 防抖的API更新函数（在store内部定义，以便访问syncProject）
const debouncedUpdatePage = debounce(
  async (projectId: string, pageId: string, data: any) => {
      try {
    // 如果更新的是 description_content，使用专门的端点
    if (data.description_content) {
      await api.updatePageDescription(projectId, pageId, data.description_content);
    } else if (data.outline_content) {
      // 如果更新的是 outline_content，使用专门的端点
      await api.updatePageOutline(projectId, pageId, data.outline_content);
    } else {
      await api.updatePage(projectId, pageId, data);
        }
        
        // API调用成功后，同步项目状态以更新updated_at
        // 这样可以确保历史记录页面显示最新的更新时间
        const { syncProject } = get();
        await syncProject(projectId);
      } catch (error: any) {
        console.error('保存页面失败:', error);
        // 可以在这里添加错误提示，但为了避免频繁提示，暂时只记录日志
        // 如果需要，可以通过事件系统或toast通知用户
    }
  },
  1000
);

  return {
  // 初始状态
  currentProject: null,
  isGlobalLoading: false,
  activeTaskId: null,
  taskProgress: null,
  error: null,
  pageGeneratingTasks: {},
  pageDescriptionGeneratingTasks: {},

  // Setters
  setCurrentProject: (project) => set({ currentProject: project }),
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
  setError: (error) => set({ error }),

  // Initialize project
  initializeProject: async (type, content, templateImage, templateStyle) => {
    set({ isGlobalLoading: true, error: null });
    try {
      const request: any = {};
      
      if (type === 'idea') {
        request.idea_prompt = content;
      } else if (type === 'outline') {
        request.outline_text = content;
      } else if (type === 'description') {
        request.description_text = content;
      }
      
      // Add style description (if any)
      if (templateStyle && templateStyle.trim()) {
        request.template_style = templateStyle.trim();
      }
      
      // 1. Create project
      const response = await api.createProject(request);
      const projectId = response.data?.project_id;
      
      if (!projectId) {
        throw new Error('Project creation failed: No project ID returned');
      }
      
      // 2. If there is a template image, upload template
      if (templateImage) {
        try {
          await api.uploadTemplate(projectId, templateImage);
        } catch (error) {
          console.warn('Template upload failed:', error);
          // Template upload failure does not affect project creation, continue execution
        }
      }
      
      // 3. If it is description type, auto-generate outline and page descriptions
      if (type === 'description') {
        try {
          await api.generateFromDescription(projectId, content);
          console.log('[initializeProject] Generating outline and page descriptions from description completed');
        } catch (error) {
          console.error('[initializeProject] Generation from description failed:', error);
          // Continue execution to let user operate manually
        }
      }
      
      // 4. Get full project information
      const projectResponse = await api.getProject(projectId);
      const project = normalizeProject(projectResponse.data);
      
      if (project) {
        set({ currentProject: project });
        // Save to localStorage
        localStorage.setItem('currentProjectId', project.id!);
      }
    } catch (error: any) {
      set({ error: normalizeErrorMessage(error.message || 'Failed to create project') });
      throw error;
    } finally {
      set({ isGlobalLoading: false });
    }
  },

  // Sync project data
  syncProject: async (projectId?: string) => {
    const { currentProject } = get();
    
    // If projectId is not provided, try to get it from currentProject or localStorage
    let targetProjectId = projectId;
    if (!targetProjectId) {
      if (currentProject?.id) {
        targetProjectId = currentProject.id;
      } else {
        targetProjectId = localStorage.getItem('currentProjectId') || undefined;
      }
    }
    
    if (!targetProjectId) {
      console.warn('syncProject: No project ID available');
      return;
    }

    try {
      const response = await api.getProject(targetProjectId);
      if (response.data) {
        const project = normalizeProject(response.data);
        console.log('[syncProject] Syncing project data:', {
          projectId: project.id,
          pagesCount: project.pages?.length || 0,
          status: project.status
        });
        set({ currentProject: project });
        // Ensure project ID is saved in localStorage
        localStorage.setItem('currentProjectId', project.id!);
      }
    } catch (error: any) {
      // Extract more detailed error information
      let errorMessage = 'Failed to sync project';
      let shouldClearStorage = false;
      
      if (error.response) {
        // Server returned an error response
        const errorData = error.response.data;
        if (error.response.status === 404) {
          // 404 error: project does not exist, clear localStorage
          errorMessage = errorData?.error?.message || 'Project does not exist, may have been deleted';
          shouldClearStorage = true;
        } else if (errorData?.error?.message) {
          // Extract message from backend error format
          errorMessage = errorData.error.message;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : errorData.error.message || 'Request failed';
        } else {
          errorMessage = `Request failed: ${error.response.status}`;
        }
      } else if (error.request) {
        // Request was sent but no response was received
        errorMessage = 'Network error, please check if backend service is running';
      } else if (error.message) {
        // Other errors
        errorMessage = error.message;
      }
      
      // If project does not exist, clear localStorage and reset current project
      if (shouldClearStorage) {
        console.warn('[syncProject] Project does not exist, clearing localStorage');
        localStorage.removeItem('currentProjectId');
        set({ currentProject: null, error: normalizeErrorMessage(errorMessage) });
      } else {
        set({ error: normalizeErrorMessage(errorMessage) });
      }
    }
  },

  // 本地更新页面（乐观更新）
  updatePageLocal: (pageId, data) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updatedPages = currentProject.pages.map((page) =>
      page.id === pageId ? { ...page, ...data } : page
    );

    set({
      currentProject: {
        ...currentProject,
        pages: updatedPages,
      },
    });

    // 防抖后调用API
    debouncedUpdatePage(currentProject.id, pageId, data);
  },

  // 立即保存所有页面的更改（用于保存按钮）
  // 等待防抖完成，然后同步项目状态以确保updated_at更新
  saveAllPages: async () => {
    const { currentProject } = get();
    if (!currentProject) return;

    // 等待防抖延迟时间（1秒）+ 额外时间确保API调用完成
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 同步项目状态，这会从后端获取最新的updated_at
    await get().syncProject(currentProject.id);
  },

  // Reorder pages
  reorderPages: async (newOrder) => {
    const { currentProject } = get();
    if (!currentProject) return;

    // Optimistic update
    const reorderedPages = newOrder
      .map((id) => currentProject.pages.find((p) => p.id === id))
      .filter(Boolean) as any[];

    set({
      currentProject: {
        ...currentProject,
        pages: reorderedPages,
      },
    });

    try {
      await api.updatePagesOrder(currentProject.id, newOrder);
    } catch (error: any) {
      set({ error: error.message || 'Failed to update order' });
      // Resync after failure
      await get().syncProject();
    }
  },

  // Add new page
  addNewPage: async () => {
    const { currentProject } = get();
    if (!currentProject) return;

    try {
      const newPage = {
        outline_content: { title: 'New Page', points: [] },
        order_index: currentProject.pages.length,
      };
      
      const response = await api.addPage(currentProject.id, newPage);
      if (response.data) {
        await get().syncProject();
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to add page' });
    }
  },

  // Delete page
  deletePageById: async (pageId) => {
    const { currentProject } = get();
    if (!currentProject) return;

    try {
      await api.deletePage(currentProject.id, pageId);
      await get().syncProject();
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete page' });
    }
  },

  // Start async task
  startAsyncTask: async (apiCall) => {
    console.log('[Async Task] Starting async task...');
    set({ isGlobalLoading: true, error: null });
    try {
      const response = await apiCall();
      console.log('[Async Task] API response:', response);
      
      // task_id is in response.data
      const taskId = response.data?.task_id;
      if (taskId) {
        console.log('[Async Task] Received task_id:', taskId, 'starting polling...');
        set({ activeTaskId: taskId });
        await get().pollTask(taskId);
      } else {
        console.warn('[Async Task] No task_id in response, may be a synchronous operation:', response);
        // Refresh project data after sync operation
        await get().syncProject();
        set({ isGlobalLoading: false });
      }
    } catch (error: any) {
      console.error('[Async Task] Start failed:', error);
      set({ error: error.message || 'Task start failed', isGlobalLoading: false });
      throw error;
    }
  },

  // Poll task status
  pollTask: async (taskId) => {
    console.log(`[Polling] Starting polling for task: ${taskId}`);
    const { currentProject } = get();
    if (!currentProject) {
      console.warn('[Polling] No current project, stopping polling');
      return;
    }

    const poll = async () => {
      try {
        console.log(`[Polling] Querying task status: ${taskId}`);
        const response = await api.getTaskStatus(currentProject.id!, taskId);
        const task = response.data;
        
        if (!task) {
          console.warn('[Polling] No task data in response');
          return;
        }

        // Update progress
        if (task.progress) {
          set({ taskProgress: task.progress });
        }

        console.log(`[Polling] Task ${taskId} status: ${task.status}`, task);

        // Check task status
        if (task.status === 'COMPLETED') {
          console.log(`[Polling] Task ${taskId} completed, refreshing project data`);
          
          // If exporting editable PPTX task, check for download link
          if (task.task_type === 'EXPORT_EDITABLE_PPTX' && task.progress) {
            const progress = typeof task.progress === 'string' 
              ? JSON.parse(task.progress) 
              : task.progress;
            
            const downloadUrl = progress?.download_url;
            if (downloadUrl) {
              console.log('[Export Editable PPTX] Get download link from task response:', downloadUrl);
              // Delay slightly to ensure state update completes before opening download link
              setTimeout(() => {
                window.open(downloadUrl, '_blank');
              }, 500);
            } else {
              console.warn('[Export Editable PPTX] Task completed but no download link');
            }
          }
          
          set({ 
            activeTaskId: null, 
            taskProgress: null, 
            isGlobalLoading: false 
          });
          // Refresh project data
          await get().syncProject();
        } else if (task.status === 'FAILED') {
          console.error(`[Polling] Task ${taskId} failed:`, task.error_message || task.error);
          set({ 
            error: normalizeErrorMessage(task.error_message || task.error || 'Task failed'),
            activeTaskId: null,
            taskProgress: null,
            isGlobalLoading: false
          });
        } else if (task.status === 'PENDING' || task.status === 'PROCESSING') {
          // Continue polling (PENDING or PROCESSING)
          console.log(`[Polling] Task ${taskId} processing, continuing polling in 2s...`);
          setTimeout(poll, 2000);
        } else {
          // Unknown status, stop polling
          console.warn(`[Polling] Task ${taskId} unknown status: ${task.status}, stopping polling`);
          set({ 
            error: `Unknown task status: ${task.status}`,
            activeTaskId: null,
            taskProgress: null,
            isGlobalLoading: false
          });
        }
      } catch (error: any) {
        console.error('Task polling error:', error);
        set({ 
          error: normalizeErrorMessage(error.message || 'Task status query failed'),
          activeTaskId: null,
          isGlobalLoading: false
        });
      }
    };

    await poll();
  },

  // Generate outline (sync operation, no polling needed)
  generateOutline: async () => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({ isGlobalLoading: true, error: null });
    try {
      const response = await api.generateOutline(currentProject.id!);
      console.log('[Generate Outline] API response:', response);
      
      // Refresh project data to ensure getting latest outline pages
      await get().syncProject();
      
      // Re-verify data updated
      const { currentProject: updatedProject } = get();
      console.log('[Generate Outline] Refreshed project:', updatedProject?.pages.length, 'pages');
    } catch (error: any) {
      console.error('[Generate Outline] Error:', error);
      set({ error: error.message || 'Failed to generate outline' });
      throw error;
    } finally {
      set({ isGlobalLoading: false });
    }
  },

  // Generate outline and page descriptions from description text (sync operation)
  generateFromDescription: async () => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({ isGlobalLoading: true, error: null });
    try {
      const response = await api.generateFromDescription(currentProject.id!);
      console.log('[Generate from Desc] API response:', response);
      
      // Refresh project data to ensure getting latest outline and descriptions
      await get().syncProject();
      
      // Re-verify data updated
      const { currentProject: updatedProject } = get();
      console.log('[Generate from Desc] Refreshed project:', updatedProject?.pages.length, 'pages');
    } catch (error: any) {
      console.error('[Generate from Desc] Error:', error);
      set({ error: error.message || 'Failed to generate from description' });
      throw error;
    } finally {
      set({ isGlobalLoading: false });
    }
  },

  // Generate descriptions (using async task, real-time progress)
  generateDescriptions: async () => {
    const { currentProject } = get();
    if (!currentProject || !currentProject.id) return;

    const pages = currentProject.pages.filter((p) => p.id);
    if (pages.length === 0) return;

    set({ error: null });
    
    // Mark all pages as generating
    const initialTasks: Record<string, boolean> = {};
    pages.forEach((page) => {
      if (page.id) {
        initialTasks[page.id] = true;
      }
    });
    set({ pageDescriptionGeneratingTasks: initialTasks });
    
    try {
      // Call batch generate API, returns task_id
      const projectId = currentProject.id;
      if (!projectId) {
        throw new Error('Project ID missing');
      }
      
      const response = await api.generateDescriptions(projectId);
      const taskId = response.data?.task_id;
      
      if (!taskId) {
        throw new Error('Task ID not received');
      }
      
      // Start polling task status and periodic project sync
      const pollAndSync = async () => {
        try {
          // Poll task status
          const taskResponse = await api.getTaskStatus(projectId, taskId);
          const task = taskResponse.data;
          
          if (task) {
            // Update progress
            if (task.progress) {
              set({ taskProgress: task.progress });
            }
            
            // Sync project data to get latest page status
            await get().syncProject();
            
            // Update generation status for each page based on project data
            const { currentProject: updatedProject } = get();
            if (updatedProject) {
              const updatedTasks: Record<string, boolean> = {};
              updatedProject.pages.forEach((page) => {
                if (page.id) {
                  // If page has description, it's completed
                  const hasDescription = !!page.description_content;
                  // If status is GENERATING or no description, it's in progress
                  const isGenerating = page.status === 'GENERATING' || 
                                      (!hasDescription && initialTasks[page.id]);
                  if (isGenerating) {
                    updatedTasks[page.id] = true;
                  }
                }
              });
              set({ pageDescriptionGeneratingTasks: updatedTasks });
            }
            
            // Check if task completed
            if (task.status === 'COMPLETED') {
              // Clear all generation states
              set({ 
                pageDescriptionGeneratingTasks: {},
                taskProgress: null,
                activeTaskId: null
              });
              // Final sync to ensure latest data
              await get().syncProject();
            } else if (task.status === 'FAILED') {
              // Task failed
              set({ 
                pageDescriptionGeneratingTasks: {},
                taskProgress: null,
                activeTaskId: null,
                error: normalizeErrorMessage(task.error_message || task.error || 'Failed to generate descriptions')
              });
            } else if (task.status === 'PENDING' || task.status === 'PROCESSING') {
              // Continue polling
              setTimeout(pollAndSync, 2000);
            }
          }
        } catch (error: any) {
          console.error('[Generate Descriptions] Polling error:', error);
          // Even if polling error, continue to try sync project data
          await get().syncProject();
          setTimeout(pollAndSync, 2000);
        }
      };
      
      // Start polling
      setTimeout(pollAndSync, 2000);
      
    } catch (error: any) {
      console.error('[Generate Descriptions] Failed to start task:', error);
      set({ 
        pageDescriptionGeneratingTasks: {},
        error: normalizeErrorMessage(error.message || 'Failed to start generation task')
      });
      throw error;
    }
  },

  // Generate single page description
  generatePageDescription: async (pageId: string) => {
    const { currentProject, pageDescriptionGeneratingTasks } = get();
    if (!currentProject) return;

    // If page is generating, do not resubmit
    if (pageDescriptionGeneratingTasks[pageId]) {
      console.log(`[Generate Descriptions] Page ${pageId} is generating, skipping duplicate request`);
      return;
    }

    set({ error: null });
    
    // Mark as generating
    set({
      pageDescriptionGeneratingTasks: {
        ...pageDescriptionGeneratingTasks,
        [pageId]: true,
      },
    });

    try {
      // Sync project data immediately to update page status
      await get().syncProject();
      
      // Pass force_regenerate=true to allow regeneration of existing description
      await api.generatePageDescription(currentProject.id, pageId, true);
      
      // Refresh project data
      await get().syncProject();
    } catch (error: any) {
      set({ error: normalizeErrorMessage(error.message || 'Failed to generate description') });
      throw error;
    } finally {
      // Clear generation state
      const { pageDescriptionGeneratingTasks: currentTasks } = get();
      const newTasks = { ...currentTasks };
      delete newTasks[pageId];
      set({ pageDescriptionGeneratingTasks: newTasks });
    }
  },

  // Generate images (non-blocking, status displayed per page)
  generateImages: async (pageIds?: string[]) => {
    const { currentProject, pageGeneratingTasks } = get();
    if (!currentProject) return;

    // Determine target page IDs
    const targetPageIds = pageIds || currentProject.pages.map(p => p.id).filter((id): id is string => !!id);
    
    // Check if pages are generating
    const alreadyGenerating = targetPageIds.filter(id => pageGeneratingTasks[id]);
    if (alreadyGenerating.length > 0) {
      console.log(`[Batch Generate] ${alreadyGenerating.length} pages are generating, skipping`);
      // Filter out pages already generating
      const newPageIds = targetPageIds.filter(id => !pageGeneratingTasks[id]);
      if (newPageIds.length === 0) {
        console.log('[Batch Generate] All pages are generating, skipping request');
        return;
      }
    }

    set({ error: null });
    
    try {
      // Call batch generate API
      const response = await api.generateImages(currentProject.id, undefined, pageIds);
      const taskId = response.data?.task_id;
      
      if (taskId) {
        console.log(`[Batch Generate] Received task_id: ${taskId}, marking ${targetPageIds.length} pages as generating`);
        
        // Set task ID for all target pages
        const newPageGeneratingTasks = { ...pageGeneratingTasks };
        targetPageIds.forEach(id => {
          newPageGeneratingTasks[id] = taskId;
        });
        set({ pageGeneratingTasks: newPageGeneratingTasks });
        
        // Sync project data immediately to get 'GENERATING' status from backend
        await get().syncProject();
        
        // Start polling batch task status (non-blocking)
        get().pollImageTask(taskId, targetPageIds);
      } else {
        // If no task_id returned, likely a synchronous interface, refresh directly
        await get().syncProject();
      }
    } catch (error: any) {
      console.error('[Batch Generate] Failed to start:', error);
      set({ error: normalizeErrorMessage(error.message || 'Failed to generate images') });
      throw error;
    }
  },

  // Poll image generation task (non-blocking, supports single and batch)
  pollImageTask: async (taskId: string, pageIds: string[]) => {
    const { currentProject } = get();
    if (!currentProject) {
      console.warn('[Batch Polling] No current project, stopping polling');
      return;
    }

    const poll = async () => {
      try {
        const response = await api.getTaskStatus(currentProject.id!, taskId);
        const task = response.data;
        
        if (!task) {
          console.warn('[Batch Polling] No task data in response');
          return;
        }

        console.log(`[Batch Polling] Task ${taskId} status: ${task.status}`, task.progress);

        // Check task status
        if (task.status === 'COMPLETED') {
          console.log(`[Batch Polling] Task ${taskId} completed, clearing task records`);
          // Clear task records for all relevant pages
          const { pageGeneratingTasks } = get();
          const newTasks = { ...pageGeneratingTasks };
          pageIds.forEach(id => {
            if (newTasks[id] === taskId) {
              delete newTasks[id];
            }
          });
          set({ pageGeneratingTasks: newTasks });
          // Refresh project data
          await get().syncProject();
        } else if (task.status === 'FAILED') {
          console.error(`[Batch Polling] Task ${taskId} failed:`, task.error_message || task.error);
          // Clear task records for all relevant pages
          const { pageGeneratingTasks } = get();
          const newTasks = { ...pageGeneratingTasks };
          pageIds.forEach(id => {
            if (newTasks[id] === taskId) {
              delete newTasks[id];
            }
          });
          set({ 
            pageGeneratingTasks: newTasks,
            error: normalizeErrorMessage(task.error_message || task.error || 'Batch generation failed')
          });
          // Refresh project data to update page status
          await get().syncProject();
        } else if (task.status === 'PENDING' || task.status === 'PROCESSING') {
          // Continue polling, also sync project data to update page status
          console.log(`[Batch Polling] Task ${taskId} processing, syncing project data...`);
          await get().syncProject();
          console.log(`[Batch Polling] Task ${taskId} processing, continuing polling in 2s...`);
          setTimeout(poll, 2000);
        } else {
          // Unknown status, stop polling
          console.warn(`[Batch Polling] Task ${taskId} unknown status: ${task.status}, stopping polling`);
          const { pageGeneratingTasks } = get();
          const newTasks = { ...pageGeneratingTasks };
          pageIds.forEach(id => {
            if (newTasks[id] === taskId) {
              delete newTasks[id];
            }
          });
          set({ pageGeneratingTasks: newTasks });
        }
      } catch (error: any) {
        console.error('[Batch Polling] Polling error:', error);
        // Clear task records for all relevant pages
        const { pageGeneratingTasks } = get();
        const newTasks = { ...pageGeneratingTasks };
        pageIds.forEach(id => {
          if (newTasks[id] === taskId) {
            delete newTasks[id];
          }
        });
        set({ pageGeneratingTasks: newTasks });
      }
    };

    // Start polling (not await, return immediately to keep UI responsive)
    poll();
  },

  // Edit page image (async)
  editPageImage: async (pageId, editPrompt, contextImages) => {
    const { currentProject, pageGeneratingTasks } = get();
    if (!currentProject) return;

    // If page is generating, do not resubmit
    if (pageGeneratingTasks[pageId]) {
      console.log(`[Edit] Page ${pageId} is generating, skipping duplicate request`);
      return;
    }

    set({ error: null });
    try {
      const response = await api.editPageImage(currentProject.id, pageId, editPrompt, contextImages);
      const taskId = response.data?.task_id;
      
      if (taskId) {
        // Record task ID for this page
        set({ 
          pageGeneratingTasks: { ...pageGeneratingTasks, [pageId]: taskId }
        });
        
        // Sync project data immediately to get 'GENERATING' status from backend
        await get().syncProject();
        
        // Start polling (using unified polling function)
        get().pollImageTask(taskId, [pageId]);
      } else {
        // If no task_id returned, likely synchronous interface, refresh directly
        await get().syncProject();
      }
    } catch (error: any) {
      // Clear task record for this page
      const { pageGeneratingTasks } = get();
      const newTasks = { ...pageGeneratingTasks };
      delete newTasks[pageId];
      set({ pageGeneratingTasks: newTasks, error: normalizeErrorMessage(error.message || 'Image editing failed') });
      throw error;
    }
  },

  // Export PPTX
  exportPPTX: async (pageIds?: string[]) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({ isGlobalLoading: true, error: null });
    try {
      const response = await api.exportPPTX(currentProject.id, pageIds);
      // Prefer relative path to avoid port issues in Docker environment
      const downloadUrl =
        response.data?.download_url || response.data?.download_url_absolute;

      if (!downloadUrl) {
        throw new Error('Failed to get export link');
      }

      // Use browser to download link directly
      window.open(downloadUrl, '_blank');
    } catch (error: any) {
      set({ error: error.message || 'Export failed' });
    } finally {
      set({ isGlobalLoading: false });
    }
  },

  // Export PDF
  exportPDF: async (pageIds?: string[]) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({ isGlobalLoading: true, error: null });
    try {
      const response = await api.exportPDF(currentProject.id, pageIds);
      // Prefer relative path to avoid port issues in Docker environment
      const downloadUrl =
        response.data?.download_url || response.data?.download_url_absolute;

      if (!downloadUrl) {
        throw new Error('Failed to get export link');
      }

      // Use browser to download link directly
      window.open(downloadUrl, '_blank');
    } catch (error: any) {
      set({ error: error.message || 'Export failed' });
    } finally {
      set({ isGlobalLoading: false });
    }
  },

  // Export editable PPTX (async task)
  exportEditablePPTX: async (filename?: string, pageIds?: string[]) => {
    const { currentProject, startAsyncTask } = get();
    if (!currentProject) return;

    try {
      console.log('[Export Editable PPTX] Starting async export task...');
      // pollTask in startAsyncTask will handle download on task completion
      await startAsyncTask(() => api.exportEditablePPTX(currentProject.id, filename, pageIds));
      console.log('[Export Editable PPTX] Async task completed');
    } catch (error: any) {
      console.error('[Export Editable PPTX] Export failed:', error);
      set({ error: error.message || 'Export editable PPTX failed' });
    }
  },
};});