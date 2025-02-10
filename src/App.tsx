// src/App.tsx
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';

interface LogEntry {
  _id: string;
  latitude: number;
  longitude: number;
  status: string;
  timestamp: number;
  carCapturedTimestamp: number;
  address?: string; // Optional address field
  addressError?: boolean;
}

const markerIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const App: React.FC = () => {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // (Later, you can add state for any manual ride-start inputs.)

  const parseTimestamp = (isoString: string): number => {
    // Parse ISO string to local timezone timestamp
    return new Date(isoString).getTime();
  };

  const formatDateTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString(undefined, {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getAddress = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'DriversLogApp/1.0' // Required by Nominatim ToS
          }
        }
      );
      const data = await response.json();
      return data.display_name;
    } catch (error) {
      console.error('Error fetching address:', error);
      return 'Address lookup failed';
    }
  };

  // Fetch parking events from our API endpoint
  useEffect(() => {
    fetch("https://drivers-log-app-backend.onrender.com/api/logs")
      .then((res) => {
        if (!res.ok) {
          console.error("Failed to fetch logs:", res);
          throw new Error("Failed to fetch logs");
        }
        // Read response as text FIRST for debugging
        return res.text().then((text) => {
          console.log("Raw response body:", text); // Log raw content
          return JSON.parse(text); // Parse text to JSON
        });
      })
      .then(async (data) => {
        // Transform and fetch addresses for each entry
        const logsPromises = data.map(async (entry: any) => {
          const address = await getAddress(entry.latitude, entry.longitude);
          return {
            _id: entry._id,
            latitude: entry.latitude,
            longitude: entry.longitude,
            status: entry.status,
            timestamp: parseTimestamp(entry.timestamp),
            carCapturedTimestamp: parseTimestamp(entry.carCapturedTimestamp),
            address
          };
        });
        
        const logs = await Promise.all(logsPromises);
        setLogEntries(logs);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching logs:", err);
        console.error("Please ensure the API is running.");
        console.error("You can run the API locally with `vercel dev --listen 5000`.");
        console.error("Or deploy the API with `vercel --prod`.");

        setLoading(false);
      });
  }, []);

  // Sort logs by carCapturedTimestamp (the time when the car was parked)
  const sortedLogs = [...logEntries].sort(
    (a, b) => a.carCapturedTimestamp - b.carCapturedTimestamp
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">
        Driver’s Log / Vehicle Logbook
      </h1>
      
      {loading ? (
        <p>Loading parking events…</p>
      ) : (
        <div>
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Parking Events</h2>
            <ul className="space-y-4">
              {sortedLogs.map((log) => (
                <li key={log._id} className="border rounded p-4 shadow-sm">
                  <p>
                    <strong>Location:</strong>{" "}
                    {log.addressError ? 
                      <span className="text-red-600">Address lookup failed</span> :
                      (log.address || <span className="text-gray-400">Loading address...</span>)
                    }
                  </p>
                  <p>
                    <strong>Coordinates:</strong>{" "}
                    {log.latitude}, {log.longitude}
                  </p>
                  <p>
                    <strong>Status:</strong> {log.status}
                  </p>
                  <p>
                    <strong>Timestamp:</strong>{" "}
                    {formatDateTime(log.timestamp)}
                  </p>
                  <p>
                    <strong>Car Captured Timestamp:</strong>{" "}
                    {formatDateTime(log.carCapturedTimestamp)}
                  </p>
                  <MapContainer center={[log.latitude, log.longitude]} zoom={13} style={{ height: "200px", width: "100%" }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[log.latitude, log.longitude]} icon={markerIcon}>
                      <Popup>
                        {log.address}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Rides</h2>
            <p className="mb-2">
              Note: The vehicle logs parking events automatically. To record a
              ride (i.e. driving between two parking events), the user needs to
              manually supply the ride’s start date and time. (Ride pairing and
              manual input will be enhanced in later iterations.)
            </p>
            {/* Placeholder for ride details and manual ride-start input */}
            <div className="border border-dashed border-gray-400 p-4 rounded">
              <em>Ride details will appear here once the manual start time is
              added.</em>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default App;
