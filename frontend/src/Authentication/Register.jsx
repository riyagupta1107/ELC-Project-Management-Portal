import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

import { FirebaseError } from "firebase/app";

export const signup = async (email, password, selectedRole, fullName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    const res = await fetch("http://localhost:5000/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebaseUid: user.uid,
        email: user.email,
        role: selectedRole,
        name: fullName,
      }),
    });

    if (!res.ok) {
      throw new Error("Backend user creation failed");
    }

    return user;
  } catch (error) {
    if (error instanceof FirebaseError) {
      console.error("Firebase error:", error.code);
    } else {
      console.error("Signup error:", error.message);
    }
    throw error;
  }
};
