// components/AdBanner.jsx
import Script from "next/script";

export default function AdBanner() {
  return (
    <>
      <Script id="ad-options" strategy="afterInteractive">
        {`
          atOptions = {
            key: "a34effd0684d90c0492a389ec8898599",
            format: "iframe",
            height: 90,
            width: 728,
            params: {}
          };
        `}
      </Script>

      <Script
        src="https://www.highperformanceformat.com/a34effd0684d90c0492a389ec8898599/invoke.js"
        strategy="afterInteractive"
      />
    </>
  );
}
