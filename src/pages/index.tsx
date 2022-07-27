import React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { Event } from "@prisma/client";
import {
  MdClose,
  MdDarkMode,
  MdDelete,
  MdLightMode,
  MdLogout,
  MdRefresh,
} from "react-icons/md";
import { trpc } from "../utils/trpc";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useViewportSize } from "@mantine/hooks";
import dayjs from "dayjs";
import { Loader } from "@mantine/core";
import toast from "react-hot-toast";

const Map = dynamic(() => import("../components/Map"), { ssr: false });

interface Props {
  id: string;
  setSelectedEvent: (event: Event | null) => void;
}

const EventView: React.FC<Props> = ({ id, setSelectedEvent }) => {
  const tctx = trpc.useContext();
  const event = trpc.useQuery(["events.event-details", { id }], {
    refetchOnMount: true,
  });
  const removeEvent = trpc.useMutation(["events.delete"], {
    onSuccess: ({ id }) => {
      tctx.setQueryData(["events.all-events"], (events) =>
        events ? events?.filter((event) => event.id !== id) : []
      );
      setSelectedEvent(null);
      toast.success("Event removed");
    },
  });

  const { width } = useViewportSize();

  React.useEffect(() => {
    if (removeEvent.error?.data?.code === "UNAUTHORIZED") {
      toast.error("You must be logged in to remove outdated events");
    }
  }, [removeEvent]);

  const closeButton = (
    <button
      className="absolute top-1 right-1 hover:bg-base-200 rounded p-1"
      onClick={() => setSelectedEvent(null)}
    >
      <MdClose size={width <= 768 ? 24 : 32} />
    </button>
  );

  if (event.isLoading)
    return (
      <div className="z-[1000] absolute w-full sm:w-fit h-full right-0 top-0 p-2">
        <div className="relative w-full sm:w-96 h-full p-4 rounded bg-base-100 py-6 border">
          {closeButton}
          <span>loading skeleton here</span>
        </div>
      </div>
    );

  if (!event.data) return null;

  const isUpcoming = event.data.date > new Date();
  const isTakingPlace = event.data.dateEnd > new Date();

  return (
    <div className="z-[1000] absolute w-full sm:w-fit h-full right-0 top-0 p-2">
      <div className="relative w-full sm:w-96 h-full p-4 sm:p-8 rounded bg-base-100 py-6 border overflow-y-auto">
        {closeButton}
        <div className="flex flex-col gap-4">
          <div className="flex flex-row items-center gap-4">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => event.refetch()}
            >
              <MdRefresh
                size={24}
                className={`${event.isRefetching && "animate-spin"}`}
              />
            </button>
            {/* event status */}
            <div className="badge rounded p-[14px] badge-lg text-lg">
              {isUpcoming
                ? "Upcoming event"
                : isTakingPlace
                ? "Ongoing"
                : "Event is over"}
            </div>
            {/* delete event button */}
            {!isUpcoming && !isTakingPlace && !event.data.userId && (
              <button
                className="btn btn-error btn-sm"
                onClick={() => {
                  if (event.data?.id) {
                    removeEvent.mutate({ id: event.data.id });
                  }
                }}
              >
                {removeEvent.isLoading ? (
                  <Loader size={16} />
                ) : (
                  <MdDelete size={24} />
                )}
              </button>
            )}
          </div>
          <div
            className="tooltip flex flex-row w-fit items-center gap-2"
            data-tip={
              event.data.user
                ? `Hosted by ${event.data.user?.name}`
                : "Added by Third Party"
            }
          >
            <Image
              className="avatar rounded"
              src={event.data.user?.image ?? "/default_avatar.png"}
              alt={event.data.user?.name ?? "human"}
              width={width <= 768 ? 32 : 48}
              height={width <= 768 ? 32 : 48}
            />
            <span>{event.data.user ? event.data.user?.name : "Anonymous"}</span>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-light text-sm">Title</p>
            <p className="p-2 bg-base-200 rounded">{event.data.title}</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-light text-sm">Description</p>
            <p className="p-2 bg-base-200 rounded">{event.data.description}</p>
          </div>
          <div
            className="p-2 bg-base-200 rounded flex flex-col gap-2 tooltip"
            data-tip="Local time"
          >
            <p>{dayjs(event.data.date).format("dddd, MMMM D, YYYY")}</p>
            <p>
              {dayjs(event.data.date).format("h:mm A")} -{" "}
              {dayjs(event.data.dateEnd).format("h:mm A")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ThemeButton: React.FC = () => {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const theme = sessionStorage.getItem("theme");
    if (theme === "custom-dark") {
      setIsDark(true);
    }
  }, []);

  const changeTheme = () => {
    const theme = sessionStorage.getItem("theme");
    const html = document.querySelector("html");

    const newTheme = theme === "custom-dark" ? "custom-light" : "custom-dark";

    html?.setAttribute("data-theme", newTheme);
    sessionStorage.setItem("theme", newTheme);
    setIsDark(!isDark);
  };

  return (
    <button className="btn btn-ghost" onClick={() => changeTheme()}>
      {isDark ? <MdLightMode size={24} /> : <MdDarkMode size={24} />}
    </button>
  );
};

const Home: NextPage = () => {
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);
  const { data } = useSession();
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Ludicrum</title>
      </Head>

      <div className="mx-auto w-full max-w-screen-lg sm:min-h-screen flex flex-col">
        <nav className="navbar">
          <div className="navbar-start">
            <span>Ludicrum</span>
          </div>
          <div className="navbar-end gap-4">
            <ThemeButton />
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
                  className="my-2 dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
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

        <div className="relative grow min-h-[500px] sm:max-h-full flex border">
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

      <footer className="mx-auto w-full max-w-screen-lg flex flex-row items-center justify-evenly gap-4 p-2">
        <span>Created by Jakub Gluszek</span>
        <Link href="https://github.com/JakubGluszek/ludicrum">
          <span className="link link-hover">Source Code</span>
        </Link>
      </footer>
    </>
  );
};

export default Home;
