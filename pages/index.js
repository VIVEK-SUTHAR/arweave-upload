import { WebBundlr } from "@bundlr-network/client";
import { BigNumber, ethers } from "ethers";
import Head from "next/head";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [isConnetced, setIsConnetced] = useState(false);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [bundlerInstance, setBundlerInstance] = useState(undefined);
  const [fundAmmount, setFundAmmount] = useState(0);
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) throw new Error("Install Metamask");
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const connecetedAddress = await signer.getAddress();
      setAddress(connecetedAddress);
      setIsConnetced(true);
    } catch (error) {}
  };
  useEffect(() => {
    if (!bundlerInstance) {
      initialiseBundlr();
    }
    if (bundlerInstance) {
      fetchBalance();
    }
  });
  const initialiseBundlr = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider._ready();
    const bundlr = new WebBundlr(
      "https://devnet.bundlr.network",
      "matic",
      provider,
      {
        providerUrl: "https://rpc.ankr.com/polygon_mumbai",
      }
    );
    await bundlr.ready();
    setBundlerInstance(bundlr);
  };
  async function fundWallet() {
    try {
      if (bundlerInstance) {
        if (!fundAmmount) return;
        const amountParsed = parseInput(fundAmmount);
        if (amountParsed) {
          let response = await bundlerInstance.fund(amountParsed);
          console.log("Wallet funded: ", response);
          alert(response)
        }
        fetchBalance();
      }
    } catch (error) {
      console.log("error", error);
    }
  }
  async function fetchBalance() {
    if (bundlerInstance) {
      const balance = await bundlerInstance.getLoadedBalance();
      setBalance(ethers.utils.formatEther(balance.toString()));
    }
  }
  function parseInput(input) {
    const conversion = new BigNumber(input).multipliedBy(
      bundlerInstance.currencyConfig.base[1]
    );
    if (conversion.isLessThan(1)) {
      console.log("error: value too small");
      return;
    } else {
      return conversion;
    }
  }
  return (
    <div className={styles.container}>
      <Head>
        <title>Arweave Upload</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {!isConnetced && (
        <button onClick={connectWallet} className={styles.button}>
          Connect Wallet
        </button>
      )}
      {address.length > 0 && <p>Connected to address: {address}</p>}
      <div>
        <h3>Bundler balance : {balance} Matic</h3>
        <div>
          <button className={styles.button} onClick={fundWallet}>Fund Bundler</button>
          <input
            type={"number"}
            value={fundAmmount}
            className={styles.input}
            onChange={(e) => {
              e.preventDefault();
              setFundAmmount(e.target.value);
            }}
          />
        </div>
      </div>
    </div>
  );
}
