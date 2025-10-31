import React, { useRef } from 'react';
import { Paperclip, Upload, FileText, Download } from 'lucide-react';
import { CaseAttachment } from '../../../../../types';
import { formatRelativeTime } from '../../../../../utils/formatters';

interface AttachmentsTabProps {
  attachments: CaseAttachment[];
  onAddAttachment: (file: File) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AttachmentsTab: React.FC<AttachmentsTabProps> = ({ attachments, onAddAttachment }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAddAttachment(e.target.files[0]);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 mb-4">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <button
          onClick={handleUploadClick}
          className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          <Upload className="h-5 w-5" />
          <span className="font-semibold">Add Attachment</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pr-2">
        {attachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
            <Paperclip className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="font-semibold text-gray-700">No attachments</h3>
            <p className="text-sm mt-1">Upload relevant documents like clinical notes or auth letters.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {attachments.map(attachment => (
              <li key={attachment.id} className="flex items-center gap-3 p-2 rounded-md bg-gray-50 border hover:bg-gray-100">
                <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-gray-800 truncate" title={attachment.fileName}>{attachment.fileName}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.fileSize)} • {attachment.uploadedBy} • {formatRelativeTime(attachment.uploadedAt)}
                  </p>
                </div>
                <button className="p-2 rounded-full text-gray-500 hover:bg-gray-200" title="Download">
                  <Download className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AttachmentsTab;