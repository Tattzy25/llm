"use client";
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications } from './notification-system';

const ImageConverter = () => {
  const { showError, showSuccess } = useNotifications();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileTags, setFileTags] = useState<Record<number, string>>({});
  const [urls, setUrls] = useState<string[]>([]);
  const maxFiles = 10;

  // Generate URLs for each file using its individual tag
  const generateUrls = async () => {
    if (selectedFiles.length === 0) {
      showError('No files', 'Please select images first');
      return;
    }
    if (selectedFiles.length > maxFiles) {
      showError('Too many files', `Max ${maxFiles}`);
      return;
    }
    setUrls([]);
    const newUrls: string[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileTag = fileTags[i] || '';
      const formData = new FormData();
      formData.append('files', file);
      if (fileTag) formData.append('tag', fileTag);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        newUrls.push(data.urls[0]);
      } catch (e: any) {
        showError('Upload Error', e.message);
        return;
      }
    }
    setUrls(newUrls);
    showSuccess('Upload Complete', 'Generated image URLs');
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    setSelectedFiles(files.slice(0, maxFiles));
    setUrls([]);
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <div className="w-full max-w-3xl space-y-6">
        <Card>
          <CardHeader><CardTitle>Image Uploader</CardTitle></CardHeader>
          <CardContent>
            <div
              className={`relative p-8 border-2 border-dashed border-orange-500 rounded-md cursor-pointer transition-shadow ${dragActive ? 'shadow-lg shadow-orange-400/50 bg-orange-50' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <p className="text-center text-sm text-muted-foreground">
                {dragActive ? 'Drop images here' : 'Click or drag images to select'}
              </p>
              <input
                type="file"
                accept="image/png,image/jpeg"
                multiple
                className="absolute inset-0 w-full h-full opacity-0"
                aria-label="Upload Images"
                title="Upload Images"
                onChange={e => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  setSelectedFiles(files.slice(0, maxFiles));
                  setUrls([]);
                }}
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-4">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <img src={URL.createObjectURL(file)} alt={file.name} className="h-24 w-full object-cover rounded mb-2" />
                      <Input placeholder="Tag (optional)" value={fileTags[idx] || ''} onChange={e => setFileTags(prev => ({ ...prev, [idx]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button onClick={generateUrls}>Generate URLs</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {urls.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Generated Image URLs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {urls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input readOnly value={url} className="flex-1" />
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(url)}>Copy</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ImageConverter;
