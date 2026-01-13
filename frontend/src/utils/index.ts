import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Project, Page } from '@/types';

/**
 * Merge className (supports Tailwind CSS)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize project data returned from backend
 */
export function normalizeProject(data: any): Project {
  return {
    ...data,
    id: data.project_id || data.id,
    template_image_path: data.template_image_url || data.template_image_path,
    pages: (data.pages || []).map(normalizePage),
  };
}

/**
 * Normalize page data returned from backend
 */
export function normalizePage(data: any): Page {
  return {
    ...data,
    id: data.page_id || data.id,
    generated_image_path: data.generated_image_url || data.generated_image_path,
  };
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Download file
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Format date
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Normalize error messages to friendly English prompts
 */
export function normalizeErrorMessage(errorMessage: string | null | undefined): string {
  if (!errorMessage) return 'Operation failed';
  
  const message = errorMessage.toLowerCase();
  
  if (message.includes('no template image found')) {
    return 'No template image found for the current project. Please click "Change Template" in the toolbar to select or upload a template image before generating.';
  } else if (message.includes('page must have description content')) {
    return 'This page does not have description content yet. Please generate or fill in the description in the "Edit Page Description" step first.';
  } else if (message.includes('image already exists')) {
    return 'This page already has an image. If you need to regenerate, please select "Regenerate" or try again later.';
  }
  
  return errorMessage;
}

