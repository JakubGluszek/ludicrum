import React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { Event } from "@prisma/client";
import {
  MdClose,
  MdDarkMode,
  MdDelete,
  MdEdit,
  MdLightMode,
  MdLogout,
  MdQrCode,
  MdRefresh,
} from "react-icons/md";
import { trpc } from "../utils/trpc";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useViewportSize } from "@mantine/hooks";
import dayjs from "dayjs";
import { Loader, Modal, Skeleton } from "@mantine/core";
import toast from "react-hot-toast";
import QRCode from "react-qr-code";
import { useForm } from "react-hook-form";

const Map = dynamic(() => import("../components/Map"), { ssr: false });

interface EventViewProps {
  id: string;
  setSelectedEventId: (id: string | null) => void;
}

const EventView: React.FC<EventViewProps> = ({ id, setSelectedEventId }) => {
  const [viewDeleteEvent, setViewDeleteEvent] = React.useState(false);
  const [viewReviewCode, setViewReviewCode] = React.useState(false);
  const { width } = useViewportSize();
  const { data } = useSession();

  const tctx = trpc.useContext();
  const event = trpc.useQuery(["events.event-details", { id }], {
    refetchOnMount: true,
  });
  const removeEvent = trpc.useMutation(["events.delete"], {
    onSuccess: ({ id }) => {
      tctx.setQueryData(["events.all-events"], (events) =>
        events ? events?.filter((event) => event.id !== id) : []
      );
      setSelectedEventId(null);
      toast.success("Event removed");
    },
  });

  const generateCode = trpc.useMutation(["events.generate-review-code"]);

  React.useEffect(() => {
    if (removeEvent.error?.data?.code === "UNAUTHORIZED") {
      toast.error("You must be logged in to remove outdated events");
    }
  }, [removeEvent]);

  const closeEventWindowButton = (
    <button
      className="absolute top-1 right-1 hover:bg-base-300 rounded p-1"
      onClick={() => setSelectedEventId(null)}
    >
      <MdClose size={24} />
    </button>
  );

  if (event.isLoading)
    return (
      <div className="z-[1000] absolute w-full md:w-fit h-full right-0 top-0 p-2">
        <div className="relative w-full flex flex-col gap-8 md:w-96 h-full p-4 pt-10 md:p-6 rounded bg-base-100 md:pt-10 border ">
          {closeEventWindowButton}
          <div className="flex flex-row items-center gap-4">
            <Skeleton height={48} circle />
            <Skeleton height={24} />
          </div>
          <Skeleton height={32} />
          <Skeleton height={32} />
          <Skeleton height={64} />
        </div>
      </div>
    );

  if (!event.data) return null;

  const isUpcoming = event.data.date > new Date();
  const isTakingPlace = event.data.dateEnd > new Date();

  const deleteEventButton = (
    <button
      className="btn btn-error btn-sm"
      onClick={() => {
        if (event.data?.id) {
          removeEvent.mutate({ id: event.data.id });
        }
      }}
    >
      {removeEvent.isLoading ? <Loader size={16} /> : <MdDelete size={24} />}
    </button>
  );

  const refreshEventButton = (
    <button
      className="absolute left-1 top-1 rounded p-0.5 btn btn-ghost hover:bg-base-300 btn-sm"
      onClick={() => event.refetch()}
    >
      <MdRefresh
        size={24}
        className={`${event.isRefetching && "animate-spin"}`}
      />
    </button>
  );

  const eventStatus = (
    <div
      className="absolute top-1 left-auto right-auto tooltip tooltip-bottom"
      data-tip="Status"
    >
      <div className="badge badge-accent rounded p-[14px]">
        {isUpcoming
          ? "UPCOMING"
          : isTakingPlace
          ? "CURRENTLY TAKING PLACE"
          : "OVER"}
      </div>
    </div>
  );

  const eventPostedBy = (
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
  );

  const eventHostOptions = (
    <div className="flex flex-row items-center gap-2">
      <button
        className={`btn btn-primary btn-sm tooltip tooltip-right ${
          event.data.date > new Date() && "btn-disabled"
        }`}
        data-tip="Generate review code"
        onClick={() => setViewReviewCode(true)}
      >
        <MdQrCode size={24} />
      </button>
      <button className="btn btn-primary btn-sm">
        <MdEdit size={24} />
      </button>
      <button
        className="btn btn-error btn-outline btn-sm"
        onClick={() => setViewDeleteEvent(!viewDeleteEvent)}
      >
        <MdDelete size={24} />
      </button>
    </div>
  );

  return (
    <>
      <div className="z-[1000] absolute w-full md:w-fit h-full right-0 top-0 p-2">
        <div className="relative w-full flex flex-col items-center md:w-96 h-full p-4 pt-10 md:p-6 rounded bg-base-100 md:pt-10 border overflow-y-auto">
          {closeEventWindowButton}
          {refreshEventButton}
          {eventStatus}
          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-row items-center gap-4">
              {/* delete event button */}
              {!isUpcoming &&
                !isTakingPlace &&
                !event.data.userId &&
                deleteEventButton}
            </div>
            {eventPostedBy}
            {/* additional options for event host */}
            {event.data.userId === data?.user?.id && eventHostOptions}
            {/* event details */}
            <div className="flex flex-col gap-2">
              <p className="font-light text-sm">Title</p>
              <p className="p-2 bg-base-200 rounded">{event.data.title}</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-light text-sm">Description</p>
              <p className="p-2 bg-base-200 rounded">
                {event.data.description}
              </p>
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
            <EventReviewsView event={event.data} />
          </div>
        </div>
      </div>
      {/* delete current user's event modal */}
      <Modal
        title="Delete event"
        zIndex={50000}
        opened={viewDeleteEvent}
        onClose={() => setViewDeleteEvent(false)}
      >
        <div className="flex flex-col items-center gap-4">
          <p>Are you sure you want to delete this event?</p>
          <div className="flex flex-row items-center gap-4">
            <button
              className="btn btn-error"
              onClick={() => removeEvent.mutate({ id })}
            >
              {removeEvent.isLoading ? <Loader size={16} /> : "Delete"}
            </button>
            <button className="btn" onClick={() => setViewDeleteEvent(false)}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
      {/* generate QR code containing url with valid review code
        for another user to scan & add a review
      */}
      <Modal
        title="Generate review code"
        zIndex={50000}
        opened={viewReviewCode}
        onClose={() => setViewReviewCode(false)}
      >
        <div className="flex flex-col items-center gap-4">
          {generateCode.data && (
            <QRCode
              value={`${window.location.origin}/?eventId=${id}&reviewCode=${generateCode.data.code}`}
            />
          )}
          <button
            className="btn btn-primary"
            onClick={() => generateCode.mutate()}
          >
            {generateCode.isLoading ? <Loader size={16} /> : "Generate code"}
          </button>
          <p>
            This QR code is necessary for people to post reviews of the event.
          </p>
        </div>
      </Modal>
    </>
  );
};

interface EventReviewsViewProps {
  event: Event;
}

const EventReviewsView: React.FC<EventReviewsViewProps> = ({ event }) => {
  const [rating, setRating] = React.useState(1);
  const { data } = useSession();
  const { register, handleSubmit } = useForm();
  const router = useRouter();
  const { reviewCode } = router.query;

  const reviews = trpc.useQuery([
    "reviews.event-reviews",
    { eventId: event.id },
  ]);

  const addReview = trpc.useMutation(["reviews.create"], {
    onSuccess: () => {
      reviews.refetch();
    },
  });

  const onSubmit = handleSubmit((data) => {
    if (event.date > new Date()) {
      toast("It hasn't even begun yet...");
      return;
    }
    addReview.mutate({
      code: reviewCode?.toString(),
      eventId: event.id,
      rating: rating,
      body: data.body.length > 0 ? data.body : null,
    });
  });

  const autoGrow = (e: React.FormEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.height = "16px";
    e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
  };

  React.useEffect(() => {
    if (addReview.error) {
      toast.error(addReview.error.message);
    }
    if (addReview.isSuccess) {
      toast.success("Added review");
    }
  }, [addReview.error, addReview.isSuccess]);

  return (
    <div className="flex flex-col gap-4">
      {/* if user hasn't added a review yet, display add review form */}
      <>
        <p className="font-light text-sm">Add review</p>
        <div className="flex flex-row gap-4">
          <Image
            className="rounded-md"
            src={data?.user?.image ? data.user.image : "/default_avatar.png"}
            alt={data?.user?.name ? data.user.name : "Anonymous user"}
            width={48}
            height={48}
          />
          <div className="rating rating-lg">
            <input type="radio" name="rating-5" className="rating-hidden" />
            <input
              type="radio"
              name="rating-5"
              className="bg-primary mask mask-star-2"
              onClick={() => setRating(1)}
              defaultChecked={rating === 1 ? true : false}
            />
            <input
              type="radio"
              name="rating-5"
              onClick={() => setRating(2)}
              className="bg-primary mask mask-star-2"
              defaultChecked={rating === 2 ? true : false}
            />
            <input
              type="radio"
              name="rating-5"
              onClick={() => setRating(3)}
              className="bg-primary mask mask-star-2"
              defaultChecked={rating === 3 ? true : false}
            />
            <input
              type="radio"
              name="rating-5"
              onClick={() => setRating(4)}
              className="bg-primary mask mask-star-2"
              defaultChecked={rating === 4 ? true : false}
            />
            <input
              type="radio"
              name="rating-5"
              onClick={() => setRating(5)}
              className="bg-primary mask mask-star-2"
              defaultChecked={rating === 5 ? true : false}
            />
          </div>
        </div>
        <form onSubmit={onSubmit} className="form-control gap-2">
          <textarea
            className="textarea bg-transparent textarea-bordered overflow-hidden resize-none"
            minLength={1}
            maxLength={256}
            onInput={(e) => autoGrow(e)}
            placeholder="Optional comment"
            {...register("body", {
              minLength: 1,
              maxLength: 256,
            })}
          />
          <div
            className={`w-full ${!data && "tooltip"}`}
            data-tip="You must be logged"
          >
            <button
              type="submit"
              className={`w-full btn btn-primary ${!data && "btn-disabled"}`}
            >
              {addReview.isLoading ? <Loader size={16} /> : "Post review"}
            </button>
          </div>
        </form>
        {reviews.isLoading ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-row gap-4">
              <Skeleton height={48} circle />
              <Skeleton height={32} />
            </div>
            <div className="flex flex-row gap-4">
              <Skeleton height={48} circle />
              <Skeleton height={32} />
            </div>
          </div>
        ) : (
          <>
            <p className="font-light text-sm">Reviews</p>
            <div className="flex flex-col gap-6">
              {reviews.data?.map((review) => (
                <div key={review.id} className="flex flex-col gap-2">
                  <div className="flex flex-row items-center gap-2">
                    <div
                      className="flex flex-row items-center tooltip"
                      data-tip={review.user.name}
                    >
                      <Image
                        className="rounded-md"
                        src={
                          review?.user?.image
                            ? review.user.image
                            : "/default_avatar.png"
                        }
                        alt={
                          review?.user?.name
                            ? review.user.name
                            : "Anonymous user"
                        }
                        width={32}
                        height={32}
                      />
                    </div>
                    <div className="rating">
                      <input
                        type="radio"
                        name={review.id}
                        className="rating-hidden"
                      />
                      <input
                        type="radio"
                        name={review.id}
                        className="bg-primary mask mask-star-2"
                        onClick={() => setRating(1)}
                        defaultChecked={rating === 1 ? true : false}
                      />
                      <input
                        type="radio"
                        name={review.id}
                        onClick={() => setRating(2)}
                        className="bg-primary mask mask-star-2"
                        defaultChecked={rating === 2 ? true : false}
                      />
                      <input
                        type="radio"
                        name={review.id}
                        onClick={() => setRating(3)}
                        className="bg-primary mask mask-star-2"
                        defaultChecked={rating === 3 ? true : false}
                      />
                      <input
                        type="radio"
                        name={review.id}
                        onClick={() => setRating(4)}
                        className="bg-primary mask mask-star-2"
                        defaultChecked={rating === 4 ? true : false}
                      />
                      <input
                        type="radio"
                        name={review.id}
                        onClick={() => setRating(5)}
                        className="bg-primary mask mask-star-2"
                        defaultChecked={rating === 5 ? true : false}
                      />
                    </div>
                  </div>
                  {review.body && (
                    <p className="p-2 rounded bg-base-200">{review.body}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </>
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
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(
    null
  );

  const { data } = useSession();
  const router = useRouter();
  const { eventId } = router.query;

  React.useEffect(() => {
    if (eventId) {
      setSelectedEventId(eventId.toString());
    }
  }, [eventId]);

  return (
    <>
      <Head>
        <title>Ludicrum</title>
      </Head>

      <div className="mx-auto w-full max-w-screen-lg md:min-h-screen flex flex-col">
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
                    alt={data.user?.name ? data.user.name : "Anonymous user"}
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

        <div className="relative grow min-h-[500px] md:max-h-full flex border">
          <Map setSelectedEventId={setSelectedEventId} />
          {/* selected event information */}
          {selectedEventId && (
            <EventView
              id={selectedEventId}
              setSelectedEventId={setSelectedEventId}
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
