// src/App.tsx
import React, { useEffect, useState } from "react";

interface LogEntry {
  _id: string;
  latitude: number;
  longitude: number;
  status: string;
  timestamp: number;
  carCapturedTimestamp: number;
}

const App: React.FC = () => {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // (Later, you can add state for any manual ride-start inputs.)
  
  // Fetch parking events from our API endpoint
  useEffect(() => {
    fetch("/api/logs")
      .then((res) => res.json())
      .then((data) => {
        // Transform the MongoDB-specific data format to our LogEntry interface.
        // (Assuming each document is in the format provided.)
        const logs: LogEntry[] = data.map((entry: any) => ({
          _id: entry._id.$oid,
          latitude: parseFloat(entry.latitude.$numberDouble),
          longitude: parseFloat(entry.longitude.$numberDouble),
          status: entry.status,
          timestamp: parseInt(entry.timestamp.$date.$numberLong, 10),
          carCapturedTimestamp: parseInt(entry.carCapturedTimestamp.$date.$numberLong, 10),
        }));
        setLogEntries(logs);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching logs:", err);
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
                    <strong>Status:</strong> {log.status}
                  </p>
                  <p>
                    <strong>Latitude:</strong> {log.latitude}
                  </p>
                  <p>
                    <strong>Longitude:</strong> {log.longitude}
                  </p>
                  <p>
                    <strong>Timestamp:</strong>{" "}
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                  <p>
                    <strong>Car Captured Timestamp:</strong>{" "}
                    {new Date(log.carCapturedTimestamp).toLocaleString()}
                  </p>
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
