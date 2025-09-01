import CustomersModel from "../models/customers.js";
import EmployeesModel from "../models/employee.js";
import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import { config } from "../config.js";

const loginController = {};

const maxAttempts = 3;
const lockTime = 15 * 60 * 1000; // 15 minutos

loginController.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    let userFound;
    let userType;

    // 1. Admin
    if (email === config.emailAdmin.email && password === config.emailAdmin.password) {
      userType = "Admin";
      userFound = { _id: "Admin" };
    } else {
      // 2. Employee
      userFound = await EmployeesModel.findOne({ email });
      userType = "Employee";

      // 3. Customer
      if (!userFound) {
        userFound = await CustomersModel.findOne({ email });
        userType = "Customer";
      }
    }

    if (!userFound) return res.status(404).json({ message: "User not found" });

    if (userType !== "Admin") {
      if (userFound.lockTime && userFound.lockTime > Date.now()) {
        const minutosRestantes = Math.ceil((userFound.lockTime - Date.now()) / 60000);
        return res.status(403).json({
          message: "Cuenta bloqueada, intenta de nuevo en " + minutosRestantes + " minutos",
        });
      }

      // Validar contraseña
      const isMatch = await bcryptjs.compare(password, userFound.password);
      if (!isMatch) {
        userFound.loginAttempts = (userFound.loginAttempts || 0) + 1;

        if (userFound.loginAttempts >= maxAttempts) {
          userFound.lockTime = Date.now() + lockTime;
          await userFound.save();
          return res.status(403).json({ message: "Usuario bloqueado" });
        }

        await userFound.save();
        return res.status(401).json({ message: "Invalid password" });
      }

      // Resetear intentos si es correcta
      userFound.loginAttempts = 0;
      userFound.lockTime = null;
      await userFound.save();
    }

    // Generar token
    const token = jsonwebtoken.sign(
      { id: userFound._id, userType },
      config.JWT.secret,
      { expiresIn: config.JWT.expiresIn }
    );

    res.cookie("authToken", token, {
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
      sameSite: "lax",
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export default loginController;
