import Header from "@/app/components/header";
import { Progress, Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "animate.css";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import type React from "react";
import { Suspense } from "react";
import "./globals.css";
import { Provider } from "./provider";

export const metadata: Metadata = {
  title: "Race. Claim. Win",
  description: "Snap answers first, win points. Chaotic and addictive!",
  generator: "v0.dev",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: "#0a0a1f",
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          overflow: "hidden",
        }}
      >
        <Theme>
          <div className="crt-container">
            <div className="crt-content">
              <Provider>
                <Suspense fallback={<Progress />}>
                  {/* <SynthwaveBackground /> */}
                  <Header session={session!} />
                  <main>{children}</main>
                </Suspense>
              </Provider>
            </div>
          </div>
        </Theme>
      </body>
    </html>
  );
}
