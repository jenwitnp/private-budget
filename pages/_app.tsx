import type { AppProps } from "next/app";
import { AppProviders } from "@/lib/providers/AppProviders";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppProviders>
      <Component {...pageProps} />
    </AppProviders>
  );
}
