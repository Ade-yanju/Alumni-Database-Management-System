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

const CURRENT_YEAR = new Date().getFullYear();

// Dropdown options
const DEPARTMENTS = [
  "Computer Sciences",
  "Biological Sciences",
  "Chemical Sciences",
  "Management Sciences",
  "Mass Communication",
  "Criminology and Security Studies",
  "Economics",
  "Accounting",
  "Business Administration",
];

const PROGRAMMES = [
  "Accounting",
  "Economics",
  "Criminology and Security Studies",
  "Mass Communication",
  "Business Administration",
  "Computer Science",
  "Cyber Security",
  "Software Engineering",
  "Biochemistry",
  "Industrial Chemistry",
  "Microbiology",
];

const schema = Yup.object({
  fullName: Yup.string().required("Required").min(2),
  gradYear: Yup.number()
    .required("Required")
    .min(1900)
    .max(CURRENT_YEAR, `≤${CURRENT_YEAR}`),
  department: Yup.string()
    .oneOf(DEPARTMENTS, "Select a valid department")
    .required("Required"),
  programme: Yup.string()
    .oneOf(PROGRAMMES, "Select a valid programme")
    .required("Required"),
  email: Yup.string().required("Required").email("Invalid email"),
  password: Yup.string()
    .required("Required")
    .min(8, "Min 8 characters")
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

  // after sign-up, redirect based on role
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

  // Google sign-up handler
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
      // 1) upload profilePic if present
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

      // 2) create auth user
      const { user } = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      await updateProfile(user, { displayName: data.fullName, photoURL });

      // 3) write Firestore record
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
        message: "Account created! Redirecting...",
        severity: "success",
      });
      setTimeout(() => postSignInRedirect(user.uid), 1200);
    } catch (err) {
      console.error(err);
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
      {/* Logo / back link */}
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
              {/* Full Name */}
              <Controller
                name="fullName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Full Name"
                    fullWidth
                    margin="normal"
                    error={!!errors.fullName}
                    helperText={errors.fullName?.message}
                  />
                )}
              />

              {/* Graduation Year */}
              <Controller
                name="gradYear"
                control={control}
                render={({ field }) => (
                  <FormControl
                    fullWidth
                    margin="normal"
                    error={!!errors.gradYear}
                  >
                    <InputLabel>Graduation Year</InputLabel>
                    <Select {...field} label="Graduation Year">
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {Array.from(
                        { length: CURRENT_YEAR - 2022 },
                        (_, i) => 2023 + i
                      ).map((yr) => (
                        <MenuItem key={yr} value={yr}>
                          {yr}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.gradYear && (
                      <Typography variant="caption" color="error">
                        {errors.gradYear.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              {/* Department */}
              <Controller
                name="department"
                control={control}
                render={({ field }) => (
                  <FormControl
                    fullWidth
                    margin="normal"
                    error={!!errors.department}
                  >
                    <InputLabel>Department</InputLabel>
                    <Select {...field} label="Department">
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {DEPARTMENTS.map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.department && (
                      <Typography variant="caption" color="error">
                        {errors.department.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              {/* Programme */}
              <Controller
                name="programme"
                control={control}
                render={({ field }) => (
                  <FormControl
                    fullWidth
                    margin="normal"
                    error={!!errors.programme}
                  >
                    <InputLabel>Programme</InputLabel>
                    <Select {...field} label="Programme">
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {PROGRAMMES.map((prog) => (
                        <MenuItem key={prog} value={prog}>
                          {prog}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.programme && (
                      <Typography variant="caption" color="error">
                        {errors.programme.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />

              {/* Email */}
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

              {/* Password */}
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    margin="normal"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((p) => !p)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />

              {/* Confirm Password */}
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Confirm Password"
                    type={showConfirm ? "text" : "password"}
                    fullWidth
                    margin="normal"
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirm((p) => !p)}
                            edge="end"
                          >
                            {showConfirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />

              {/* Profile Picture */}
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
                <Button component={RouterLink} to="/login">
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
