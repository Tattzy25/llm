import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { EnhancedErrorBoundary, GlobalErrorHandler } from "@/components/error-boundary";
import { GlobalErrorToaster } from "@/components/global-error-toaster";
import { NotificationProvider } from "@/components/notification-system";

export const metadata: Metadata = {
  title: "Digital Hustle Lab - LLM Application",
  description: "Advanced LLM application with MCP server ecosystem for digital hustle and productivity",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NotificationProvider>
            <EnhancedErrorBoundary>
              {children}
              <GlobalErrorHandler />
              <GlobalErrorToaster />
            </EnhancedErrorBoundary>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
