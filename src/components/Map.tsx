import { Event } from "@prisma/client";
import React from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { trpc } from "../utils/trpc";

interface Props {
  setSelectedEvent: (event: Event) => void;
}

const Map: React.FC<Props> = ({ setSelectedEvent }) => {
  const eventsQuery = trpc.useQuery(["events.all-events"]);

  return (
    <MapContainer
      className="grow"
      center={[51.505, -0.09]}
      zoom={13}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {eventsQuery.data?.map((event) => (
        <Marker
          eventHandlers={{ click: () => setSelectedEvent(event) }}
          key={event.id}
          position={[parseFloat(event.lat), parseFloat(event.lng)]}
        >
          <Popup>
            <span>{event.name}</span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
