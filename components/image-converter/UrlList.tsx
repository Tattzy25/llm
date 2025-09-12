import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface UrlListProps {
  urls: string[];
}

const UrlList: React.FC<UrlListProps> = ({ urls }) => (
  <Card className="w-full max-w-3xl">
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
);

export default UrlList;
