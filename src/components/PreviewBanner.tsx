import { Eye } from 'lucide-react';
import { useContent } from '../lib/content';
import { engine } from '../lib/engine';
import { Icon } from './Icon';

/**
 * Preview mode (development without a backend), or the owner previewing
 * unpublished website changes (dashboard → Website → Preview).
 */
export function PreviewBanner() {
  const { preview, previewDenied } = useContent();
  if (preview) {
    return (
      <div className="preview-banner" role="status">
        <Icon icon={Eye} size={16} />
        <p>
          <strong>Preview of unpublished changes</strong> — only you can see this.{' '}
          <a href="/admin/#website">Back to the dashboard to publish</a>
        </p>
      </div>
    );
  }
  if (previewDenied) {
    return (
      <div className="preview-banner" role="status">
        <Icon icon={Eye} size={16} />
        <p>
          <strong>Preview</strong> — sign in to the dashboard in this browser to see unpublished changes. This is the
          published website.
        </p>
      </div>
    );
  }
  if (engine.mode !== 'preview') return null;
  return (
    <div className="preview-banner">
      <Icon icon={Eye} size={16} />
      <p>
        <strong>Preview</strong> — sample data, bookings are not saved
      </p>
    </div>
  );
}
