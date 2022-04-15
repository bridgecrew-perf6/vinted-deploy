const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

//import du model Offer
const Offer = require("../models/Offer");

//import du middleware
const isAuthenticated = require("../middlewares/isAuthenticated");

//Je viens configurer cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const newOffer = new Offer({
      product_name: req.fields.title,
      product_description: req.fields.description,
      product_price: req.fields.price,
      product_details: [
        { MARQUE: req.fields.brand },
        { TAILLE: req.fields.size },
        { ETAT: req.fields.condition },
        { COULEUR: req.fields.color },
        { EMPLACEMENT: req.fields.city },
      ],
      owner: req.user,
    });

    //J'envoie mon image sur cloudinary
    const result = await cloudinary.uploader.upload(req.files.picture.path, {
      folder: "vinted/offers",
      public_id: `${req.fields.title} - ${newOffer._id}`,
    });

    newOffer.product_image = result;

    await newOffer.save();

    res.json(newOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    const filtersObject = {};

    //gestion du Title
    if (req.query.title) {
      filtersObject.product_name = new RegExp(req.query.title, "i");
    }

    if (req.query.priceMin) {
      filtersObject.product_price = { $gte: req.query.priceMin };
    }

    //si j'ai déjà une clé product_price dans mon objet objectFilters
    if (req.query.priceMax) {
      if (filtersObject.product_price) {
        filtersObject.product_price.$lte = req.query.priceMax;
      } else {
        filtersObject.product_price = {
          $lte: req.query.priceMax,
        };
      }
    }
    //gestion du tri avec l'objet sortObject
    const sortObject = {};
    if (req.query.sort === "price-desc") {
      sortObject.product_price = "desc";
    } else if (req.query.sort === "price-asc") {
      sortObject.product_price = "asc";
    }

    // console.log(filtersObject);

    //gestion de la pagination
    // On a par défaut 5 annonces par page
    //Si ma page est égale à 1 je devrais skip 0 annonces
    //Si ma page est égale à 2 je devrais skip 5 annonces
    //Si ma page est égale à 4 je devrais skip 15 annonces

    //(1-1) * 5 = skip 0 ==> PAGE 1
    //(2-1) * 5 = SKIP 5 ==> PAGE 2
    //(4-1) * 5 = SKIP 15 ==> PAGE 4
    // ==> (PAGE - 1) * LIMIT

    let limit = 3;
    if (req.query.limit) {
      limit = req.query.limit;
    }

    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const offers = await Offer.find(filtersObject)
      .sort(sortObject)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("product_name product_price");

    const count = await Offer.countDocuments(filtersObject);

    res.json({ count: count, offers: offers });
  } catch (error) {
    res.status(400).json(error.message);
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account.username email -_id",
    });
    res.json(offer);
  } catch (error) {
    res.status(400).json(error.message);
  }
});

module.exports = router;
