// api/logs.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

// It’s recommended to store the connection string in an environment variable.
const uri = process.env.MONGODB_URI || "";
if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable.");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let client!: MongoClient;
  try {
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db("weconnect"); 
    const collection = db.collection("vehicle_events"); 
    const logs = await collection.find({}).toArray();
    res.status(200).json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  } finally {
    await client.close();
  }
}
