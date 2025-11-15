import { useState, type FormEvent } from "react";
import { login, signUp, forgotPassword, signInWithGoogle, type ApiError } from "../services/auth";

type ViewMode = "login" | "signup" | "forgot-password";

export function LoginPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await login({ email, password });
      setSuccess("Login successful! Redirecting...");
      // Store token if provided
      if (response.token) {
        localStorage.setItem("auth_token", response.token);
      }
      // Navigate to workout discovery (you can replace this with router navigation)
      setTimeout(() => {
        window.location.href = "/discover";
      }, 1000);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await signUp({
        email,
        password,
        username: username || email.split("@")[0],
      });
      setSuccess("Account created successfully! Please log in.");
      setTimeout(() => {
        setViewMode("login");
        setPassword("");
        setConfirmPassword("");
        setUsername("");
      }, 2000);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Sign up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(email);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setUsername("");
    setError(null);
    setSuccess(null);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await signInWithGoogle();
      setSuccess("Login successful! Redirecting...");
      // Store token if provided
      if (response.token) {
        localStorage.setItem("auth_token", response.token);
      }
      // Navigate to workout discovery
      setTimeout(() => {
        window.location.href = "/discover";
      }, 1000);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem 1.5rem",
        width: "100%",
      }}
    >
      {/* Logo/Title */}
      <h1
        className="audiowide-regular"
        style={{
          fontSize: "clamp(2.5rem, 8vw, 4rem)",
          fontWeight: 400,
          margin: 0,
          marginBottom: "0.5rem",
          background: "linear-gradient(135deg, #63ff00 0%, #ffffff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          textAlign: "center",
        }}
      >
        FitDuo Arena
      </h1>

      <p
        style={{
          fontSize: "1rem",
          opacity: 0.9,
          marginBottom: "3rem",
          textAlign: "center",
          color: "white",
        }}
      >
        Battle through AI-refereed workouts
      </p>

      {/* Login Form */}
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          padding: "2.5rem",
          border: "1px solid rgba(99, 255, 0, 0.2)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h2
          className="audiowide-regular"
          style={{
            fontSize: "1.5rem",
            fontWeight: 400,
            margin: 0,
            marginBottom: "1.5rem",
            textAlign: "center",
            color: "#63ff00",
          }}
        >
          {viewMode === "login" && "Sign In"}
          {viewMode === "signup" && "Sign Up"}
          {viewMode === "forgot-password" && "Reset Password"}
        </h2>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              color: "#ff6b6b",
              fontSize: "0.9rem",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              backgroundColor: "rgba(99, 255, 0, 0.2)",
              border: "1px solid rgba(99, 255, 0, 0.5)",
              color: "#63ff00",
              fontSize: "0.9rem",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            {success}
          </div>
        )}

        <form
          onSubmit={
            viewMode === "login"
              ? handleLogin
              : viewMode === "signup"
              ? handleSignUp
              : handleForgotPassword
          }
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
                opacity: 0.9,
                fontFamily: "Audiowide, sans-serif",
                color: "white",
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                border: "1px solid rgba(99, 255, 0, 0.3)",
                background: "rgba(0, 0, 0, 0.3)",
                color: "white",
                fontSize: "1rem",
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.6)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.3)";
              }}
              placeholder="your@email.com"
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
                opacity: 0.9,
                fontFamily: "Audiowide, sans-serif",
                color: "white",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                border: "1px solid rgba(99, 255, 0, 0.3)",
                background: "rgba(0, 0, 0, 0.3)",
                color: "white",
                fontSize: "1rem",
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.3s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.6)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.3)";
              }}
              placeholder="••••••••"
            />
          </div>

          {/* Username (Sign Up only) */}
          {viewMode === "signup" && (
            <div>
              <label
                htmlFor="username"
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  marginBottom: "0.5rem",
                  opacity: 0.9,
                  fontFamily: "Audiowide, sans-serif",
                  color: "white",
                }}
              >
                Username (optional)
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(99, 255, 0, 0.3)",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "white",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.3s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.6)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.3)";
                }}
                placeholder="username"
              />
            </div>
          )}

          {/* Confirm Password (Sign Up only) */}
          {viewMode === "signup" && (
            <div>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  marginBottom: "0.5rem",
                  opacity: 0.9,
                  fontFamily: "Audiowide, sans-serif",
                  color: "white",
                }}
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(99, 255, 0, 0.3)",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "white",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "border-color 0.3s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.6)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 255, 0, 0.3)";
                }}
                placeholder="••••••••"
              />
            </div>
          )}

          {/* Forgot Password (Login only) */}
          {viewMode === "login" && (
            <div style={{ textAlign: "right", marginTop: "-0.5rem" }}>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setViewMode("forgot-password");
                }}
                style={{
                  fontSize: "0.85rem",
                  color: "#63ff00",
                  textDecoration: "none",
                  opacity: 0.8,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0.8";
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "50px",
              border: "none",
              background: isLoading
                ? "rgba(99, 255, 0, 0.5)"
                : "linear-gradient(135deg, #63ff00 0%, #52d700 100%)",
              color: "#202428",
              fontFamily: "Audiowide, sans-serif",
              fontWeight: 400,
              fontSize: "1rem",
              cursor: isLoading ? "not-allowed" : "pointer",
              marginTop: "0.5rem",
              boxShadow: "0 4px 20px rgba(99, 255, 0, 0.3)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 25px rgba(99, 255, 0, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(99, 255, 0, 0.3)";
            }}
          >
            {isLoading
              ? "Loading..."
              : viewMode === "login"
              ? "Sign In"
              : viewMode === "signup"
              ? "Sign Up"
              : "Send Reset Email"}
          </button>
        </form>

        {/* Divider */}
        {(viewMode === "login" || viewMode === "signup") && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "1.5rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "1px",
                backgroundColor: "rgba(99, 255, 0, 0.2)",
              }}
            />
            <span
              style={{
                padding: "0 1rem",
                fontSize: "0.85rem",
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              OR
            </span>
            <div
              style={{
                flex: 1,
                height: "1px",
                backgroundColor: "rgba(99, 255, 0, 0.2)",
              }}
            />
          </div>
        )}

        {/* Google Sign-In Button */}
        {(viewMode === "login" || viewMode === "signup") && (
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "0.875rem 1rem",
              borderRadius: "50px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(10px)",
              color: "white",
              fontFamily: "Audiowide, sans-serif",
              fontWeight: 400,
              fontSize: "0.95rem",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              transition: "all 0.2s ease",
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>
              {viewMode === "login" ? "Sign in with Google" : "Sign up with Google"}
            </span>
          </button>
        )}

        {/* Toggle Links */}
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(99, 255, 0, 0.2)",
            textAlign: "center",
          }}
        >
          {viewMode === "login" && (
            <p style={{ fontSize: "0.9rem", opacity: 0.8, margin: 0, color: "white" }}>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setViewMode("signup");
                }}
                style={{
                  color: "#63ff00",
                  textDecoration: "none",
                  fontFamily: "Audiowide, sans-serif",
                  fontWeight: 400,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0.8";
                }}
              >
                Sign Up
              </button>
            </p>
          )}

          {viewMode === "signup" && (
            <p style={{ fontSize: "0.9rem", opacity: 0.8, margin: 0, color: "white" }}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setViewMode("login");
                }}
                style={{
                  color: "#63ff00",
                  textDecoration: "none",
                  fontFamily: "Audiowide, sans-serif",
                  fontWeight: 400,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0.8";
                }}
              >
                Sign In
              </button>
            </p>
          )}

          {viewMode === "forgot-password" && (
            <p style={{ fontSize: "0.9rem", opacity: 0.8, margin: 0, color: "white" }}>
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setViewMode("login");
                }}
                style={{
                  color: "#63ff00",
                  textDecoration: "none",
                  fontFamily: "Audiowide, sans-serif",
                  fontWeight: 400,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0.8";
                }}
              >
                Back to Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

