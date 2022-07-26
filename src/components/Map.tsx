import { Event } from "@prisma/client";
import React from "react";
import {
  MapContainer,
  Marker,
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
      className="z-[500] absolute left-16 top-[10px] bg-white text-black border-2 border-black border-opacity-30 p-1 rounded"
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
    if (date) {
      date.setHours(time.getHours());
      date.setMinutes(time.getMinutes());
      if (date < new Date()) {
        toast.error("Have you got a time machine?");
        return;
      }

      try {
        await create.mutateAsync({
          ...data,
          lat: position.lat.toString(),
          lng: position.lng.toString(),
          date: date,
        });
        toast.success("Event added");
        setViewAddEvent(false);
      } catch (err) {
        toast.error(create.error?.message ?? "Something went wrong");
      }
    } else {
      toast.error("You must pick a date");
    }
  });

  const autoGrow = (e: React.FormEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.height = "16px";
    e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
  };

  return (
    <>
      <button
        className="z-[5000] absolute left-28 top-2 btn btn-primary btn-sm gap-2"
        onClick={() => {
          if (!viewAddEvent) {
            setPosition(map.getCenter());
          }
          setViewAddEvent(!viewAddEvent);
        }}
      >
        {viewAddEvent ? (
          <>
            <MdCancel size={24} />
            <span>Cancel</span>
          </>
        ) : (
          <>
            <MdAddCircleOutline size={24} />
            <span>Add event</span>
          </>
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
          <Tooltip className="p-4 rounded" interactive permanent>
            <form onSubmit={onSubmit} className="form-control gap-2">
              <input
                className="input input-bordered input-sm"
                type="text"
                placeholder="Title"
                {...register("title")}
              />
              <textarea
                className="textarea bg-transparent textarea-bordered overflow-hidden resize-none"
                minLength={16}
                maxLength={256}
                onInput={(e) => autoGrow(e)}
                placeholder="Describe event"
                {...register("description", { minLength: 16, maxLength: 512 })}
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
                icon={<MdAccessTime size={16} />}
                value={time}
                onChange={setTime}
              />
              <label className="label cursor-pointer">
                <span className="label-text">I am the host</span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-md rounded"
                  {...register("isHost")}
                />
              </label>
              <input
                className="btn btn-primary btn-sm"
                type="submit"
                value="Add event"
              />
            </form>
          </Tooltip>
        </Marker>
      )}
    </>
  );
};

interface MapProps {
  setSelectedEvent: (event: Event | null) => void;
}

const Map: React.FC<MapProps> = ({ setSelectedEvent }) => {
  const events = trpc.useQuery(["events.all-events"]);

  return (
    <MapContainer
      doubleClickZoom={false}
      fadeAnimation={true}
      className="grow"
      center={[51.505, -0.09]}
      zoom={13}
      scrollWheelZoom={false}
    >
      <CurrentLocation />
      <AddEvent />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {events.data?.map((event) => (
        <Marker
          eventHandlers={{
            click: () => setSelectedEvent(event),
          }}
          key={event.id}
          position={[parseFloat(event.lat!), parseFloat(event.lng!)]}
        />
      ))}
    </MapContainer>
  );
};

export default Map;
