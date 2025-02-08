import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const MONGO_URI =
  "mongodb+srv://admin:AdminSemio@users.0eeam.mongodb.net/?retryWrites=true&w=majority&appName=users";
const JWT_SECRET = process.env.JWT_SECRET;

let cachedClient = null;

async function connectToDatabase() {
  if (!cachedClient) {
    const client = new MongoClient(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    cachedClient = client;
  }
  return cachedClient.db();
}

async function closeDatabaseConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        message: "Invalid HTTP method. Only POST is allowed.",
      }),
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      await closeDatabaseConnection();
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Email oraz hasło jest wymagane.",
        }),
      };
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email });
    if (!user) {
      await closeDatabaseConnection();
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: "Nie znaleziono użytkownika z podanym adresem e-mail.",
        }),
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await closeDatabaseConnection();
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: "Niepoprawne hasło.",
        }),
      };
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    
    const userAssistants = user.assistants;

    await closeDatabaseConnection();
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: JSON.stringify({
        message: "Login successful.",
        token,
        assistants: userAssistants,
      }),
    };
  } catch (error) {
    console.error("Error occurred during login:", error);

    await closeDatabaseConnection();
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "An internal server error occurred.",
        error: error.message,
      }),
    };
  }
};
