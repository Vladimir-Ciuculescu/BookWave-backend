import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "module-alias/register";
import "dotenv/config";
import "./utils/schedule";

// ? Routers
import usersRouter from "routers/user.route";
import audioRouter from "routers/audio.route";
import favoriteRouter from "routers/favorite.route";
import playlistRouter from "routers/playlist.route";
import profileRouter from "routers/profile.route";
import historyRouter from "routers/history.route";

const app = express();

const connectToDB = async () => {
  try {
    mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to Database !");
  } catch (error) {
    console.log("Cannot connect to Database :", error);
  }
};

connectToDB();

const PORT = process.env.PORT;

app.use(express.json());
app.use(express.static("src/public"));
app.use(cors());

// ? ROUTES
app.use("/users", usersRouter);
app.use("/audio", audioRouter);
app.use("/favorites", favoriteRouter);
app.use("/playlist", playlistRouter);
app.use("/profile", profileRouter);
app.use("/history", historyRouter);

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
//   res.setHeader("Access-Control-Allow-Methods", "GET, PATCH, POST, DELETE, PUT, OPTIONS");
//   next();
// });

app.listen(PORT, () => {
  console.log(`application running on port ${PORT} !`);
});
