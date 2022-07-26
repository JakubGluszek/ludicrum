import React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { Event } from "@prisma/client";
import { MdClose, MdLogout } from "react-icons/md";
import { trpc } from "../utils/trpc";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";

const Map = dynamic(() => import("../components/Map"), { ssr: false });

interface Props {
  id: string;
  setSelectedEvent: (event: Event | null) => void;
}

const EventView: React.FC<Props> = ({ id, setSelectedEvent }) => {
  const event = trpc.useQuery(["events.event-details", { id }]);

  if (event.isLoading)
    return (
      <div className="z-[400] absolute w-fit h-full right-0 top-0 p-4">
        <div className="relative w-64 md:w-96 h-full p-4 rounded bg-base-100 py-6">
          <button
            className="absolute top-1 right-1 hover:bg-base-200 rounded p-1"
            onClick={() => setSelectedEvent(null)}
          >
            <MdClose size={16} />
          </button>
          <span>loading skeleton here</span>
        </div>
      </div>
    );

  if (!event.data) return null;

  return (
    <div className="z-[400] absolute w-fit h-full right-0 top-0 p-4">
      <div className="relative w-64 md:w-96 h-full p-4 rounded bg-base-100 py-6">
        <button
          className="absolute top-1 right-1 hover:bg-base-200 rounded p-1"
          onClick={() => setSelectedEvent(null)}
        >
          <MdClose size={16} />
        </button>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-center justify-between py-2">
            <span>{event.data.title}</span>
            <Image
              className="avatar rounded"
              src={event.data.user?.image ?? "/default_avatar.png"}
              alt={event.data.user?.name ?? "human"}
              width={32}
              height={32}
            />
          </div>
          <p>description: {event.data.description}</p>
          <p>date: {event.data.date.toISOString()}</p>
          <p>reviews here</p>
        </div>
      </div>
    </div>
  );
};

const Home: NextPage = () => {
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const [viewAddEvent, setViewAddEvent] = React.useState(false);
  const { data } = useSession();
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Ludicrum</title>
      </Head>

      <div className="mx-auto w-full max-w-screen-lg min-h-screen flex flex-col">
        <nav className="navbar">
          <div className="navbar-start">
            <span>Ludicrum</span>
          </div>
          <div className="navbar-end">
            {!data ? (
              <button
                className="btn btn-ghost"
                onClick={() => router.push("/api/auth/signin")}
              >
                Login
              </button>
            ) : (
              <div className="dropdown dropdown-end z-[500]">
                <label
                  tabIndex={0}
                  className="h-12 cursor-pointer flex items-center justify-center"
                >
                  <Image
                    className="rounded-md"
                    src={
                      data.user?.image ? data.user.image : "/default_avatar.png"
                    }
                    alt={data.user?.name ? data.user.name : "unknown user"}
                    width={48}
                    height={48}
                  />
                </label>
                <ul
                  tabIndex={0}
                  className="my-2 dropdown-content menu p-2 shadow bg-neutral text-neutral-content rounded-box w-52"
                >
                  <li>
                    <button className="btn btn-ghost" onClick={() => signOut()}>
                      <MdLogout size={24} />
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </nav>

        <main className="flex flex-col items-center gap-4 p-4">
          <h1>Add and find events all around the globe</h1>
        </main>

        <div className="relative grow flex">
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

      <div className="mx-auto w-full max-w-screen-lg flex flex-col">
        <p>here</p>
      </div>
    </>
  );
};

export default Home;
