import type { Page, PageStatus } from '@/types';

/**
 * Page status type
 */
export type PageStatusContext = 'description' | 'image' | 'full';

/**
 * Derived page status
 */
export interface DerivedPageStatus {
  status: PageStatus;
  label: string;
  description: string;
}

/**
 * Get derived status of the page based on context
 * 
 * @param page - Page object
 * @param context - Context: 'description' | 'image' | 'full'
 * @returns Derived status info
 */
export const usePageStatus = (
  page: Page,
  context: PageStatusContext = 'full'
): DerivedPageStatus => {
  const hasDescription = !!page.description_content;
  const hasImage = !!page.generated_image_path;
  const pageStatus = page.status;

  switch (context) {
    case 'description':
      // Description page context: only care if description is generated
      if (!hasDescription) {
        return {
          status: 'DRAFT',
          label: 'No Description',
          description: 'Description not generated yet'
        };
      }
      return {
        status: 'DESCRIPTION_GENERATED',
        label: 'Desc Generated',
        description: 'Description generated'
      };

    case 'image':
      // Image page context: care about image generation status
      if (!hasDescription) {
        return {
          status: 'DRAFT',
          label: 'No Description',
          description: 'Need to generate description first'
        };
      }
      if (!hasImage && pageStatus !== 'GENERATING') {
        return {
          status: 'DESCRIPTION_GENERATED',
          label: 'No Image',
          description: 'Description generated, waiting for image generation'
        };
      }
      if (pageStatus === 'GENERATING') {
        return {
          status: 'GENERATING',
          label: 'Generating',
          description: 'Generating image'
        };
      }
      if (pageStatus === 'FAILED') {
        return {
          status: 'FAILED',
          label: 'Failed',
          description: 'Image generation failed'
        };
      }
      if (hasImage) {
        return {
          status: 'COMPLETED',
          label: 'Completed',
          description: 'Image generated'
        };
      }
      // Default return page status
      return {
        status: pageStatus,
        label: 'Unknown',
        description: 'Status unknown'
      };

    case 'full':
    default:
      // Full context: show actual page status
      return {
        status: pageStatus,
        label: getStatusLabel(pageStatus),
        description: getStatusDescription(pageStatus, hasDescription, hasImage)
      };
  }
};

/**
 * Get status label
 */
function getStatusLabel(status: PageStatus): string {
  const labels: Record<PageStatus, string> = {
    DRAFT: 'Draft',
    DESCRIPTION_GENERATED: 'Desc Generated',
    GENERATING: 'Generating',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
  };
  return labels[status] || 'Unknown';
}

/**
 * Get status description
 */
function getStatusDescription(
  status: PageStatus,
  _hasDescription: boolean,
  _hasImage: boolean
): string {
  if (status === 'DRAFT') return 'Draft Stage';
  if (status === 'DESCRIPTION_GENERATED') return 'Description Generated';
  if (status === 'GENERATING') return 'Generating';
  if (status === 'FAILED') return 'Generation Failed';
  if (status === 'COMPLETED') return 'All Completed';
  return 'Status Unknown';
}

