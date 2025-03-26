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

//***************************************************************/*/
//****** Route to handle every thing for the Customer table ******//
//***************************************************************/*/

//********* Route to create new customer info *********//

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

//********* Route to change customer info *********//

app.patch("/update_customer/:customer_id", async (req, res) => {
  try {
    const customer_id = parseInt(req.params.customer_id);
    const { fname, lname, email_address, phone_number } = req.body;
    console.log(customer_id);
    if (isNaN(customer_id)) {
      return res.status(400).json({ error: "Invalid customer ID." });
    }

    // Check if customer exists
    const checkQuery = `SELECT * FROM customers WHERE customer_id = $1`;
    const existingCustomer = await db.query(checkQuery, [customer_id]);

    if (existingCustomer.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found." });
    }

    // Prepare the fields to update
    const updateFields = [];
    const values = [];

    if (fname) {
      updateFields.push(`fname = $${values.length + 1}`);
      values.push(fname);
    }
    if (lname) {
      updateFields.push(`lname = $${values.length + 1}`);
      values.push(lname);
    }
    if (email_address) {
      updateFields.push(`email_address = $${values.length + 1}`);
      values.push(email_address);
    }
    if (phone_number) {
      updateFields.push(`phone_number = $${values.length + 1}`);
      values.push(phone_number);
    }

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one field is required to update." });
    }

    // Add customer_id as the last parameter
    values.push(customer_id);

    const updateQuery = `
      UPDATE customers
      SET ${updateFields.join(", ")}
      WHERE customer_id = $${values.length}
      RETURNING customer_id, fname, lname, email_address, phone_number;
    `;

    // Execute the update query
    const result = await db.query(updateQuery, values);

    res.status(200).json({
      message: "Customer updated successfully.",
      customer: result.rows[0], // Fix: Returning correct data
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//****************************************************************/*/
//****** RRoute to handle every thing for the vehicle table *******//
//****************************************************************/*/

//********* Route to create new vehicle info *********//

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

//********* Route to change vehicle info *********//

app.patch("/update_vehicle/:vehicle_id", async (req, res) => {
  try {
    const vehicle_id = parseInt(req.params.vehicle_id);
    const { customer_id, make, model, license_plate, vin, color } = req.body;
    if (isNaN(vehicle_id)) {
      return res.status(400).json({ error: "Invalid vehicle ID." });
    }

    // Check if customer exists
    const checkQuery = `SELECT * FROM vehicles WHERE vehicle_id = $1`;
    const existingVehicle = await db.query(checkQuery, [vehicle_id]);

    if (existingVehicle.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found." });
    }

    // Prepare the fields to update
    const updateFields = [];
    const values = [];

    if (customer_id) {
      updateFields.push(`customer_id = $${values.length + 1}`);
      values.push(customer_id);
    }
    if (make) {
      updateFields.push(`make = $${values.length + 1}`);
      values.push(make);
    }
    if (model) {
      updateFields.push(`model = $${values.length + 1}`);
      values.push(model);
    }
    if (license_plate) {
      updateFields.push(`license_plate = $${values.length + 1}`);
      values.push(license_plate);
    }
    if (vin) {
      updateFields.push(`vin = $${values.length + 1}`);
      values.push(vin);
    }
    if (color) {
      updateFields.push(`color = $${values.length + 1}`);
      values.push(color);
    }

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one field is required to update." });
    }

    // Add customer_id as the last parameter
    values.push(vehicle_id);

    const updateQuery = `
      UPDATE vehicles
      SET ${updateFields.join(", ")}
      WHERE vehicle_id = $${values.length}
      RETURNING vehicle_id, customer_id, make, model, year, license_plate, vin, color;
    `;

    // Execute the update query
    const result = await db.query(updateQuery, values);

    res.status(200).json({
      message: "Vehicle updated successfully.",
      customer: result.rows[0], // Fix: Returning correct data
    });
  } catch (error) {
    console.error("Error updating Vehicle:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//***************************************************************/*/
//****** Route to handle every thing for the mechanics table ******//
//***************************************************************/*/

//********* Route to create new mechanic **********//

app.post("/add_mechanic", async (req, res) => {
  try {
    const { fname, lname, email_address, phone_number } = req.body;

    // Validate input
    if (!fname || !lname || !email_address || !phone_number) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Check if mechanic already exists (based on email or phone)
    const checkQuery = `
      SELECT * FROM mechanics 
      WHERE email_address = $1 OR phone_number = $2;
    `;
    const existingMechanic = await db.query(checkQuery, [
      email_address,
      phone_number,
    ]);

    if (existingMechanic.rows.length > 0) {
      return res.status(409).json({
        message: "Mechanic already exists.",
        mechanic: existingMechanic.rows[0],
      });
    }

    // Insert new mechanic
    const insertQuery = `
      INSERT INTO mechanics (fname, lname, email_address, phone_number) 
      VALUES ($1, $2, $3, $4) 
      RETURNING mechanic_id, fname, lname, email_address, phone_number;
    `;
    const values = [fname, lname, email_address, phone_number];

    const result = await db.query(insertQuery, values);

    res.status(201).json({
      message: "Mechanic added successfully.",
      mechanic: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding mechanic:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//********* Route to change mechanics info *********//

app.patch("/update_mechanic/:mechanic_id", async (req, res) => {
  try {
    const mechanic_id = parseInt(req.params.mechanic_id);
    const { fname, lname, email_address, phone_number } = req.body;
    if (isNaN(mechanic_id)) {
      return res.status(400).json({ error: "Invalid Mechanic ID." });
    }

    // Check if customer exists
    const checkQuery = `SELECT * FROM mechanics WHERE mechanic_id = $1`;
    const existingMechanic = await db.query(checkQuery, [mechanic_id]);

    if (existingMechanic.rows.length === 0) {
      return res.status(404).json({ error: "Mechanic not found." });
    }

    // Prepare the fields to update
    const updateFields = [];
    const values = [];

    if (fname) {
      updateFields.push(`fname = $${values.length + 1}`);
      values.push(fname);
    }
    if (lname) {
      updateFields.push(`lname = $${values.length + 1}`);
      values.push(lname);
    }
    if (email_address) {
      updateFields.push(`email_address = $${values.length + 1}`);
      values.push(email_address);
    }
    if (phone_number) {
      updateFields.push(`phone_number = $${values.length + 1}`);
      values.push(phone_number);
    }

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one field is required to update." });
    }

    // Add customer_id as the last parameter
    values.push(mechanic_id);

    const updateQuery = `
      UPDATE mechanics
      SET ${updateFields.join(", ")}
      WHERE mechanic_id = $${values.length}
      RETURNING mechanic_id, fname, lname, email_address, phone_number;
    `;

    // Execute the update query
    const result = await db.query(updateQuery, values);

    res.status(200).json({
      message: "Mechanic updated successfully.",
      customer: result.rows[0], // Fix: Returning correct data
    });
  } catch (error) {
    console.error("Error updating:", error);
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

//***************************************************/*/
//********* Route to create new service log **********//
//***************************************************/*/

app.post("/create_service_log", async (req, res) => {
  try {
    const {
      vehicle_id,
      service_type,
      service_details,
      mechanic_id,
      parts_replaced,
    } = req.body;

    // Validate input
    if (!vehicle_id || !service_type || !service_details || !mechanic_id) {
      return res.status(400).json({
        error:
          "vehicle_id, service_type, service_details, mechanic_id are required.",
      });
    }

    // Get current date for service_date
    const serviceDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    // Insert into service_logs table
    const query = `
      INSERT INTO service_records 
      (vehicle_id, service_type, service_date, service_details, mechanic_id, parts_replaced)
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING service_id, vehicle_id, service_type, service_date, service_details, mechanic_id, parts_replaced;
    `;

    const values = [
      vehicle_id,
      service_type,
      serviceDate,
      service_details,
      mechanic_id,
      parts_replaced,
    ];

    const result = await db.query(query, values);

    res.status(201).json({
      message: "Service log created successfully",
      serviceLog: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating service log:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//************************************************/*/
//********* Route to change customer info *********//
//************************************************/*/

app.patch("/update_customer/:customer_id", async (req, res) => {
  try {
    const customer_id = parseInt(req.params.customer_id);
    const { fname, lname, email_address, phone_number } = req.body;
    console.log(customer_id);
    if (isNaN(customer_id)) {
      return res.status(400).json({ error: "Invalid customer ID." });
    }

    // Check if customer exists
    const checkQuery = `SELECT * FROM customers WHERE customer_id = $1`;
    const existingCustomer = await db.query(checkQuery, [customer_id]);

    if (existingCustomer.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found." });
    }

    // Prepare the fields to update
    const updateFields = [];
    const values = [];

    if (fname) {
      updateFields.push(`fname = $${values.length + 1}`);
      values.push(fname);
    }
    if (lname) {
      updateFields.push(`lname = $${values.length + 1}`);
      values.push(lname);
    }
    if (email_address) {
      updateFields.push(`email_address = $${values.length + 1}`);
      values.push(email_address);
    }
    if (phone_number) {
      updateFields.push(`phone_number = $${values.length + 1}`);
      values.push(phone_number);
    }

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one field is required to update." });
    }

    // Add customer_id as the last parameter
    values.push(customer_id);

    const updateQuery = `
      UPDATE customers
      SET ${updateFields.join(", ")}
      WHERE customer_id = $${values.length}
      RETURNING customer_id, fname, lname, email_address, phone_number;
    `;

    // Execute the update query
    const result = await db.query(updateQuery, values);

    res.status(200).json({
      message: "Customer updated successfully.",
      customer: result.rows[0], // Fix: Returning correct data
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//************************************************/*/
//********* Route to change customer info *********//
//************************************************/*/

app.patch("/update_customer/:customer_id", async (req, res) => {
  try {
    const customer_id = parseInt(req.params.customer_id);
    const { fname, lname, email_address, phone_number } = req.body;
    console.log(customer_id);
    if (isNaN(customer_id)) {
      return res.status(400).json({ error: "Invalid customer ID." });
    }

    // Check if customer exists
    const checkQuery = `SELECT * FROM customers WHERE customer_id = $1`;
    const existingCustomer = await db.query(checkQuery, [customer_id]);

    if (existingCustomer.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found." });
    }

    // Prepare the fields to update
    const updateFields = [];
    const values = [];

    if (fname) {
      updateFields.push(`fname = $${values.length + 1}`);
      values.push(fname);
    }
    if (lname) {
      updateFields.push(`lname = $${values.length + 1}`);
      values.push(lname);
    }
    if (email_address) {
      updateFields.push(`email_address = $${values.length + 1}`);
      values.push(email_address);
    }
    if (phone_number) {
      updateFields.push(`phone_number = $${values.length + 1}`);
      values.push(phone_number);
    }

    if (updateFields.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one field is required to update." });
    }

    // Add customer_id as the last parameter
    values.push(customer_id);

    const updateQuery = `
      UPDATE customers
      SET ${updateFields.join(", ")}
      WHERE customer_id = $${values.length}
      RETURNING customer_id, fname, lname, email_address, phone_number;
    `;

    // Execute the update query
    const result = await db.query(updateQuery, values);

    res.status(200).json({
      message: "Customer updated successfully.",
      customer: result.rows[0], // Fix: Returning correct data
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
