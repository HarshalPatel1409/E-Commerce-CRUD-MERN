const express = require("express");
const cors = require("cors");
require("./db/config.js");
const User = require("./models/User.js");
const Product = require("./models/Product.js");
const Jwt = require("jsonwebtoken");
const jwtKey = "Harshal";

const app = express();

app.use(express.json());
// Cors used when front-end & back-end roun on different Routes/Server
app.use(cors());

// Registration Route
app.post("/register", async (req, res) => {
  let user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result;

  // Creating & Sending the Token
  Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
    if (err) {
      res.send({ result: "Something went wrong" });
    }
    res.send({ result, auth: token });
  });
});

// Login Route
app.post("/login", async (req, res) => {
  console.log(req.body);
  if (req.body.password && req.body.email) {
    let user = await User.findOne(req.body).select("-password");
    // If user Found use JWT
    if (user) {
      // Creating & Sending the Token
      Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
          res.send({ result: "Something went wrong" });
        }
        res.send({ user, auth: token });
      });
    } else {
      res.send({ result: "No User Found" });
    }
  } else {
    res.send({ result: "No User Found" });
  }
});

// Add Product Route
app.post("/addProduct", verifyToken, async (req, res) => {
  let product = new Product(req.body);
  let result = await product.save();
  res.send(result);
});

// Product List Route
app.get("/products", verifyToken, async (req, res) => {
  let products = await Product.find();
  if (products.length > 0) {
    res.send(products);
  } else {
    res.send({ result: "No Products Found" });
  }
});

// API To Delete Product
app.delete("/product/:id", verifyToken, async (req, res) => {
  const result = await Product.deleteOne({ _id: req.params.id });
  res.send(result);
});

// API To Get the Product details from the database
app.get("/product/:id", verifyToken, async (req, res) => {
  let result = await Product.findOne({ _id: req.params.id });
  if (result) {
    res.send(result);
  } else {
    res.send(result, "No Record Found");
  }
});

// API to Update the Product
app.put("/product/:id", verifyToken, async (req, res) => {
  let result = await Product.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );
  res.send(result);
});

// API to get Product from Search Bar
app.get("/search/:key", verifyToken, async (req, res) => {
  let result = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { price: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
      { company: { $regex: req.params.key } },
    ],
  });
  res.send(result);
});

// Middleware
function verifyToken(req, res, next) {
  // Getting the token from the Header
  let token = req.headers["authorization"];
  if (token) {
    token = token.split(" ")[1];

    // To verify the jwt Token
    Jwt.verify(token, jwtKey, (err, valid) => {
      if (err) {
        res.status(401).send({ result: "Please Provide Valid Token." });
      } else {
        next();
      }
    });
  } else {
    res.status(403).send({ result: "Please Add Token With Header." });
  }
}

app.listen(5000, () => {
  console.log("Server is running on port " + 5000);
});
