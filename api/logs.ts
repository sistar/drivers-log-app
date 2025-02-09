// api/logs.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

// It’s recommended to store the connection string in an environment variable.
const uri = process.env.MONGODB_URI || "";
if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable.");
}

const client = new MongoClient(uri);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await client.connect();
    const database = client.db('driverslog');
    const logs = database.collection('logs');
    
    const result = await logs.find({}).toArray();
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  } finally {
    await client.close();
  }
}
