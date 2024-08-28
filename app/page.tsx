"use client";
import React, { useState, useEffect } from "react";
import { Connection, Transaction, Keypair, SystemProgram, PublicKey } from "@solana/web3.js";
import { createMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";

declare global {
  interface Window {
    solana?: any;
  }
}

export default function Home() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(9);
  const [supply, setSupply] = useState(1000000);
  const [message, setMessage] = useState("");
  const [phantomInstalled, setPhantomInstalled] = useState(false);

  useEffect(() => {
    if (window.solana && window.solana.isPhantom) {
      setPhantomInstalled(true);
    }
  }, []);

  const createToken = async () => {
    try {
      if (!phantomInstalled) {
        setMessage("Phantom wallet not found. Please install or enable it.");
        return;
      }

      const connection = new Connection("https://api.devnet.solana.com", "confirmed");

      // Connect to Phantom wallet
      const response = await window.solana.connect();
      if (!response.publicKey) {
        setMessage("Failed to retrieve public key from Phantom wallet.");
        return;
      }
      const publicKey = response.publicKey;
      console.log("Connected with public key:", publicKey.toString());

      // Generate a new keypair for the mint account
      const mintAccount = Keypair.generate();

      // Create a transaction
      const transaction = new Transaction();

      // Create mint account instruction
      const createAccountIx = SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: mintAccount.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(82),
        space: 82,
        programId: TOKEN_PROGRAM_ID,
      });

      // Initialize mint instruction
      const mintIx = await createMint(
        connection,
        publicKey, // Fee payer
        mintAccount.publicKey, // Mint authority
        publicKey, // Freeze authority
        decimals  // Number of decimals
      );

      // Add instructions to the transaction
      transaction.add(createAccountIx);
      transaction.add(mintIx);

      // Add recent blockhash and fee payer
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign the transaction using Phantom
      const signedTransaction = await window.solana.signTransaction(transaction);

      // Send the transaction
      const txSignature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(txSignature);

      setMessage(`Token Created! Mint Address: ${mintAccount.publicKey.toBase58()}\nTransaction Signature: ${txSignature}`);
    } catch (error) {
      console.error("Error creating token:", error);
      setMessage("Failed to create token.");
    }
  };

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
            onChange={(e) => setSymbol(e.target.value)} // Removed extra closing parenthesis here
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
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={createToken}
          disabled={!phantomInstalled}
        >
          Create Token
        </button>
        {message && <p className="mt-4 text-green-500">{message}</p>}
        {!phantomInstalled && <p className="mt-4 text-red-500">Phantom wallet not detected. Please install or enable it.</p>}
      </div>
    </div>
  );
}

