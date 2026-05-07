import { useEffect, useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import { api } from '@/services/apiClient';
import { cn } from '@/lib/utils';

interface AuthedImageProps {
  fileId?: string | null;
  alt: string;
  className?: string;
  emptyLabel?: string;
}

export function AuthedImage({ fileId, alt, className, emptyLabel = 'Not provided' }: AuthedImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  useEffect(() => {
    let revoked = false;
    let createdUrl: string | null = null;

    if (!fileId) {
      setUrl(null);
      setStatus('idle');
      return;
    }

    setStatus('loading');
    api
      .get<Blob>(`/files/${fileId}`, { responseType: 'blob' })
      .then((res) => {
        if (revoked) return;
        createdUrl = URL.createObjectURL(res.data);
        setUrl(createdUrl);
        setStatus('ok');
      })
      .catch(() => {
        if (revoked) return;
        setStatus('error');
      });

    return () => {
      revoked = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [fileId]);

  const wrapper = cn(
    'flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-slate-400',
    className,
  );

  if (!fileId) {
    return (
      <div className={wrapper}>
        <div className="text-center text-xs px-3 py-6">
          <ImageOff className="w-6 h-6 mx-auto mb-2 opacity-50" />
          {emptyLabel}
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className={wrapper}>
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (status === 'error' || !url) {
    return (
      <div className={wrapper}>
        <div className="text-center text-xs px-3 py-6">
          <ImageOff className="w-6 h-6 mx-auto mb-2 opacity-50" />
          Failed to load
        </div>
      </div>
    );
  }

  return <img src={url} alt={alt} className={cn('object-cover w-full h-full', className)} />;
}
