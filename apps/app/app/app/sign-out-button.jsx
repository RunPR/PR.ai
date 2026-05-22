"use client";

import { signOut } from "next-auth/react";
import styles from "./app.module.css";

export default function SignOutButton() {
  return (
    <button
      className={styles.signOut}
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Sign out
    </button>
  );
}
