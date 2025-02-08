import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

let defModel = "Semio Academy talks"; // Model domyślny
let defLimit = 10; // Domyślny limit zapytań

// Connection string do MongoDB Atlas
const MONGO_URI =
  "mongodb+srv://admin:AdminSemio@users.0eeam.mongodb.net/?retryWrites=true&w=majority&appName=users";
// Przechowujemy jedną globalną referencję do klienta,
// żeby nie tworzyć nowego połączenia na każde wywołanie funkcji
let cachedClient = null;

// Funkcja łączenia z bazą danych
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

// Funkcja opcjonalnego zamykania połączenia z bazą
async function closeDatabaseConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
  }
}

// Nasz handler
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      await closeDatabaseConnection();
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email i hasło jest wymagane" }),
      };
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      await closeDatabaseConnection();
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Taki użytkownik już istnieje" }),
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword,
      assistants: [defModel],
      limit: defLimit,
    };
    await usersCollection.insertOne(newUser);

    await closeDatabaseConnection();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Zajestrowanie udane." }),
    };
  } catch (error) {
    console.error("Error registering user:", error);
    await closeDatabaseConnection();
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
