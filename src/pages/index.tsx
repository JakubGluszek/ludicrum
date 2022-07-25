import React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { Event } from "@prisma/client";

const Map = dynamic(() => import("../components/Map"), { ssr: false });

const Home: NextPage = () => {
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);

  React.useEffect(() => {
    console.log("selected event, ", selectedEvent);
  }, [selectedEvent]);
  return (
    <>
      <Head>
        <title>Ludicrum</title>
      </Head>

      <nav className="navbar">
        <div className="navbar-start">
          <span>Ludicrum</span>
        </div>
        <div className="navbar-end">
          <button className="btn btn-ghost">Login</button>
        </div>
      </nav>

      <main className="text-center p-4">
        <h1>Find street performances around you.</h1>
      </main>

      <div className="w-full h-[600px] flex">
        <Map setSelectedEvent={setSelectedEvent} />
      </div>
    </>
  );
};

export default Home;
