import React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { Event } from "@prisma/client";
import { MdClose } from "react-icons/md";

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
        <h1>Find events around you.</h1>
      </main>

      <div className="relative w-full h-[500px] flex">
        <Map setSelectedEvent={setSelectedEvent} />
        {/* selected event information */}
        {selectedEvent && (
          <div className="z-[400] absolute right-4 top-4 w-64 h-96 bg-base-100 p-4 rounded">
            <button
              className="absolute top-1 right-1 hover:bg-base-200 rounded p-1"
              onClick={() => setSelectedEvent(null)}
            >
              <MdClose size={16} />
            </button>
            <div className="flex flex-col gap-2">
              <span>{selectedEvent.name}</span>
              <span>
                Description: <p>{selectedEvent.description}</p>
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
