"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import styles from "../auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("loading");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Email or password is incorrect.");
      setStatus("idle");
      return;
    }

    router.push("/app");
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <Link href="/" className={styles.logo}>
          <span className={styles.mark}>PR</span>
          <span className={styles.dot}>.</span>
          <span className={styles.tail}>ai</span>
        </Link>

        <h1 className={styles.title}>Welcome back.</h1>
        <p className={styles.sub}>Sign in to see your dashboard.</p>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={status === "loading"}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className={styles.submit} disabled={status === "loading"}>
            {status === "loading" ? "Signing in…" : "Sign in"}
          </button>

          <div className={styles.message}>
            {error && <span className={styles.error}>{error}</span>}
          </div>
        </form>

        <div className={styles.foot}>
          New here? <Link href="/signup">Create an account</Link>
        </div>
      </div>
    </main>
  );
}
