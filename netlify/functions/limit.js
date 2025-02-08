    import { MongoClient } from "mongodb";

    const MONGO_URI =
      "mongodb+srv://admin:AdminSemio@users.0eeam.mongodb.net/?retryWrites=true&w=majority&appName=users";

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

    exports.handler = async (event) => {
      try {
        const { email } = JSON.parse(event.body);

        const db = await connectToDatabase();
        const user = await db.collection("users").findOne({ email });

        if (!user) {
          return {
            statusCode: 404,
            body: JSON.stringify({ message: "Użytkownik nie znaleziony" }),
          };
        }

        if (user.limit <= 0) {
          return {
            statusCode: 403,
            body: JSON.stringify({ message: "Przekroczono limit zapytań" }),
          };
        }

        await db
          .collection("users")
          .updateOne({ email }, { $inc: { limit: -1 } });

        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "Zapytanie dozwolone",
            remainingLimit: user.limit - 1,
          }),
        };
      } catch (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "Błąd serwera",
            error: error.message,
          }),
        };
      }
    };