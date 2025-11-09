"use server";
import bcrypt from "bcryptjs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const register = async (values: any) => {
  const { email, password, name } = values;
  const encryptedPassword = await bcrypt.hash(password, 10);
  // Make the API request
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/players`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        encrypted_password: encryptedPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        error: errorData.message || "Registration failed!",
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Registration error:", error);
    return {
      error: "An unexpected error occurred during registration.",
    };
  }
};
