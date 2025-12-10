import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dataEvents, clearAllListeners, subscribe, emit, getListenerCount } from '@/lib/events';

describe('dataEvents', () => {
  beforeEach(() => {
    clearAllListeners();
  });

  it('notifies subscribers on emit', () => {
    const callback = vi.fn();
    subscribe(callback);
    emit({ type: 'PROGRESS_UPDATED', slug: 'test' });
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith({ type: 'PROGRESS_UPDATED', slug: 'test' });
  });

  it('notifies multiple subscribers', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    subscribe(callback1);
    subscribe(callback2);
    emit({ type: 'PROGRESS_UPDATED', slug: 'test' });
    expect(callback1).toHaveBeenCalledOnce();
    expect(callback2).toHaveBeenCalledOnce();
  });

  it('unsubscribe stops notifications', () => {
    const callback = vi.fn();
    const unsub = subscribe(callback);
    unsub();
    emit({ type: 'PROGRESS_UPDATED', slug: 'test' });
    expect(callback).not.toHaveBeenCalled();
  });

  it('filters by event type when specified', () => {
    const callback = vi.fn();
    subscribe(callback, ['SESSION_COMPLETED']);
    emit({ type: 'PROGRESS_UPDATED', slug: 'test' });
    expect(callback).not.toHaveBeenCalled();
    emit({ type: 'SESSION_COMPLETED', slug: 'test', sessionIndex: 1 });
    expect(callback).toHaveBeenCalledOnce();
  });

  it('handles multiple event type filters', () => {
    const callback = vi.fn();
    subscribe(callback, ['SESSION_COMPLETED', 'PROGRESS_UPDATED']);
    emit({ type: 'HISTORY_UPDATED', slug: 'test' });
    expect(callback).not.toHaveBeenCalled();
    emit({ type: 'PROGRESS_UPDATED', slug: 'test' });
    expect(callback).toHaveBeenCalledOnce();
    emit({ type: 'SESSION_COMPLETED', slug: 'test', sessionIndex: 1 });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('tracks listener count correctly', () => {
    expect(getListenerCount()).toBe(0);
    const unsub1 = subscribe(vi.fn());
    expect(getListenerCount()).toBe(1);
    const unsub2 = subscribe(vi.fn());
    expect(getListenerCount()).toBe(2);
    unsub1();
    expect(getListenerCount()).toBe(1);
    unsub2();
    expect(getListenerCount()).toBe(0);
  });

  it('clearAllListeners removes all listeners', () => {
    subscribe(vi.fn());
    subscribe(vi.fn());
    expect(getListenerCount()).toBe(2);
    clearAllListeners();
    expect(getListenerCount()).toBe(0);
  });

  it('handles subscriber errors gracefully', () => {
    const errorCallback = vi.fn(() => {
      throw new Error('Test error');
    });
    const successCallback = vi.fn();
    subscribe(errorCallback);
    subscribe(successCallback);
    
    // Should not throw
    expect(() => emit({ type: 'PROGRESS_UPDATED', slug: 'test' })).not.toThrow();
    
    // Both callbacks should have been called
    expect(errorCallback).toHaveBeenCalledOnce();
    expect(successCallback).toHaveBeenCalledOnce();
  });
});

describe('dataEvents convenience methods', () => {
  beforeEach(() => {
    clearAllListeners();
  });

  it('emitSessionCompleted emits correct event', () => {
    const callback = vi.fn();
    dataEvents.subscribe(callback);
    dataEvents.emitSessionCompleted('test-slug', 3);
    expect(callback).toHaveBeenCalledWith({
      type: 'SESSION_COMPLETED',
      slug: 'test-slug',
      sessionIndex: 3,
    });
  });

  it('emitProgressUpdated emits correct event', () => {
    const callback = vi.fn();
    dataEvents.subscribe(callback);
    dataEvents.emitProgressUpdated('test-slug');
    expect(callback).toHaveBeenCalledWith({
      type: 'PROGRESS_UPDATED',
      slug: 'test-slug',
    });
  });

  it('emitHistoryUpdated emits correct event', () => {
    const callback = vi.fn();
    dataEvents.subscribe(callback);
    dataEvents.emitHistoryUpdated('test-slug');
    expect(callback).toHaveBeenCalledWith({
      type: 'HISTORY_UPDATED',
      slug: 'test-slug',
    });
  });

  it('emitEventRecorded emits correct event', () => {
    const callback = vi.fn();
    dataEvents.subscribe(callback);
    dataEvents.emitEventRecorded('test-slug', 'set_completed');
    expect(callback).toHaveBeenCalledWith({
      type: 'EVENT_RECORDED',
      slug: 'test-slug',
      eventType: 'set_completed',
    });
  });
});
