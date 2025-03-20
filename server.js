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
app.get("/", (req, res) => {
  res.send("Welcome to Auto Care Manager API!");
});

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

    // Check if the customer already exists using email or phone number
    const checkQuery = `
        SELECT * FROM customers WHERE phone_number = $1 OR email_address = $2;
        `;
    const checkResult = await db.query(checkQuery, [
      phone_number,
      email_address,
    ]);

    if (checkResult.rows.length > 0) {
      // Customer exists, return existing customer details
      return res.status(200).json({
        message: "Customer already exists by this email or Phone_number",
        customer: checkResult.rows[0], // Returns customer_id and other details
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

    // Check if the customer already exists using email or phone number
    const checkQuery = `SELECT * FROM vehicles WHERE vin = $1;`; // Use the correct table
    const checkResult = await db.query(checkQuery, [vin]);

    if (checkResult.rows.length > 0) {
      // Customer exists, return existing customer details
      return res.status(200).json({
        message: "Vehicle already exists by this VIN Number",
        customer: checkResult.rows[0], // Returns customer_id and other details
      });
    }

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

//***************************************************/*/
//***** Route to schedule a maintenance reminder *****//
//***************************************************/*/

// Route to book a schedule
app.post("/book_schedule", async (req, res) => {
  try {
    const {
      customer_id,
      vehicle_id,
      service_type,
      service_date,
      service_time,
    } = req.body;

    // Input validation: Ensure required fields are provided
    if (
      !customer_id ||
      !vehicle_id ||
      !service_type ||
      !service_date ||
      !service_time
    ) {
      return res.status(400).json({
        error:
          "Customer ID, Vehicle ID, Service Type, Service Date, and Service Time are required.",
      });
    }

    // Insert query to book the schedule
    const query = `
      INSERT INTO schedules (customer_id, vehicle_id, service_type, service_date, service_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING schedule_id, customer_id, vehicle_id, service_type, service_date, service_time, status, date_created;
    `;

    const values = [
      customer_id,
      vehicle_id,
      service_type,
      service_date,
      service_time,
    ];

    // Query execution
    const result = await db.query(query, values);

    // Sending a successful response
    res.status(201).json({
      message: "Schedule booked successfully",
      schedule: result.rows[0],
    });
  } catch (error) {
    console.error("Error booking schedule:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
