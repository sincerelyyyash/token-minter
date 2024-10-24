import React, { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Keypair, Transaction, SystemProgram } from "@solana/web3.js";
import { createMintToInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
export const TokenCreationForm: React.FC = () => {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(9);
  const [supply, setSupply] = useState(1000000);
  const [message, setMessage] = useState("");
  const createToken = useCallback(async () => {
    try {
      if (!connected || !publicKey) {
        setMessage("Wallet not connected. Please connect your wallet.");
        return;
      }
      const mintAccount = Keypair.generate();
      const lamports = Number(await connection.getMinimumBalanceForRentExemption(82));
      const createAccountIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: mintAccount.publicKey,
        lamports,
        space: 82,
        programId: TOKEN_PROGRAM_ID,
      });
      const mintIx = createMintToInstruction(
        TOKEN_PROGRAM_ID,
        mintAccount.publicKey,
        publicKey,
        // publicKey,
        // [],
        supply
      );
      const transaction = new Transaction().add(createAccountIx, mintIx);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      const signature = await sendTransaction(transaction, connection, { signers: [mintAccount] });
      await connection.confirmTransaction(signature, "confirmed");
      setMessage(`Token Created! Mint Address: ${mintAccount.publicKey.toBase58()}\nTransaction Signature: ${signature}`);
    } catch (error) {
      console.error("Error creating token:", error);
      setMessage("Failed to create token.");
    }
  }, [connected, publicKey, connection, decimals, supply, sendTransaction]);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Create Your Token</h1>
      <div className="w-full max-w-md">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Token Name</label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Token Symbol</label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Decimals</label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="number"
            value={decimals}
            onChange={(e) => setDecimals(parseInt(e.target.value))}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Initial Supply</label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="number"
            value={supply}
            onChange={(e) => setSupply(parseInt(e.target.value))}
          />
        </div>
        <WalletMultiButton />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
          onClick={createToken}
          disabled={!connected}
        >
          Create Token
        </button>
        {message && <p className="mt-4 text-green-500">{message}</p>}
      </div>
    </div>
  );
};
