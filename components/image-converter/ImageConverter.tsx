"use client";
import React, { useState, ChangeEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Uploader, Preview, UrlList, LoaderOverlay, GenerateButton } from '.';
import type { FileTags } from './types';
import { useNotifications } from '@/components/notification-system';

const ImageConverter: React.FC = () => {
  const { showError } = useNotifications();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileTags, setFileTags] = useState<FileTags>({});
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const maxFiles = 10;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSelectedFiles(files.slice(0, maxFiles));
    setUrls([]);
  };

  const generateUrls = async () => {
    setLoading(true);
    if (!selectedFiles.length) {
      showError('No files', 'Please select images.');
      setLoading(false);
      return;
    }
    try {
      const form = new FormData();
      selectedFiles.forEach((file, i) => {
        form.append('files', file);
        if (fileTags[i]) form.append('tag', fileTags[i]);
      });
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUrls(data.urls || []);
    } catch (err: any) {
      showError('Upload Error', err.message);
    }
    setLoading(false);
  };

  return (
    <div className="relative flex flex-col items-center p-4 space-y-6 w-full">
      {loading && <LoaderOverlay />}
      <Uploader onFileChange={handleFileChange} />
      {selectedFiles.length > 0 && <Preview selectedFiles={selectedFiles} fileTags={fileTags} setFileTags={setFileTags} generateUrls={generateUrls} loading={loading} />}
      {urls.length > 0 && <UrlList urls={urls} />}
    </div>
  );
};

export default ImageConverter;
