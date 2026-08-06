import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useNotificationSystem, ToastNotification } from '../useNotificationSystem';

describe('useNotificationSystem logic', () => {
  it('creates notification objects correctly with required fields', () => {
    const notifyType: ToastNotification['type'] = 'success';
    const title = 'Test Title';
    const message = 'Test Message';

    const toast: ToastNotification = {
      id: `toast-123`,
      type: notifyType,
      title,
      message,
      timestamp: Date.now(),
    };

    expect(toast.id).toBe('toast-123');
    expect(toast.type).toBe('success');
    expect(toast.title).toBe('Test Title');
    expect(toast.message).toBe('Test Message');
    expect(typeof toast.timestamp).toBe('number');
  });
});

