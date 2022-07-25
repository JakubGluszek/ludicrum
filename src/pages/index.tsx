import React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { Event } from "@prisma/client";
import { MdClose } from "react-icons/md";
import { trpc } from "../utils/trpc";
import Image from "next/image";

const Map = dynamic(() => import("../components/Map"), { ssr: false });

interface Props {
  id: string;
  setSelectedEvent: (event: Event | null) => void;
}

const EventView: React.FC<Props> = ({ id, setSelectedEvent }) => {
  const event = trpc.useQuery(["events.event-details", { id }]);

  if (event.isLoading)
    return (
      <div className="z-[400] absolute right-4 top-4 w-64 h-96 bg-base-100 p-4 py-6 rounded">
        <span>loading skeleton here</span>
      </div>
    );

  if (!event.data) return null;

  return (
    <div className="z-[400] absolute right-4 top-4 w-64 h-96 bg-base-100 p-4 py-6 rounded">
      <button
        className="absolute top-1 right-1 hover:bg-base-200 rounded p-1"
        onClick={() => setSelectedEvent(null)}
      >
        <MdClose size={16} />
      </button>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-center justify-between py-2">
          <span>{event.data.name}</span>
          <Image
            className="avatar rounded"
            src={event.data.user.image ?? "/default_avatar.png"}
            alt={event.data.user.name ?? "human"}
            width={32}
            height={32}
          />
        </div>
        <p>description: {event.data.description}</p>
        <p>date: {event.data.date.toISOString()}</p>
        <div>
          comments here
        </div>
      </div>
    </div>
  );
};

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

      <div className="mx-auto w-full max-w-screen-lg">
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
            <EventView
              id={selectedEvent.id}
              setSelectedEvent={setSelectedEvent}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
