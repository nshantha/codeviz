'use client';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-pre:my-2 prose-li:my-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';

          return !inline && language ? (
            <div className="relative my-4 rounded-lg overflow-hidden border border-gray-700">
              {/* Language badge */}
              <div className="absolute top-2 right-2 z-10 px-2 py-1 text-xs font-mono bg-gray-800/80 text-gray-300 rounded">
                {language}
              </div>

              <SyntaxHighlighter
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  padding: '1.5rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  background: '#1e1e1e',
                }}
                codeTagProps={{
                  style: {
                    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  },
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code
              className="px-1.5 py-0.5 bg-gray-200 text-gray-800 rounded text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        },

        // Styled headers
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-3 border-b pb-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-bold text-gray-900 mt-5 mb-2">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
            {children}
          </h3>
        ),

        // Styled lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 my-3 pl-2">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 my-3 pl-2">
            {children}
          </ol>
        ),

        // Styled blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-3 bg-blue-50 rounded-r">
            {children}
          </blockquote>
        ),

        // Styled links
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-blue-600 hover:text-blue-800 underline font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),

        // Styled tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border-collapse border border-gray-300">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-gray-300 px-4 py-2">
            {children}
          </td>
        ),

        // Styled paragraphs
        p: ({ children }) => (
          <p className="text-gray-800 leading-relaxed my-2">
            {children}
          </p>
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
