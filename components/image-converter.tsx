"use client";
import React, { useState, ChangeEvent } from 'react';
import styled from 'styled-components';
import Loader from './Loader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications } from './notification-system';

const StyledWrapper = styled.div`
  .custum-file-upload {
    height: 200px;
    width: 300px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    border: 2px dashed #f54a00;
    background-color: #212121;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0px 48px 35px -48px #f54a00;
  }
  .custum-file-upload .icon { display: flex; align-items: center; justify-content: center; }
  .custum-file-upload .icon svg { height: 80px; fill: #e8e8e8; }
  .custum-file-upload .text { display: flex; align-items: center; justify-content: center; }
  .custum-file-upload .text span { font-weight: 400; color: #e8e8e8; }
  .custum-file-upload input { display: none; }
`;

// Overlay covers the content container only
const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Wrapper for the fancy generate button
const GenerateButtonWrapper = styled.div`
  .button {
    margin: 0;
    height: auto;
    background: transparent;
    padding: 0;
    border: none;
    cursor: pointer;
    /* fancy styling */
    --border-right: 6px;
    --text-stroke-color: rgba(255,255,255,0.6);
    --animation-color: #f54a00;
    --fs-size: 1.25em;
    letter-spacing: 3px;
    font-size: var(--fs-size);
    font-family: Arial;
    position: relative;
    text-transform: uppercase;
    color: transparent;
    -webkit-text-stroke: 1px var(--text-stroke-color);
  }
  .hover-text {
    position: absolute;
    box-sizing: border-box;
    color: var(--animation-color);
    width: 0%;
    inset: 0;
    border-right: var(--border-right) solid var(--animation-color);
    overflow: hidden;
    transition: 0.5s;
    -webkit-text-stroke: 1px var(--animation-color);
  }
  .button:hover .hover-text {
    width: 100%;
    filter: drop-shadow(0 0 23px var(--animation-color));
  }
`;

const ImageConverter: React.FC = () => {
  const { showError } = useNotifications();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileTags, setFileTags] = useState<Record<number, string>>({});
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
    <>
      {loading && (
        <Overlay>
          <Loader />
        </Overlay>
      )}
  <div className="relative flex flex-col items-center p-4 space-y-6 w-full">

        {/* Uploader Card: replace inner drop div with custom styled form */}
  <Card className="w-full max-w-3xl">
          <CardContent className="flex justify-center">
            <StyledWrapper>
              <label htmlFor="file" className="custum-file-upload">
                <div className="icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 1C9.73478 1 9.48043 1.10536 9.29289 1.29289L3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8V20C3 21.6569 4.34315 23 6 23H7C7.55228 23 8 22.5523 8 22C8 21.4477 7.55228 21 7 21H6C5.44772 21 5 20.5523 5 20V9H10C10.5523 9 11 8.55228 11 8V3H18C18.5523 3 19 3.44772 19 4V9C19 9.55228 19.4477 10 20 10C20.5523 10 21 9.55228 21 9V4C21 2.34315 19.6569 1 18 1H10ZM9 7H6.41421L9 4.41421V7ZM14 15.5C14 14.1193 15.1193 13 16.5 13C17.8807 13 19 14.1193 19 15.5V16V17H20C21.1046 17 22 17.8954 22 19C22 20.1046 21.1046 21 20 21H13C11.8954 21 11 20.1046 11 19C11 17.8954 11.8954 17 13 17H14V16V15.5ZM16.5 11C14.142 11 12.2076 12.8136 12.0156 15.122C10.2825 15.5606 9 17.1305 9 19C9 21.2091 10.7909 23 13 23H20C22.2091 23 24 21.2091 24 19C24 17.1305 22.7175 15.5606 20.9844 15.122C20.7924 12.8136 18.858 11 16.5 11Z" fill="#e8e8e8"/>
                  </svg>
                </div>
                <div className="text"><span>Click to upload image</span></div>
                <input
                  id="file"
                  type="file"
                  accept="image/png,image/jpeg"
                  multiple
                  onChange={handleFileChange}
                />
              </label>
            </StyledWrapper>
          </CardContent>
        </Card>

        {/* Preview Card with tags under images */}
        {selectedFiles.length > 0 && (
    <Card className="w-full max-w-3xl">
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <img src={URL.createObjectURL(file)} alt={file.name} className="h-24 w-full object-cover rounded" />
                    <Input
                      placeholder="Tag (optional)"
                      value={fileTags[idx] || ''}
                      onChange={e => setFileTags({ ...fileTags, [idx]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <GenerateButtonWrapper>
                  <button className="button" onClick={generateUrls}>
                    <span className="actual-text">&nbsp;generate&nbsp;</span>
                    <span aria-hidden="true" className="hover-text">&nbsp;generate&nbsp;</span>
                  </button>
                </GenerateButtonWrapper>
              </div>
            </CardContent>
          </Card>
        )}

        {/* URLs Card */}
        {urls.length > 0 && (
          <Card className="w-full max-w-3xl">
            <CardHeader>
              <div className="flex justify-end items-center">
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(urls.join('\n'))}>
                  Copy All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {urls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input readOnly value={url} className="flex-1" />
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(url)}>
                    Copy
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default ImageConverter;
