import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interactive API Docs — Monetize Your Agent',
  description: 'Interactive API explorer powered by Scalar.',
};

export default function ApiDocsPage() {
  const specUrl = '/api/docs';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <div
          dangerouslySetInnerHTML={{
            __html: `
              <script id="api-reference" data-url="${specUrl}"></script>
              <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
            `,
          }}
        />
      </body>
    </html>
  );
}
