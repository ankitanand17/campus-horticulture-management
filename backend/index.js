const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./models");
require('dotenv').config();

app.use(express.json());
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use("/uploads", express.static("uploads"));

//Routers
const userRouter = require("./routes/User");
app.use("/auth",userRouter);

const plantRouter = require("./routes/Plant");
app.use("/plant",plantRouter);

const eventRouter = require("./routes/Event");
app.use("/event",eventRouter);

const adminProfileRouter = require("./routes/AdminProfile");
app.use("/admin-profile", adminProfileRouter);

const studentProfileRouter = require("./routes/StudentProfile");
app.use("/student-profile", studentProfileRouter);

const gardenerProfileRouter = require("./routes/GardenerProfile");
app.use("/gardener-profile", gardenerProfileRouter);

const gardeningLogRouter = require("./routes/GardeningLog");
app.use("/gardening-log", gardeningLogRouter);

const feedbackRouter = require("./routes/Feedback");
app.use("/feedback", feedbackRouter);

const complaintRouter = require("./routes/Complaint");
app.use("/complaint", complaintRouter);

const adminActionsRouter = require("./routes/AdminActions");
app.use("/admin-actions", adminActionsRouter);

const equipmentRouter = require("./routes/Equipment");
app.use("/equipment", equipmentRouter);

const startServer = async () => {
  try {
    await db.sequelize.sync();
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log("Server is running on port 4000");
    });
  } catch (error) {
    console.error("Error during synchronization:", error);
  }
};

startServer();