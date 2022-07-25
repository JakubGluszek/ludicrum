import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("../components/Map"), { ssr: false })

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Ludicrum</title>
        <meta name="description" content="A platform where you can find street performances around you." />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.8.0/dist/leaflet.css"
          integrity="sha512-hoalWLoI8r4UszCkZ5kL8vayOGVae1oxXe/2A4AO6J9+580uKHDO3JdHb7NzwwzK5xr/Fs0W40kiNHxM9vyTtQ=="
          crossOrigin=""
        />
      </Head>

      <main className="">
        <h1>Find street performances around you.</h1>
      </main>

      <div className="w-full h-96 flex">
        <Map />
      </div>

    </>
  );
};

export default Home;
