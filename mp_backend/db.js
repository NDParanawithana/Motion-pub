import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
import dns from 'node:dns';

// Fix for Windows / ISP DNS resolving SRV records for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Fallback if network restricts custom DNS
}

dotenv.config();

let client = null;

function getMongoUri() {
  dotenv.config();
  return process.env.MONGO_URI || '';
}

export async function connectToMongoDB() {
  if (client) return client;

  const uri = getMongoUri();

  if (!uri || uri.includes('<db_password>')) {
    throw new Error('MongoDB password not configured. Please replace <db_password> in mp_backend/.env with your actual password.');
  }

  const newClient = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 5000,
  });

  await newClient.connect();
  await newClient.db('admin').command({ ping: 1 });
  client = newClient;
  console.log('✅ You successfully connected to MongoDB Atlas!');
  return client;
}

export async function checkMongoStatus() {
  const uri = getMongoUri();

  if (!uri || uri.includes('<db_password>')) {
    return {
      connected: false,
      configured: false,
      error: 'Password placeholder detected. Open mp_backend/.env and replace <db_password> with your database user password.'
    };
  }

  try {
    const c = await connectToMongoDB();
    await c.db('admin').command({ ping: 1 });
    return {
      connected: true,
      configured: true,
      cluster: 'motionpub01.t8obwtu.mongodb.net',
      database: 'Motionpub01',
      message: 'Successfully connected to MongoDB Atlas!'
    };
  } catch (err) {
    let errorDetail = err.message || 'Failed to connect to MongoDB cluster';

    if (errorDetail.includes('bad auth') || errorDetail.includes('authentication failed')) {
      errorDetail = 'Authentication failed: The password or username in mp_backend/.env does not match your Database User in MongoDB Atlas.';
    } else if (
      errorDetail.includes('tlsv1 alert internal error') ||
      errorDetail.includes('SSL alert number 80') ||
      errorDetail.includes('ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR')
    ) {
      errorDetail = 'Atlas IP Access List Blocked (SSL alert 80): MongoDB Atlas rejected the connection because your current IP address is not in the Network Access IP Access List.';
    }

    return {
      connected: false,
      configured: true,
      error: errorDetail
    };
  }
}

// Call this only when your application terminates
export async function disconnectFromMongoDB() {
  if (client) {
    await client.close();
    client = null;
    console.log('Disconnected from MongoDB.');
  }
}
