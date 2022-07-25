import type { NextPage } from "next";
import Head from "next/head";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Ludicrum</title>
        <meta name="description" content="A platform where you can find street performances around you." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="">
        <h1>Find street performances around you.</h1>
      </main>
    </>
  );
};

export default Home;
