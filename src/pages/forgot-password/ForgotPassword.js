// src/pages/forgot-password/ForgotPassword.js
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Container,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const schema = Yup.object({
  email: Yup.string()
    .required("Email is required")
    .email("Enter a valid email"),
});

export default function ForgotPassword() {
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{ position: "relative", minHeight: "100vh", py: 4 }}
    >
      {/* Logo + Site Name */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          display: "flex",
          alignItems: "center",
          bgcolor: "rgba(255,255,255,0.8)",
          px: 2,
          py: 1,
          borderRadius: 1,
          zIndex: 10,
        }}
      >
        <Box
          component="img"
          src="/dulogo.png"
          alt="Dominion University Crest"
          sx={{ width: 40, height: 40, mr: 1 }}
        />
        <Typography variant="h6" color="textPrimary">
          Dominion Alumni
        </Typography>
      </Box>

      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" gutterBottom align="center">
              Forgot Password
            </Typography>

            {submitted ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  If that email is registered, you’ll receive a reset link
                  shortly.
                </Alert>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Back to Login
                </Button>
                <Typography variant="body2">
                  Already have a reset link?{" "}
                  <RouterLink
                    to="/reset-password"
                    style={{ textDecoration: "none", color: "#1976d2" }}
                  >
                    Reset Password
                  </RouterLink>
                </Typography>
              </Box>
            ) : (
              <Box
                component="form"
                noValidate
                onSubmit={handleSubmit(onSubmit)}
              >
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email Address"
                      type="email"
                      fullWidth
                      margin="normal"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />

                <Box sx={{ mt: 3, position: "relative" }}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? (
                      <CircularProgress size={20} />
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </Box>

                <Box sx={{ mt: 2, textAlign: "center" }}>
                  <Typography variant="body2">
                    <RouterLink
                      to="/login"
                      style={{ textDecoration: "none", color: "#1976d2" }}
                    >
                      Back to Login
                    </RouterLink>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Don’t have an account?{" "}
                    <RouterLink
                      to="/signup"
                      style={{ textDecoration: "none", color: "#1976d2" }}
                    >
                      Sign Up
                    </RouterLink>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Already have a reset link?{" "}
                    <RouterLink
                      to="/reset-password"
                      style={{ textDecoration: "none", color: "#1976d2" }}
                    >
                      Reset Password
                    </RouterLink>
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}
