import { WebBundlr } from "@bundlr-network/client";
import { BigNumber, ethers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Loader from "../components/Loader";
import styles from "../styles/Home.module.css";
import fileReaderStream from "filereader-stream";

export default function Home() {
  const [isConnetced, setIsConnetced] = useState(false);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [bundlerInstance, setBundlerInstance] = useState(undefined);
  const [fundAmmount, setFundAmmount] = useState(0);
  const [isloading, setIsloading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [arweaveURL, setArweaveURL] = useState("");
  const inputref = useRef();
  const [file, setFile] = useState(null);
  const connectWallet = async () => {
    try {
      setIsloading((prevState) => !prevState);
      setLoadingMessage("Connecting Wallet");
      const { ethereum } = window;
      if (!ethereum) throw new Error("Install Metamask");
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const connecetedAddress = await signer.getAddress();
      setAddress(connecetedAddress);
      setIsConnetced((prevState) => !prevState);
      setIsloading((prevState) => !prevState);
      await initialiseBundlr();
      fetchBalance();
    } catch (error) {
    } finally {
      setIsloading(false);
    }
  };
  useEffect(() => {
    if (bundlerInstance) {
      fetchBalance();
    }
  }, [bundlerInstance]);
  const initialiseBundlr = async () => {
    try {
      setIsloading((prevState) => !prevState);
      setLoadingMessage("Connecting to Network...");
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
      setIsloading((prevState) => !prevState);
    } catch (error) {
      setIsloading(false);
    } finally {
      setIsloading(false);
    }
  };
  async function fundWallet() {
    try {
      if (!bundlerInstance) return;
      if (!fundAmmount) {
        showError();
        return;
      }
      const amountParsed = parseInput(fundAmmount);
      if (!amountParsed) return;
      setIsloading((prev) => !prev);
      setLoadingMessage("Please Confirm the tranaction in wallet");
      await bundlerInstance.fund(parseInt(amountParsed));
      setFundAmmount(0);
      fetchBalance();
      setIsloading((prev) => !prev);
    } catch (error) {
      setIsloading(false);
    } finally {
      setIsloading(false);
    }
  }
  function showError() {
    inputref.current.style.border = "1px solid red";
    inputref.current.style.borderRadius = "1px";
    inputref.current.placeholder = "Please enter ammount > 0";
    setTimeout(() => {
      inputref.current.style.border = "none";
      inputref.current.style.borderRadius = "1px";
      inputref.current.placeholder = "";
    }, 2000);
  }

  async function fetchBalance() {
    try {
      if (!bundlerInstance) return;
      const balance = await bundlerInstance.getLoadedBalance();
      setBalance(ethers.utils.formatEther(balance.toString()));
    } catch (error) {
      throw new Error("Something went wrong");
    }
  }
  function parseInput(input) {
    const value = ethers.utils.parseEther(input);
    console.log(value);
    return value;
  }

  async function uploadFile() {
    try {
      setIsloading((prevState) => !prevState);
      setLoadingMessage("Uploading File to PermaWeb...");
      const uploader = bundlerInstance?.uploader.chunkedUploader;
      uploader?.setBatchSize(2);
      uploader?.setChunkSize(2_000_000);
      console.log(uploader.uploadData);
      uploader?.on("chunkUpload", (e) => {
        // toast({
        //   status: "info",
        //   title: "Upload progress",
        //   description: `${((e.totalUploaded / ((size ?? 0))) * 100).toFixed()}%`
        // });
        console.log(e.totalUploaded);
      });
      let tx = await uploader.uploadData(fileReaderStream(file), {
        tags: [
          {
            name: "Content-Type",
            value: file.type,
          },
        ],
      });
      await fetchBalance();
      setArweaveURL(`https://arweave.net/${tx?.data.id}`);
      setIsloading(false);
    } catch (error) {
      setIsloading(false);
    } finally {
      setIsloading(false);
    }
  }
  return (
    <>
      {isloading && <Loader message={loadingMessage} />}
      <div className={styles.container}>
        <Head>
          <title>Arweave Upload</title>
          <meta
            name="description"
            content="Place to upload your content on permaweb and get links"
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div>
          {!isConnetced ? (
            <button onClick={connectWallet} className={styles.button}>
              Connect Wallets
            </button>
          ) : null}

          {isConnetced ? (
            <>
              <h3>Connected to Address: {address}</h3>
              {bundlerInstance ? (
                <h3>Bundlr balance : {balance} Matic</h3>
              ) : null}
              <div>
                <button className={styles.button} onClick={fundWallet}>
                  Fund Bundlr
                </button>
                <input
                  type={"number"}
                  value={fundAmmount}
                  className={styles.input}
                  ref={inputref}
                  id="fundvalue"
                  onChange={(e) => {
                    e.preventDefault();
                    setFundAmmount(e.target.value);
                  }}
                />
              </div>
              <div>
                <input
                  type={"file"}
                  className={styles.input}
                  onChange={(e) => {
                    e.preventDefault();
                    setFile(e.target.files[0]);
                  }}
                />
              </div>
              <div>
                {file?.type?.includes("image") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    className={styles.preview}
                  />
                ) : null}
              </div>
              <div></div>
              {file ? (
                <button className={styles.button} onClick={uploadFile}>
                  Upload File
                </button>
              ) : null}
              {arweaveURL.length > 0 ? (
                <button
                  onClick={() => {
                    window.open(arweaveURL).focus();
                  }}
                  className={styles.button}
                >
                  Go to your file
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
