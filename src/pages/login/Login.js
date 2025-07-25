// src/pages/login/Login.js
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
  FormControlLabel,
  Checkbox,
  Divider,
  Link as MuiLink,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const schema = Yup.object({
  email: Yup.string().required("Required").email("Invalid email"),
  password: Yup.string().required("Required"),
  remember: Yup.boolean(),
});

export default function Login() {
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const redirectTo = async (uid) => {
    // check admin first
    const adminSnap = await getDoc(doc(db, "admins", uid));
    if (adminSnap.exists()) {
      return "/admin/dashboard";
    }
    // then alumni
    const alumniSnap = await getDoc(doc(db, "users", uid));
    if (alumniSnap.exists()) {
      return "/dashboard";
    }
    return null;
  };

  const onSubmit = async ({ email, password, remember }) => {
    setLoading(true);
    setErrorMsg("");
    try {
      // 1) persistence
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );
      // 2) sign in
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      // 3) decide route
      const dest = await redirectTo(user.uid);
      if (dest) {
        navigate(dest, { replace: true });
      } else {
        // neither admin nor alumni
        throw new Error("No account found for this user.");
      }
    } catch (err) {
      console.error(err);
      // clear any lingering Firebase session
      if (auth.currentUser) await signOut(auth);
      setErrorMsg(
        err.message === "No account found for this user."
          ? err.message
          : err.code === "auth/user-not-found" ||
            err.code === "auth/wrong-password"
          ? "Email or password is incorrect."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      const dest = await redirectTo(user.uid);
      if (dest) {
        navigate(dest, { replace: true });
      } else {
        throw new Error("No account found for this user.");
      }
    } catch (err) {
      console.error(err);
      if (auth.currentUser) await signOut(auth);
      setErrorMsg(
        err.message === "No account found for this user."
          ? err.message
          : "Google sign-in failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{ position: "relative", minHeight: "100vh", py: 4 }}
    >
      {/* Top-left logo + back to landing */}
      <MuiLink
        component={RouterLink}
        to="/"
        underline="none"
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          display: "flex",
          alignItems: "center",
          bgcolor: "rgba(255,255,255,0.8)",
          px: 1,
          py: 0.5,
          borderRadius: 1,
          zIndex: 10,
        }}
      >
        <Box
          component="img"
          src="/dulogo.png"
          alt="DU Logo"
          sx={{ width: 40, mr: 1 }}
        />
        <Typography variant="h6">DU-Alumni</Typography>
      </MuiLink>

      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" align="center" gutterBottom>
              Welcome Back
            </Typography>

            {/* Google Sign-In */}
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogle}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={20} /> : "Sign in with Google"}
            </Button>

            <Divider sx={{ my: 2 }} />

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMsg}
              </Alert>
            )}

            <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
              <Controller
                name="email"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Email Address"
                    type="email"
                    fullWidth
                    margin="normal"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Password"
                    type="password"
                    fullWidth
                    margin="normal"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="remember"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Remember me"
                  />
                )}
              />

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography
                  component={RouterLink}
                  to="/forgot-password"
                  variant="body2"
                  color="primary"
                  sx={{ textDecoration: "none" }}
                >
                  Forgot Password?
                </Typography>
                <Typography
                  component={RouterLink}
                  to="/signup"
                  variant="body2"
                  color="primary"
                  sx={{ textDecoration: "none" }}
                >
                  Don’t have an account? Create one.
                </Typography>
              </Box>

              <Box sx={{ position: "relative" }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : "Login"}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
