import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
dotenv.config(); // Load environment variables

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); // Enable cross-origin requests
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Simple Test Route
app.get("/", (req, res) => {
  res.send("Welcome to Auto Care Manager API!");
});

app.get("/car-list", (req, res) => {
  res.send(carsList);
});

// PostgreSQL connection
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "The_AMS_Database",
  password: "Brio1234",
  port: 5432,
});
db.connect();
//****************************************/*/
//****** Route to Add a New Customer ******//
//****************************************/*/
app.post("/new_customer", async (req, res) => {
  try {
    const {
      fname,
      lname,
      phone_number,
      email_address,
      date_created,
      time_created,
    } = req.body;

    // Input validation: Manually checking if required fields exist
    if (!fname || !lname || !phone_number || !email_address) {
      return res.status(400).json({
        error:
          "First name, last name, phone number, and email address are required.",
      });
    }

    const customer = {
      fname,
      lname,
      phone_number,
      email_address,
      date_created: date_created || new Date().toISOString().split("T")[0], // Default to today
      time_created: time_created || new Date().toLocaleTimeString(), // Default to current time
    };
    console.log(customer);
    // Insert query
    const query = `
      INSERT INTO customers (fname, lname, phone_number, email_address, date_created, time_created)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING customer_id, fname, lname, phone_number, email_address, date_created, time_created;
    `;

    const values = [
      customer.fname,
      customer.lname,
      customer.phone_number,
      customer.email_address,
      customer.date_created,
      customer.time_created,
    ];
    console.log(values);
    // Query execution
    const result = await db.query(query, values);
    // Sending a successful response
    res.status(201).json({
      message: "Customer added successfully",
      customer: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding customer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//****************************************/*/
//****** Route to Add a New Vehicle *******//
//****************************************/*/

app.post("/new_car", async (req, res) => {
  try {
    const {
      customer_id,
      make,
      model,
      year,
      license_plate,
      vin,
      color,
      date_created,
      time_created,
    } = req.body;

    // Input validation: Manually checking if required fields exist
    if (
      !customer_id ||
      !make ||
      !model ||
      !year ||
      !license_plate ||
      !vin ||
      !color
    ) {
      return res.status(400).json({
        error: "Please fill in all fields are required.",
      });
    }

    const car = {
      customer_id,
      make,
      model,
      year,
      license_plate,
      vin,
      color,
      date_created: date_created || new Date().toISOString().split("T")[0], // Default to today
      time_created: time_created || new Date().toLocaleTimeString(), // Default to current time
    };

    // Insert query for the vehicles table
    const query = `
INSERT INTO vehicles (customer_id, make, model, year, license_plate, vin, color, date_created, time_created)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING vehicle_id, customer_id, make, model, year, license_plate, vin, color, date_created, time_created;
`;

    const values = [
      car.customer_id,
      car.make,
      car.model,
      car.year,
      car.license_plate,
      car.vin,
      car.color,
      car.date_created,
      car.time_created,
    ];
    // Query execution
    const result = await db.query(query, values);
    // Sending a successful response
    res.status(201).json({
      message: "car added successfully",
      car: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding car:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
