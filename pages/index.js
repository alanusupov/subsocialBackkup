import Head from "next/head";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import Link from "next/link";
import { SubsocialApi, generateCrustAuthToken } from "@subsocial/api";
import { IpfsContent } from "@subsocial/api/substrate/wrappers";
import { Keyring } from "@polkadot/keyring";
import { waitReady } from "@polkadot/wasm-crypto";

import Nav from "./components/Nav";
const keyring = new Keyring({ type: "sr25519" });
const MNEMONIC =
  "inch weekend boss endorse pull possible random hip weekend true saddle aisle";
export async function getStaticProps() {
  const url = `https://graph.instagram.com/me/media?fields=id,caption,media_url,timestamp,media_type,permalink&access_token=${process.env.INSTAGRAM_KEY}`;
  const resp = await fetch(url);
  const data = await resp.json();
  return {
    props: {
      posts: data.data,
    },
  };
}

export default function Home(props) {
  const subUrls = {
    substrateNodeUrl: "wss://rco-para.subsocial.network",
    ipfsNodeUrl: "https://crustwebsites.net",
  };
  useEffect(() => {
    async function connect() {
      const authHeader = generateCrustAuthToken(MNEMONIC);
      const api = await SubsocialApi.create(subUrls);
      api.ipfs.setWriteHeaders({
        authorization: "Basic " + authHeader,
      });

      const spaceId = "10179";
      const posts = await api.blockchain.postIdsBySpaceId(spaceId);
      console.log(posts);
    }
    connect();
  }, []);

  const handleBackup = async () => {
    const authHeader = generateCrustAuthToken(MNEMONIC);
    const api = await SubsocialApi.create(subUrls);
    api.ipfs.setWriteHeaders({
      authorization: "Basic " + authHeader,
    });
    const pair = keyring.addFromMnemonic(MNEMONIC);

    const cid = await api.ipfs.saveContent({
      title: "What is Subsocial?",
      image: null,
      tags: ["Hello world", "FAQ"],
      body: "Subsocial is an open protocol for decentralized social networks and marketplaces. It`s built with Substrate and IPFS.",
      canonical: "htpps://twitter.com", // link or tweet,
    });
    const substrateApi = await api.blockchain.api;

    const spaceId = "10179";

    const postTransaction = substrateApi.tx.posts.createPost(
      spaceId,
      { RegularPost: null }, // Creates a regular post.
      IpfsContent(cid)
    );
    console.log(postTransaction);
    postTransaction.signAndSend(pair);
  };
  return (
    <div className="p-4">
      <Head>
        <title>Instagram Back Up</title>
      </Head>
      <Nav />
      <div className={styles.grid}>
        {props.posts.map(post => {
          return (
            post.media_type === "IMAGE" && (
              <div className={styles.card} key={post.id}>
                {/* <Link href={`/post/${post.id}`}> */}
                <a>
                  <img src={post.media_url} alt={post.id} />
                  <h3>{post.caption}</h3>
                  <button
                    onClick={handleBackup}
                    className="text-white bg-black p-2 rounded-lg">
                    Backup
                  </button>
                </a>
                {/* </Link> */}
              </div>
            )
          );
        })}
      </div>
    </div>
  );
}
