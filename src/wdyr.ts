// Dev-only — why-did-you-render setup
// Import this file at the top of src/app/layout.tsx in development only.
// NEVER import in production — WDYR slows React and is not safe for prod.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    trackAllPureComponents: false, // opt-in per component via .whyDidYouRender = true
    logOnDifferentValues: true,
  });
}

export {};

