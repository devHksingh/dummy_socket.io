import app from "./app.js";
import { config } from "./config/config.js";
import connectDB from "./config/db.js";

const startServer = async () => {
  await connectDB();
  const port = config.port || 4008;

  const serverApp = app.listen(port, () => {
    console.log(`Listening on port :${port}`);
  });

  

  
};

startServer();