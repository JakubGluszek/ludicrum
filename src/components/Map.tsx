import { Event } from "@prisma/client";
import React from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { MdMyLocation } from "react-icons/md";
import { trpc } from "../utils/trpc";

const CurrentLocation: React.FC = () => {
  const map = useMapEvents({
    locationfound(e) {
      map.flyTo(e.latlng, 12);
    },
    locationerror(e) {
      alert(e.message)
    }
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

interface Props {
  setSelectedEvent: (event: Event | null) => void;
}

const Map: React.FC<Props> = ({ setSelectedEvent }) => {
  const eventsQuery = trpc.useQuery(["events.all-events"]);

  return (
    <>
      <MapContainer
        fadeAnimation={true}
        className="grow"
        center={[51.505, -0.09]}
        zoom={13}
        scrollWheelZoom={true}
      >
        <CurrentLocation />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {eventsQuery.data?.map((event) => (
          <Marker
            eventHandlers={{
              click: () => setSelectedEvent(event),
            }}
            key={event.id}
            position={[parseFloat(event.lat), parseFloat(event.lng)]}
          />
        ))}
      </MapContainer>
    </>
  );
};

export default Map;
