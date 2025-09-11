import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { GenerateButton } from '.';
import { FileTags } from './types';

interface PreviewProps {
  selectedFiles: File[];
  fileTags: FileTags;
  setFileTags: React.Dispatch<React.SetStateAction<FileTags>>;
  generateUrls: () => void;
  loading: boolean;
}

const Preview: React.FC<PreviewProps> = ({ selectedFiles, fileTags, setFileTags, generateUrls, loading }) => (
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
        <GenerateButton generateUrls={generateUrls} loading={loading} />
      </div>
    </CardContent>
  </Card>
);

export default Preview;
