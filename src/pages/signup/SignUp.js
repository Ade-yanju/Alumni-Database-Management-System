// src/pages/signup/SignUp.js
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Container,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
  Link as MuiLink,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

const CURRENT_YEAR = 2025;
const schema = Yup.object({
  fullName: Yup.string().required("Required").min(2),
  gradYear: Yup.number()
    .required("Required")
    .min(1900)
    .max(CURRENT_YEAR, `≤${CURRENT_YEAR}`),
  department: Yup.string().required("Required"),
  programme: Yup.string().required("Required"),
  email: Yup.string().required("Required").email("Invalid email"),
  password: Yup.string()
    .required("Required")
    .min(8)
    .matches(/\d/, "Must contain a number")
    .matches(/[!@#$%^&*]/, "Must contain a symbol"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Required"),
  profilePic: Yup.mixed()
    .test("fileSize", "≤2MB", (file) => !file || file.size <= 2e6)
    .test(
      "fileType",
      "JPG/PNG only",
      (file) => !file || ["image/jpeg", "image/png"].includes(file.type)
    ),
});

export default function SignUp() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "error",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: "",
      gradYear: "",
      department: "",
      programme: "",
      email: "",
      password: "",
      confirmPassword: "",
      profilePic: null,
    },
  });

  const postSignInRedirect = async (uid) => {
    const alum = await getDoc(doc(db, "users", uid));
    if (alum.exists()) return navigate("/dashboard", { replace: true });
    const adm = await getDoc(doc(db, "admins", uid));
    if (adm.exists()) return navigate("/admin/dashboard", { replace: true });
    setSnack({
      open: true,
      message: "No account profile found.",
      severity: "error",
    });
    await auth.signOut();
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      await setDoc(
        doc(db, "users", user.uid),
        {
          fullName: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      await postSignInRedirect(user.uid);
    } catch (err) {
      setSnack({ open: true, message: err.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let photoURL = "";
      if (data.profilePic) {
        const formData = new FormData();
        formData.append("file", data.profilePic);
        formData.append(
          "upload_preset",
          process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
        );
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/upload`,
          formData
        );
        photoURL = res.data.secure_url;
      }

      const { user } = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      await updateProfile(user, { displayName: data.fullName, photoURL });
      await setDoc(doc(db, "users", user.uid), {
        fullName: data.fullName,
        gradYear: data.gradYear,
        department: data.department,
        programme: data.programme,
        email: data.email,
        photoURL,
        createdAt: serverTimestamp(),
      });

      setSnack({
        open: true,
        message: "Account created!",
        severity: "success",
      });
      setTimeout(() => postSignInRedirect(user.uid), 1200);
    } catch (err) {
      setSnack({ open: true, message: err.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{ position: "relative", minHeight: "100vh", py: 4 }}
    >
      {/* Top-left clickable: back to LandingPage */}
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
          alt="DU Crest"
          sx={{ width: 40, height: 40, mr: 1 }}
        />
        <Typography variant="h6">DU-Alumni</Typography>
      </MuiLink>

      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h5" align="center" gutterBottom>
              Create Your Alumni Account
            </Typography>

            {/* Google Sign-up */}
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleSignup}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={20} /> : "Sign up with Google"}
            </Button>

            <Divider sx={{ my: 2 }} />

            <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
              {/* map over fields */}
              {[
                { name: "fullName", label: "Full Name", type: "text" },
                {
                  name: "gradYear",
                  label: "Graduation Year",
                  type: "select",
                  options: Array.from(
                    { length: CURRENT_YEAR - 2022 },
                    (_, i) => 2023 + i
                  ),
                },
                { name: "department", label: "Department", type: "text" },
                { name: "programme", label: "Programme", type: "text" },
                { name: "email", label: "Email Address", type: "email" },
                {
                  name: "password",
                  label: "Password",
                  type: showPassword ? "text" : "password",
                  adornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((p) => !p)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
                {
                  name: "confirmPassword",
                  label: "Confirm Password",
                  type: showConfirm ? "text" : "password",
                  adornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirm((p) => !p)}
                        edge="end"
                      >
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              ].map((field) =>
                field.type === "select" ? (
                  <Controller
                    key={field.name}
                    name={field.name}
                    control={control}
                    render={({ field: f }) => (
                      <FormControl
                        fullWidth
                        margin="normal"
                        error={!!errors[field.name]}
                      >
                        <InputLabel>{field.label}</InputLabel>
                        <Select {...f} label={field.label}>
                          <MenuItem value="">Select year</MenuItem>
                          {field.options.map((yr) => (
                            <MenuItem key={yr} value={yr}>
                              {yr}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors[field.name] && (
                          <Typography variant="caption" color="error">
                            {errors[field.name]?.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                ) : (
                  <Controller
                    key={field.name}
                    name={field.name}
                    control={control}
                    render={({ field: f }) => (
                      <TextField
                        {...f}
                        label={field.label}
                        type={field.type}
                        fullWidth
                        margin="normal"
                        error={!!errors[field.name]}
                        helperText={errors[field.name]?.message}
                        InputProps={
                          field.adornment
                            ? { endAdornment: field.adornment }
                            : {}
                        }
                      />
                    )}
                  />
                )
              )}

              {/* Profile Picture uploader */}
              <Controller
                name="profilePic"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Box sx={{ my: 2 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      color={errors.profilePic ? "error" : "primary"}
                    >
                      {value
                        ? "Change Profile Picture"
                        : "Upload Profile Picture"}
                      <input
                        type="file"
                        hidden
                        accept="image/png, image/jpeg"
                        onChange={(e) => onChange(e.target.files[0])}
                      />
                    </Button>
                    {errors.profilePic && (
                      <Typography variant="caption" color="error">
                        {errors.profilePic.message}
                      </Typography>
                    )}
                  </Box>
                )}
              />

              {/* Submit */}
              <Box sx={{ mt: 3, position: "relative" }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : "Create Account"}
                </Button>
              </Box>
            </Box>

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2">
                Already have an account?{" "}
                <Button component={RouterLink} to="/login" variant="text">
                  Log in
                </Button>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          <Alert
            severity={snack.severity}
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}
