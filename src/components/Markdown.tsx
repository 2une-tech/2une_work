'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  markdown: string;
  className?: string;
};

export function Markdown({ markdown, className }: Props) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children, ...props }) => (
            <h2 className="mt-5 text-base font-semibold text-foreground" {...props}>
              {children}
            </h2>
          ),
          h2: ({ children, ...props }) => (
            <h3 className="mt-5 text-sm font-semibold text-foreground" {...props}>
              {children}
            </h3>
          ),
          h3: ({ children, ...props }) => (
            <h4 className="mt-4 text-sm font-semibold text-foreground" {...props}>
              {children}
            </h4>
          ),
          p: ({ children, ...props }) => (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground" {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed" {...props}>
              {children}
            </li>
          ),
          a: ({ children, ...props }) => (
            <a className="text-primary underline underline-offset-2 hover:text-primary/90" {...props}>
              {children}
            </a>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

