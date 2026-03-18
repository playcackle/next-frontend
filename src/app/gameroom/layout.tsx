import { ReactNode } from 'react';
import { GameroomErrorBoundary } from "./components/GameroomErrorBoundary";

// Force dynamic rendering for all gameroom pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function GameroomLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <GameroomErrorBoundary>{children}</GameroomErrorBoundary>;
}