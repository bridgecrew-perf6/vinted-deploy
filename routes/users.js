const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

//import du modèle User
const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    //On vérifier qu'on envoie bien un username
    if (req.fields.username === undefined) {
      res.status(400).json({ message: "Missing parameter" });
    } else {
      //On vérifie que l'email en base de données soit bien disponible
      const isUserExist = await User.findOne({ email: req.fields.email });
      if (isUserExist !== null) {
        res.json({ message: "This email already has an account !" });
      } else {
        console.log(req.fields);
        //Etape 1 : hasher le mot de passe
        const salt = uid2(64);
        const hash = SHA256(req.fields.password + salt).toString(encBase64);
        const token = uid2(64);
        console.log("salt==>", salt);
        console.log("hash==>", hash);

        //Etape 2 : créer le nouvel utilisateur
        const newUser = new User({
          email: req.fields.email,
          account: {
            username: req.fields.username,
            // phone: req.fields.phone,
          },
          newsletter: req.fields.newsletter,
          token: token,
          hash: hash,
          salt: salt,
        });

        //Etape 3 : sauvegarder le nouvel utilisateur dans la bdd
        await newUser.save();
        res.json({
          _id: newUser._id,
          email: newUser.email,
          token: newUser.token,
          account: newUser.account,
        });
      }
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const userToCheck = await User.findOne({ email: req.fields.email });
    if (userToCheck === null) {
      res.status(401).json({ message: "Unauthorized ! 1" });
    } else {
      const newHash = SHA256(req.fields.password + userToCheck.salt).toString(
        encBase64
      );

      console.log("newHash==>", newHash);
      console.log("hashToCheck", userToCheck.hash);
      if (userToCheck.hash === newHash) {
        res.json({
          _id: userToCheck._id,
          token: userToCheck.token,
          account: userToCheck.account,
        });
      } else {
        res.status(401).json({ message: "Unauthorized ! 2" });
      }
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
