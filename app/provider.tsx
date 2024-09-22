"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { type State, WagmiProvider } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
  midnightTheme,
  darkTheme,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import {
  rainbowWallet,
  walletConnectWallet,
  coreWallet,
  ledgerWallet,
  metaMaskWallet,
} from "@rainbow-me/rainbowkit/wallets";

import { getConfig } from "./wagmi";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [rainbowWallet, walletConnectWallet, coreWallet, metaMaskWallet ],
    },
  ],
  {
    appName: "My RainbowKit App",
    projectId: "YOUR_PROJECT_ID",
  }
);

export default function Providers(props: {
  children: ReactNode;
  initialState?: State;
}) {
  const [config] = useState(() => getConfig(connectors));
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config} initialState={props.initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={11155111}
          theme={midnightTheme()}
          coolMode
          modalSize="wide"
        >
          {props.children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
