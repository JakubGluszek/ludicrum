import React from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import {
  MdMyLocation,
  MdAddCircleOutline,
  MdCancel,
  MdAccessTime,
  MdCalendarToday,
} from "react-icons/md";
import { trpc } from "../utils/trpc";
import { useForm } from "react-hook-form";
import { DatePicker, TimeInput } from "@mantine/dates";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Loader } from "@mantine/core";
import { Map as IMap } from "leaflet";

type CreateEventFormValues = {
  title: string;
  description: string;
  isHost: boolean;
};
const CurrentLocation: React.FC = () => {
  const map = useMapEvents({
    locationfound(e) {
      map.flyTo(e.latlng, 12);
    },
    locationerror(e) {
      alert(e.message);
    },
  });

  return (
    <button
      className="z-[500] absolute left-[11px] top-20 bg-white text-black border-2 border-black border-opacity-30 p-1 rounded"
      onClick={() => map.locate()}
    >
      <MdMyLocation size={20} />
    </button>
  );
};

const AddEvent: React.FC = () => {
  const [viewAddEvent, setViewAddEvent] = React.useState(false);
  const [date, setDate] = React.useState<Date | null>(new Date());
  const [time, setTime] = React.useState(new Date());
  const [dateEnd, setDateEnd] = React.useState<Date | null>(new Date());

  const { register, handleSubmit } = useForm<CreateEventFormValues>();
  const map = useMapEvents({});

  const [position, setPosition] = React.useState(map.getCenter());
  const markerRef = React.useRef<any | null>(null);
  const eventHandlers = React.useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          setPosition(marker.getLatLng());
        }
      },
    }),
    []
  );

  const tctx = trpc.useContext();
  const create = trpc.useMutation(["events.create"], {
    onSuccess: (data) => {
      tctx.setQueryData(["events.all-events"], (events) =>
        events ? [...events, data] : []
      );
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    if (date && dateEnd) {
      date.setHours(time.getHours());
      date.setMinutes(time.getMinutes());
      date.setSeconds(0);

      dateEnd.setDate(date.getDate());
      dateEnd.setMonth(date.getMonth());
      dateEnd.setFullYear(date.getFullYear());
      dateEnd.setSeconds(0);

      if (date < new Date()) {
        toast.error("Have you got a time machine?");
        return;
      }

      if (dateEnd < date) {
        toast.error("Can't end before it even starts..");
        return;
      }

      await create.mutateAsync({
        ...data,
        lat: position.lat.toString(),
        lng: position.lng.toString(),
        date: date,
        dateEnd: dateEnd,
      });
      toast.success("Event added");
      setViewAddEvent(false);
    } else {
      toast.error("You must pick a date");
    }
  });

  React.useEffect(() => {
    if (create.isError) {
      toast.error(create.error.message);
    }
  }, [create]);

  const autoGrow = (e: React.FormEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.height = "16px";
    e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
  };

  return (
    <>
      <button
        className="z-[500] absolute left-3 top-32 btn btn-primary btn-sm gap-2 p-0.5 rounded-sm"
        onClick={() => {
          if (!viewAddEvent) {
            setPosition(map.getCenter());
          }
          setViewAddEvent(!viewAddEvent);
        }}
      >
        {viewAddEvent ? (
          <MdCancel size={24} />
        ) : (
          <MdAddCircleOutline size={24} />
        )}
      </button>

      {viewAddEvent && (
        <Marker
          ref={markerRef}
          riseOnHover={true}
          eventHandlers={eventHandlers}
          position={position}
          draggable
        >
          <Tooltip permanent>New</Tooltip>
          <Popup autoPan>
            <form onSubmit={onSubmit} className="form-control gap-2">
              <input
                className="input input-bordered input-sm bg-transparent"
                type="text"
                minLength={4}
                maxLength={64}
                placeholder="Title"
                {...register("title", {
                  minLength: 4,
                  maxLength: 64,
                  required: true,
                })}
              />
              <textarea
                className="textarea bg-transparent textarea-bordered overflow-hidden resize-none"
                minLength={16}
                maxLength={512}
                onInput={(e) => autoGrow(e)}
                placeholder="Describe event"
                {...register("description", {
                  minLength: 16,
                  maxLength: 512,
                  required: true,
                })}
              />
              <DatePicker
                icon={<MdCalendarToday size={16} />}
                clearable={false}
                defaultValue={date}
                onChange={setDate}
                zIndex={5000}
                placeholder="Pick date"
              />
              <TimeInput
                label="Starts at"
                icon={<MdAccessTime size={16} />}
                value={time}
                onChange={setTime}
              />
              <TimeInput
                label="Ends at"
                icon={<MdAccessTime size={16} />}
                value={dateEnd}
                onChange={setDateEnd}
              />
              <label className="label cursor-pointer">
                <span className="label-text">I am the host</span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-md rounded"
                  {...register("isHost")}
                />
              </label>
              <button className="btn btn-primary btn-sm" type="submit">
                {create.isLoading ? <Loader size={16} /> : "Add event"}
              </button>
            </form>
          </Popup>
        </Marker>
      )}
    </>
  );
};

interface MapProps {
  setSelectedEventId: (id: string | null) => void;
}

const Map: React.FC<MapProps> = ({ setSelectedEventId }) => {
  const events = trpc.useQuery(["events.all-events"]);
  const myEvent = trpc.useQuery(["events.my-event"]);
  const { data } = useSession();
  const mapRef = React.useRef<IMap>(null);

  React.useEffect(() => {
    if (myEvent.isSuccess && myEvent.data) {
      mapRef.current?.flyTo({
        lat: parseFloat(myEvent.data.lat),
        lng: parseFloat(myEvent.data.lng),
      });;
    }
  }, [myEvent.data, myEvent.isSuccess, mapRef]);

  return (
    <MapContainer
      ref={mapRef}
      doubleClickZoom={false}
      fadeAnimation={true}
      className="grow"
      center={[51.505, -0.09]} // make random maybe??
      zoom={13}
      scrollWheelZoom={true}
      touchZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CurrentLocation />
      {data && <AddEvent />}
      {events.data?.map((event) => (
        <Marker
          opacity={event.dateEnd < new Date() ? 0.6 : 1}
          eventHandlers={{
            click: () => setSelectedEventId(event.id),
          }}
          key={event.id}
          position={[parseFloat(event.lat!), parseFloat(event.lng!)]}
        >
          {event.userId === data?.user?.id && (
            <Tooltip permanent>My event</Tooltip>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
