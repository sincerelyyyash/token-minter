
import React from "react";
import { WalletContextProvider } from "../components/WalletContextProvider";
import { TokenCreationForm } from "../components/TokenCreationForm";

export default function App() {
  return (
    <WalletContextProvider>
      <TokenCreationForm />
    </WalletContextProvider>
  );
}

