import express from "express";
import routes from "./routes/index.js";

  // Allow CORS for localhost:3000 (React dev server)
  import cors from "cors";

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());
app.use(express.static("public"));
app.use("/api", routes);

export default app;
