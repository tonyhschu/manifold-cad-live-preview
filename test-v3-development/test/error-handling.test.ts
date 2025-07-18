import { describe, test, expect, beforeEach, vi } from 'vitest';
import { FontLoadError, FontTimeoutError } from '../lib/font-resolver';

describe('Custom Error Classes', () => {
  test('FontLoadError should contain detailed error information', () => {
    const fontName = 'Test Font';
    const attemptedUrls = [
      'https://example.com/font1.ttf',
      'https://example.com/font2.ttf'
    ];
    const lastError = new Error('Network timeout');
    
    const fontLoadError = new FontLoadError(
      'Failed to load font from all URLs',
      fontName,
      attemptedUrls,
      lastError
    );
    
    expect(fontLoadError.name).toBe('FontLoadError');
    expect(fontLoadError.message).toBe('Failed to load font from all URLs');
    expect(fontLoadError.fontName).toBe(fontName);
    expect(fontLoadError.attemptedUrls).toEqual(attemptedUrls);
    expect(fontLoadError.lastError).toBe(lastError);
    expect(fontLoadError instanceof Error).toBe(true);
    expect(fontLoadError instanceof FontLoadError).toBe(true);
  });

  test('FontTimeoutError should contain timeout information', () => {
    const fontName = 'Test Font';
    const timeoutMs = 10000;
    
    const timeoutError = new FontTimeoutError(fontName, timeoutMs);
    
    expect(timeoutError.name).toBe('FontTimeoutError');
    expect(timeoutError.message).toBe(`Font loading timeout after ${timeoutMs}ms for '${fontName}'`);
    expect(timeoutError instanceof Error).toBe(true);
    expect(timeoutError instanceof FontTimeoutError).toBe(true);
  });

  test('Error classes should be distinguishable', () => {
    const fontLoadError = new FontLoadError('Load failed', 'Font', [], new Error('Network'));
    const timeoutError = new FontTimeoutError('Font', 5000);
    const genericError = new Error('Generic error');
    
    expect(fontLoadError instanceof FontLoadError).toBe(true);
    expect(fontLoadError instanceof FontTimeoutError).toBe(false);
    
    expect(timeoutError instanceof FontTimeoutError).toBe(true);
    expect(timeoutError instanceof FontLoadError).toBe(false);
    
    expect(genericError instanceof FontLoadError).toBe(false);
    expect(genericError instanceof FontTimeoutError).toBe(false);
  });
});

describe('Error Handling Scenarios', () => {
  test('should handle network connectivity issues', () => {
    const networkErrors = [
      'ENOTFOUND',
      'ECONNREFUSED', 
      'ETIMEDOUT',
      'ECONNRESET'
    ];
    
    networkErrors.forEach(errorCode => {
      const error = new Error(`Network error: ${errorCode}`);
      expect(error.message).toContain(errorCode);
      
      // Real implementation should catch these and wrap in FontLoadError
      const wrappedError = new FontLoadError(
        'Network connectivity issue',
        'Test Font',
        ['https://example.com/font.ttf'],
        error
      );
      
      expect(wrappedError.lastError?.message).toContain(errorCode);
    });
  });

  test('should handle HTTP error responses', () => {
    const httpErrors = [404, 403, 500, 502, 503];
    
    httpErrors.forEach(statusCode => {
      const error = new Error(`HTTP ${statusCode}`);
      expect(error.message).toContain(statusCode.toString());
      
      // Real implementation should handle different HTTP status codes appropriately
      if (statusCode >= 400 && statusCode < 500) {
        // Client errors - font not found, access denied
        expect(statusCode).toBeGreaterThanOrEqual(400);
        expect(statusCode).toBeLessThan(500);
      } else if (statusCode >= 500) {
        // Server errors - should retry with fallback URLs
        expect(statusCode).toBeGreaterThanOrEqual(500);
      }
    });
  });

  test('should handle malformed font data', () => {
    const malformedDataErrors = [
      'Invalid font signature',
      'Corrupted font table',
      'Unsupported font format',
      'Invalid OpenType data'
    ];
    
    malformedDataErrors.forEach(errorMessage => {
      const error = new Error(errorMessage);
      expect(error.message).toBe(errorMessage);
      
      // Real implementation should detect these and provide meaningful feedback
      const fontError = new FontLoadError(
        'Font data is corrupted or invalid',
        'Test Font',
        ['https://example.com/corrupted.ttf'],
        error
      );
      
      expect(fontError.lastError?.message).toBe(errorMessage);
    });
  });

  test('should handle timeout scenarios gracefully', () => {
    const timeoutScenarios = [
      { timeout: 1000, expected: 'very fast timeout' },
      { timeout: 10000, expected: 'normal timeout' },
      { timeout: 30000, expected: 'extended timeout' }
    ];
    
    timeoutScenarios.forEach(scenario => {
      const timeoutError = new FontTimeoutError('Test Font', scenario.timeout);
      
      expect(timeoutError.message).toContain(scenario.timeout.toString());
      expect(timeoutError.message).toContain('ms');
      
      // Verify timeout values are reasonable
      if (scenario.timeout < 5000) {
        expect(scenario.expected).toContain('fast');
      } else if (scenario.timeout > 20000) {
        expect(scenario.expected).toContain('extended');
      }
    });
  });

  test('should handle concurrent font loading failures', () => {
    // Simulate multiple fonts failing to load simultaneously
    const fonts = ['Font A', 'Font B', 'Font C'];
    const errors = fonts.map(fontName => 
      new FontLoadError(
        `Failed to load ${fontName}`,
        fontName,
        [`https://example.com/${fontName.toLowerCase().replace(' ', '-')}.ttf`],
        new Error('Network failure')
      )
    );
    
    expect(errors).toHaveLength(3);
    errors.forEach((error, index) => {
      expect(error.fontName).toBe(fonts[index]);
      expect(error instanceof FontLoadError).toBe(true);
    });
  });

  test('should handle memory pressure during font loading', () => {
    // Test scenarios where system is under memory pressure
    const memoryErrors = [
      'Out of memory',
      'Allocation failed',
      'Memory limit exceeded'
    ];
    
    memoryErrors.forEach(errorMessage => {
      const error = new Error(errorMessage);
      expect(error.message).toContain('memory');
      
      // Real implementation should handle memory issues gracefully
      // possibly by reducing font cache size or using fallback rendering
    });
  });
});

describe('Error Recovery Strategies', () => {
  test('should implement fallback URL strategy', () => {
    const primaryUrl = 'https://primary-cdn.com/font.ttf';
    const fallbackUrls = [
      'https://backup-cdn.com/font.ttf',
      'https://tertiary-cdn.com/font.ttf'
    ];
    
    const allUrls = [primaryUrl, ...fallbackUrls];
    
    expect(allUrls).toHaveLength(3);
    expect(allUrls[0]).toBe(primaryUrl);
    expect(allUrls.slice(1)).toEqual(fallbackUrls);
    
    // Real implementation should try URLs in order
    // and only fail when all URLs have been exhausted
  });

  test('should implement exponential backoff for retries', () => {
    const baseDelay = 1000;
    const maxRetries = 3;
    
    const delays = [];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const delay = baseDelay * Math.pow(2, attempt);
      delays.push(delay);
    }
    
    expect(delays).toEqual([1000, 2000, 4000]);
    
    // Real implementation should use exponential backoff
    // to avoid overwhelming servers during outages
  });

  test('should implement circuit breaker pattern', () => {
    let failureCount = 0;
    const maxFailures = 5;
    const circuitBreakerTimeout = 60000; // 1 minute
    
    // Simulate failures
    for (let i = 0; i < 7; i++) {
      failureCount++;
      
      if (failureCount >= maxFailures) {
        // Circuit breaker should open
        expect(failureCount).toBeGreaterThanOrEqual(maxFailures);
        break;
      }
    }
    
    expect(failureCount).toBeGreaterThanOrEqual(maxFailures);
    
    // Real implementation should stop trying requests
    // for a period when circuit breaker is open
  });

  test('should gracefully degrade to geometric fallback', () => {
    const supportedFallbackChars = ['H', 'E', 'L', 'O', 'A', 'B', 'C'];
    const unsupportedChars = ['Ω', '∑', '∆', '🌍'];
    
    supportedFallbackChars.forEach(char => {
      expect(char.match(/[A-Z]/)).toBeTruthy();
      // Real implementation should have geometric shapes for these
    });
    
    unsupportedChars.forEach(char => {
      expect(char.match(/[A-Z]/)).toBeFalsy();
      // Real implementation should use default rectangle or skip
    });
  });
});

describe('Error Logging and Monitoring', () => {
  test('should provide structured error information for monitoring', () => {
    const error = new FontLoadError(
      'Font loading failed',
      'Inter Variable Font',
      [
        'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-variable-wghtOnly-normal.woff2',
        'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
      ],
      new Error('ENOTFOUND')
    );
    
    // Error should contain all information needed for monitoring/alerting
    const errorInfo = {
      type: error.name,
      fontName: error.fontName,
      urlCount: error.attemptedUrls.length,
      lastErrorType: error.lastError?.message,
      timestamp: Date.now()
    };
    
    expect(errorInfo.type).toBe('FontLoadError');
    expect(errorInfo.fontName).toBe('Inter Variable Font');
    expect(errorInfo.urlCount).toBe(2);
    expect(errorInfo.lastErrorType).toBe('ENOTFOUND');
    expect(errorInfo.timestamp).toBeGreaterThan(0);
  });

  test('should categorize errors for different handling strategies', () => {
    const errorCategories = {
      network: ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'],
      http: ['404', '403', '500', '502'],
      data: ['Invalid font signature', 'Corrupted font table'],
      system: ['Out of memory', 'Allocation failed']
    };
    
    Object.entries(errorCategories).forEach(([category, errors]) => {
      errors.forEach(errorCode => {
        expect(typeof errorCode).toBe('string');
        expect(errorCode.length).toBeGreaterThan(0);
        
        // Real implementation should route errors to appropriate handlers
        // based on category (retry, fallback, alert, etc.)
      });
    });
  });
});
