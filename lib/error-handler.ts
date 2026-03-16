import { NextResponse } from 'next/server';

/** Wrap an API handler with global error handling (Issue 21) */
export function safeHandler<T extends (...args: any[]) => Promise<NextResponse>>(handler: T): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      // Never expose raw DB errors, stack traces, or internal paths
      let message = 'An unexpected error occurred';
      let code = 'INTERNAL_ERROR';

      if (error instanceof Error) {
        // Sanitize: strip SQLite/file paths/stack traces
        const msg = error.message;
        if (msg.includes('UNIQUE constraint')) {
          message = 'Duplicate entry';
          code = 'DUPLICATE';
          return NextResponse.json({ error: message, code }, { status: 409 });
        }
        if (msg.includes('NOT NULL constraint')) {
          message = 'Missing required field';
          code = 'VALIDATION_ERROR';
          return NextResponse.json({ error: message, code }, { status: 400 });
        }
        // Don't expose internal error details
      }

      return NextResponse.json({ error: message, code }, { status: 500 });
    }
  }) as T;
}
