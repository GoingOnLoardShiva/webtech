import "./globals.css";
import { cx } from "@/src/utils";
import { Inter, Manrope } from "next/font/google";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import siteMetadata from "@/src/utils/siteMetaData";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-in",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mr",
});

export const metadata = {
  metadataBase: new URL(siteMetadata.siteUrl),
  title: {
    template: `%s | ${siteMetadata.title}`,
    default: siteMetadata.title,
  },
  description: siteMetadata.description,
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: siteMetadata.siteUrl,
    siteName: siteMetadata.title,
    images: [siteMetadata.socialBanner],
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: siteMetadata.title,
    images: [siteMetadata.socialBanner],
  },
  verification: {
    yandex: "59eb3137f7dd091b",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* //add cash// */}
        <script id="aclib" type="text/javascript" src="//acscdn.com/script/aclib.js"></script>
        <script id="aclib" type="text/javascript" src="//acscdn.com/script/aclib.js"></script>


        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NX8SDPZ4')
            `,
          }}
        />
        <meta name="monetag" content="63b51262a750b50b9f91c4b3ca276ce9"></meta>


        <meta
          name="google-site-verification"
          content="bIAcXNOt6yIh3QD-kye1XlO0LAt81zxtUjZH2VKdFNY"
        />
        <script src="https://confessinvaluable.com/17/ca/c4/17cac43918f11f42daa0cff0fdb02ff7.js"></script>
      </head>

      <body
        className={cx(
          inter.variable,
          manrope.variable,
          "font-mr bg-light dark:bg-dark"
        )}
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Y978GY5N80"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Y978GY5N80');
          `}
        </Script>

        {/* Theme Switcher */}
        <Script id="theme-switcher" strategy="beforeInteractive">
          {`
            if (
              localStorage.getItem('theme') === 'dark' ||
              (!('theme' in localStorage) &&
                window.matchMedia('(prefers-color-scheme: dark)').matches)
            ) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          `}
        </Script>
        <script src="https://pl28407662.effectivegatecpm.com/17/ca/c4/17cac43918f11f42daa0cff0fdb02ff7.js"></script>

        <script async="async" data-cfasync="false" src="https://pl28407725.effectivegatecpm.com/1ac2e82cee1612d6a34d01b4b05400c2/invoke.js"></script>
        <div id="container-1ac2e82cee1612d6a34d01b4b05400c2"></div>
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NX8SDPZ4"
          height="0" width="0" style={{ display: "none", visibility: "hidden" }}></iframe></noscript>

        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
