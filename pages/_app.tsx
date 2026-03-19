import type { AppProps } from "next/app";
import { AppProviders } from "@/lib/providers/AppProviders";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  if (process.env.NEXT_PUBLIC_MAINTENANCE === "true") {
    return <>Maintain</>; // แสดงหน้าปิดปรับปรุงแทนทุกหน้า
  }
  // return <Component {...pageProps} />;
  return (
    <AppProviders>
      <Component {...pageProps} />
    </AppProviders>
  );
}
