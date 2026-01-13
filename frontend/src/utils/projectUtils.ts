import { getImageUrl } from '@/api/client';
import type { Project } from '@/types';

/**
 * Get project title
 */
export const getProjectTitle = (project: Project): string => {
  // If idea_prompt exists, prioritize it
  if (project.idea_prompt) {
    return project.idea_prompt;
  }
  
  // If no idea_prompt, try to get title from the first page
  if (project.pages && project.pages.length > 0) {
    // Sort by order_index, find the first page
    const sortedPages = [...project.pages].sort((a, b) => 
      (a.order_index || 0) - (b.order_index || 0)
    );
    const firstPage = sortedPages[0];
    
    // If first page has outline_content and title, use it
    if (firstPage?.outline_content?.title) {
      return firstPage.outline_content.title;
    }
  }
  
  // Default return Unnamed Project
  return 'Unnamed Project';
};

/**
 * Get first page image URL
 */
export const getFirstPageImage = (project: Project): string | null => {
  if (!project.pages || project.pages.length === 0) {
    return null;
  }
  
  // Find first page with generated image
  const firstPageWithImage = project.pages.find(p => p.generated_image_path);
  if (firstPageWithImage?.generated_image_path) {
    return getImageUrl(firstPageWithImage.generated_image_path, firstPageWithImage.updated_at);
  }
  
  return null;
};

/**
 * Format date
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get project status text
 */
export const getStatusText = (project: Project): string => {
  if (!project.pages || project.pages.length === 0) {
    return 'Not Started';
  }
  const hasImages = project.pages.some(p => p.generated_image_path);
  if (hasImages) {
    return 'Completed';
  }
  const hasDescriptions = project.pages.some(p => p.description_content);
  if (hasDescriptions) {
    return 'Pending Images';
  }
  return 'Pending Desc';
};

/**
 * Get project status color style
 */
export const getStatusColor = (project: Project): string => {
  const status = getStatusText(project);
  if (status === 'Completed') return 'text-green-600 bg-green-50';
  if (status === 'Pending Images') return 'text-yellow-600 bg-yellow-50';
  if (status === 'Pending Desc') return 'text-blue-600 bg-blue-50';
  return 'text-gray-600 bg-gray-50';
};

/**
 * Get project route path
 */
export const getProjectRoute = (project: Project): string => {
  const projectId = project.id || project.project_id;
  if (!projectId) return '/';
  
  if (project.pages && project.pages.length > 0) {
    const hasImages = project.pages.some(p => p.generated_image_path);
    if (hasImages) {
      return `/project/${projectId}/preview`;
    }
    const hasDescriptions = project.pages.some(p => p.description_content);
    if (hasDescriptions) {
      return `/project/${projectId}/detail`;
    }
    return `/project/${projectId}/outline`;
  }
  return `/project/${projectId}/outline`;
};

