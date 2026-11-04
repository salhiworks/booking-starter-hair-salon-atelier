import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { applyBrand, applyMeta, contentStore, ContentContext, type Content } from './content';

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Content>(() => contentStore.initial());

  useEffect(() => {
    let current = true;
    void contentStore.load().then((next) => {
      if (current) setContent(next);
    });
    return () => {
      current = false;
    };
  }, []);

  // Before paint, so a returning visitor never sees the default colours flash.
  useLayoutEffect(() => {
    applyBrand(content.values);
    applyMeta(content.values);
  }, [content.values]);

  // Where the shown content came from (snapshot/cache/defaults first, then published or draft): for tests and debugging.
  useLayoutEffect(() => {
    document.documentElement.dataset.contentSource = content.source;
  }, [content.source]);

  return <ContentContext value={content}>{children}</ContentContext>;
}
