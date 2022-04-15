require("dotenv").config();
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
// const morgan = require("morgan");
const cors = require("cors");

//connexion à la bdd
// mongoose.connect("mongodb://localhost/vinted");
mongoose.connect(process.env.MONGODB_URI);
// console.log(process.env.MONGODB_URI);

//Création du serveur
const app = express();
app.use(formidable());
app.use(cors());
// app.use(morgan("dev"));

//import des routes
const userRoutes = require("./routes/users");
app.use(userRoutes);

const offerRoutes = require("./routes/offers");
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(400).json("Route introuvable !");
});

app.listen(process.env.PORT, () => {
  console.log("Server has started ! ");
});
