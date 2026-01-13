import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Upload, X, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Button, useToast, Modal } from '@/components/shared';
import {
  listProjectReferenceFiles,
  uploadReferenceFile,
  deleteReferenceFile,
  getReferenceFile,
  triggerFileParse,
  type ReferenceFile,
} from '@/api/endpoints';

interface ReferenceFileSelectorProps {
  projectId?: string | null; // Optional, use global files if not provided
  isOpen: boolean;
  onClose: () => void;
  onSelect: (files: ReferenceFile[]) => void;
  multiple?: boolean; // Whether to support multiple selection
  maxSelection?: number; // Maximum number of selections
  initialSelectedIds?: string[]; // Initial list of selected file IDs
}

/**
 * Reference File Selector Component
 * - Browse all reference files under the project
 * - Support single/multiple selection
 * - Support uploading local files
 * - Support selecting from file library (parsed ones are used directly, unparsed ones are parsed on selection)
 * - Support deleting files
 */
export const ReferenceFileSelector: React.FC<ReferenceFileSelectorProps> = React.memo(({
  projectId,
  isOpen,
  onClose,
  onSelect,
  multiple = true,
  maxSelection,
  initialSelectedIds = [],
}) => {
  const { show } = useToast();
  const [files, setFiles] = useState<ReferenceFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parsingIds, setParsingIds] = useState<Set<string>>(new Set());
  const [filterProjectId, setFilterProjectId] = useState<string>('all'); // Default to show all attachments
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialSelectedIdsRef = useRef(initialSelectedIds);
  const showRef = useRef(show);

  // Update ref to keep latest value, avoid adding to dependency array causing infinite loop
  useEffect(() => {
    initialSelectedIdsRef.current = initialSelectedIds;
    showRef.current = show;
  }, [initialSelectedIds, show]);

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      // Determine which files to query based on filterProjectId
      // 'all' - All files (global + project)
      // 'none' - Only query unclassified files (global files, project_id=None)
      // Project ID - Only query files of that project
      const targetProjectId = filterProjectId === 'all' ? 'all' : filterProjectId === 'none' ? 'none' : filterProjectId;
      const response = await listProjectReferenceFiles(targetProjectId);
      
      if (response.data?.files) {
        // Merge new and old file lists to avoid losing parsing files
        setFiles(prev => {
          const fileMap = new Map<string, ReferenceFile>();
          const serverFiles = response.data!.files; // Already checked response.data?.files
          
          // First add files returned by server (these are authoritative data)
          serverFiles.forEach((f: ReferenceFile) => {
            fileMap.set(f.id, f);
          });
          
          // Then add parsing files (server status might not be updated yet)
          prev.forEach(f => {
            if (parsingIds.has(f.id) && !fileMap.has(f.id)) {
              fileMap.set(f.id, f);
            }
          });
          
          return Array.from(fileMap.values());
        });
      }
    } catch (error: any) {
      console.error('Failed to load reference file list:', error);
      showRef.current({
        message: error?.response?.data?.error?.message || error.message || 'Failed to load reference file list',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filterProjectId, parsingIds]);

  useEffect(() => {
    if (isOpen) {
      loadFiles();
      // Restore initial selection
      setSelectedFiles(new Set(initialSelectedIdsRef.current));
    }
  }, [isOpen, filterProjectId, loadFiles]);

  // Poll parsing status
  useEffect(() => {
    if (!isOpen || parsingIds.size === 0) return;

    const intervalId = setInterval(async () => {
      const idsToCheck = Array.from(parsingIds);
      const updatedFiles: ReferenceFile[] = [];
      const completedIds: string[] = [];

      for (const fileId of idsToCheck) {
        try {
          const response = await getReferenceFile(fileId);
          if (response.data?.file) {
            const updatedFile = response.data.file;
            updatedFiles.push(updatedFile);
            
            // If parsing completed or failed, mark as completed
            if (updatedFile.parse_status === 'completed' || updatedFile.parse_status === 'failed') {
              completedIds.push(fileId);
            }
          }
        } catch (error) {
          console.error(`Failed to poll file ${fileId}:`, error);
        }
      }

      // Batch update file list
      if (updatedFiles.length > 0) {
        setFiles(prev => {
          const fileMap = new Map(prev.map(f => [f.id, f]));
          updatedFiles.forEach(uf => fileMap.set(uf.id, uf));
          return Array.from(fileMap.values());
        });
      }

      // Remove completed files from polling list
      if (completedIds.length > 0) {
        setParsingIds(prev => {
          const newSet = new Set(prev);
          completedIds.forEach(id => newSet.delete(id));
          return newSet;
        });
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(intervalId);
  }, [isOpen, parsingIds]);

  const handleSelectFile = (file: ReferenceFile) => {
    // Allow selecting files in all states (including pending and parsing)
    // Pending files will trigger parsing on confirm
    // Parsing files will wait for parsing completion

    if (multiple) {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id);
      } else {
        if (maxSelection && newSelected.size >= maxSelection) {
          show({
            message: `Can only select up to ${maxSelection} files`,
            type: 'info',
          });
          return;
        }
        newSelected.add(file.id);
      }
      setSelectedFiles(newSelected);
    } else {
      setSelectedFiles(new Set([file.id]));
    }
  };

  const handleConfirm = async () => {
    const selected = files.filter((f) => selectedFiles.has(f.id));
    
    if (selected.length === 0) {
      show({ message: 'Please select at least one file', type: 'info' });
      return;
    }
    
    // Check if there are unparsed files that need parsing
    const unparsedFiles = selected.filter(f => f.parse_status === 'pending');
    
    if (unparsedFiles.length > 0) {
      // Trigger parsing for unparsed files, but return immediately (do not wait)
      try {
        show({
          message: `Triggered parsing for ${unparsedFiles.length} files, will proceed in background`,
          type: 'success',
        });

        // Trigger parsing for all unparsed files (do not wait for completion)
        unparsedFiles.forEach(file => {
          triggerFileParse(file.id).catch(error => {
            console.error(`Failed to trigger parsing for file ${file.filename}:`, error);
          });
        });
        
        // Return all selected files immediately (including pending state)
        onSelect(selected);
        onClose();
      } catch (error: any) {
        console.error('Failed to trigger file parsing:', error);
        show({
          message: error?.response?.data?.error?.message || error.message || 'Failed to trigger file parsing',
          type: 'error',
        });
      }
    } else {
      // All files are parsed or parsing, confirm directly
      // Allow selecting files in all states (completed, parsing)
      const validFiles = selected.filter(f => 
        f.parse_status === 'completed' || f.parse_status === 'parsing'
      );
      
      if (validFiles.length === 0) {
        show({ message: 'Please select valid files', type: 'info' });
        return;
      }
      
      onSelect(validFiles);
      onClose();
    }
  };

  const handleClear = () => {
    setSelectedFiles(new Set());
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check for PPT files, suggest PDF
    const hasPptFiles = Array.from(files).some(file => {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      return fileExt === 'ppt' || fileExt === 'pptx';
    });
    
    if (hasPptFiles) show({  message: '💡 Tip: Converting PPT to PDF format for upload is recommended for better parsing results', type: 'info' });
    

    setIsUploading(true);
    try {
      // Decide upload ownership based on current filter
      // If filter is 'all' or 'none', upload as global file (not associated with project)
      // If filter is project ID, upload to that project
      const targetProjectId = (filterProjectId === 'all' || filterProjectId === 'none')
        ? null
        : filterProjectId;
      
      // Upload all selected files
      const uploadPromises = Array.from(files).map(file =>
        uploadReferenceFile(file, targetProjectId)
      );

      const results = await Promise.all(uploadPromises);
      const uploadedFiles = results
        .map(r => r.data?.file)
        .filter((f): f is ReferenceFile => f !== undefined);

      if (uploadedFiles.length > 0) {
        show({ message: `Successfully uploaded ${uploadedFiles.length} files`, type: 'success' });
        
        // Only add parsing files to polling list (pending files are not polled)
        const needsParsing = uploadedFiles.filter(f => 
          f.parse_status === 'parsing'
        );
        if (needsParsing.length > 0) {
          setParsingIds(prev => {
            const newSet = new Set(prev);
            needsParsing.forEach(f => newSet.add(f.id));
            return newSet;
          });
        }
        
        // Merge newly uploaded files into existing list instead of full replacement
        setFiles(prev => {
          const fileMap = new Map(prev.map(f => [f.id, f]));
          uploadedFiles.forEach(uf => fileMap.set(uf.id, uf));
          return Array.from(fileMap.values());
        });
        
        // Delay reloading file list to ensure server data updated
        setTimeout(() => {
          loadFiles();
        }, 500);
      }
    } catch (error: any) {
      console.error('File upload failed:', error);
      show({
        message: error?.response?.data?.error?.message || error.message || 'File upload failed',
        type: 'error',
      });
    } finally {
      setIsUploading(false);
      // Clear input value to allow re-selecting same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    file: ReferenceFile
  ) => {
    e.stopPropagation();
    const fileId = file.id;

    if (!fileId) {
      show({ message: 'Cannot delete: Missing file ID', type: 'error' });
      return;
    }

    setDeletingIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(fileId);
      return newSet;
    });

    try {
      await deleteReferenceFile(fileId);
      show({ message: 'File deleted successfully', type: 'success' });
      
      // Remove from selection
      setSelectedFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
      
      // Remove from polling list
      setParsingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
      
      loadFiles(); // Reload file list
    } catch (error: any) {
      console.error('Failed to delete file:', error);
      show({
        message: error?.response?.data?.error?.message || error.message || 'Failed to delete file',
        type: 'error',
      });
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = (file: ReferenceFile) => {
    if (parsingIds.has(file.id) || file.parse_status === 'parsing') {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    switch (file.parse_status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (file: ReferenceFile) => {
    if (parsingIds.has(file.id) || file.parse_status === 'parsing') {
      return 'Parsing...';
    }
    switch (file.parse_status) {
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Reference File" size="lg">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{files.length > 0 ? `Total ${files.length} files` : 'No files'}</span>
            {selectedFiles.size > 0 && (
              <span className="ml-2 text-banana-600">
                {selectedFiles.size} selected
              </span>
            )}
            {isLoading && files.length > 0 && (
              <RefreshCw size={14} className="animate-spin text-gray-400" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Project Filter Dropdown */}
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-banana-500"
            >
              <option value="all">All Attachments</option>
              <option value="none">Unclassified</option>
              {projectId && projectId !== 'global' && projectId !== 'none' && (
                <option value={projectId}>Current Project</option>
              )}
            </select>
            
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={16} />}
              onClick={loadFiles}
              disabled={isLoading}
            >
              Refresh
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              icon={<Upload size={16} />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </Button>
            
            {selectedFiles.size > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Clear Selection
              </Button>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md"
          onChange={handleUpload}
          className="hidden"
        />

        {/* File List */}
        <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              <span className="ml-2 text-gray-500">Loading...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mb-2" />
              <p>No reference files</p>
              <p className="text-sm mt-1">Click "Upload File" to add files</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {files.map((file) => {
                const isSelected = selectedFiles.has(file.id);
                const isDeleting = deletingIds.has(file.id);
                const isPending = file.parse_status === 'pending';

                return (
                  <div
                    key={file.id}
                    onClick={() => handleSelectFile(file)}
                    className={`
                      p-4 cursor-pointer transition-colors
                      ${isSelected ? 'bg-banana-50 border-l-4 border-l-banana-500' : 'hover:bg-gray-50'}
                      ${file.parse_status === 'failed' ? 'opacity-60' : ''}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center
                            ${isSelected
                              ? 'bg-banana-500 border-banana-500'
                              : 'border-gray-300'
                            }
                            ${file.parse_status === 'failed' ? 'opacity-50' : ''}
                          `}
                        >
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>

                      {/* File Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.filename}
                          </p>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatFileSize(file.file_size)}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-1.5 mt-1">
                          {getStatusIcon(file)}
                          <p className="text-xs text-gray-600">
                            {getStatusText(file)}
                            {isPending && (
                              <span className="ml-1 text-orange-500">(Parse on Confirm)</span>
                            )}
                          </p>
                        </div>

                        {/* Error Message */}
                        {file.parse_status === 'failed' && file.error_message && (
                          <p className="text-xs text-red-500 mt-1 line-clamp-1">
                            {file.error_message}
                          </p>
                        )}

                        {/* Image Caption Failure Warning */}
                        {file.parse_status === 'completed' && 
                         typeof file.image_caption_failed_count === 'number' && 
                         file.image_caption_failed_count > 0 && (
                          <p className="text-xs text-orange-500 mt-1">
                            ⚠️ {file.image_caption_failed_count} images failed to generate captions
                          </p>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteFile(e, file)}
                        disabled={isDeleting}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Delete File"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            💡 Tip: Selecting unparsed files will automatically trigger parsing
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedFiles.size === 0}
            >
              Confirm ({selectedFiles.size})
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
});

