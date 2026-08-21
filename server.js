import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import reviewRoutes from  "./routes/reviewRoutes.js"

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());


// Environment validation

if (!process.env.AWS_REGION) {
  throw new Error(
    "AWS_REGION is missing in .env"
  );
}

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is missing in .env"
  );
}


// Home

app.get("/", (req, res) => {

  res.json({

    success: true,

    message:
      "AWS E-Commerce API running"

  });

});


// Routes

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/categories",
  categoryRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/cart",
  cartRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);


app.use("/api/comments", commentRoutes);

app.use("/api/reviews",reviewRoutes)
// 404

app.use((req, res) => {

  res.status(404).json({

    success: false,

    message:
      `Route ${req.method} ${req.originalUrl} not found`

  });

});


// Error handler

app.use(
  (err, req, res, next) => {

    console.error(
      "UNHANDLED ERROR:",
      err
    );

    res.status(500).json({

      success: false,

      message:
        "Internal server error",

      error: err.message

    });

  }
);


// Start server

app.listen(
  PORT,
  () => {

    console.log(
      `E-Commerce API running on http://localhost:${PORT}`
    );

  }
);