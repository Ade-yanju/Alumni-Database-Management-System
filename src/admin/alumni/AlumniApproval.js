// src/admin/alumni/AlumniForm.js
import React, { useState, useEffect } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  CircularProgress,
} from "@mui/material";
import { ArrowBackIos } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from "axios";
import {
  addDoc,
  setDoc,
  doc,
  getDoc,
  collection, // ← added import
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";

const CURRENT_YEAR = new Date().getFullYear();

const schema = Yup.object({
  fullName: Yup.string().required("Required").min(2, "Min 2 characters"),
  email: Yup.string().required("Required").email("Invalid email"),
  gradYear: Yup.number()
    .required("Required")
    .min(1900, "Too old")
    .max(CURRENT_YEAR, `Max ${CURRENT_YEAR}`),
  department: Yup.string().required("Required"),
  status: Yup.string()
    .oneOf(["Active", "Inactive", "Pending"], "Invalid status")
    .required("Required"),
  profilePic: Yup.mixed()
    .test("size", "≤2MB", (file) => !file || file.size <= 2e6)
    .test(
      "type",
      "Only JPG/PNG",
      (file) => !file || ["image/jpeg", "image/png"].includes(file.type)
    ),
});

export default function AlumniForm() {
  const { uid } = useParams(); // undefined on “new”
  const navigate = useNavigate();
  const isEdit = Boolean(uid);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      gradYear: "",
      department: "",
      status: "Active",
      profilePic: null,
    },
  });

  // Load existing data for edit
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (!snap.exists()) return;
      const data = snap.data();
      setValue("fullName", data.fullName || "");
      setValue("email", data.email || "");
      setValue("gradYear", data.gradYear || "");
      setValue("department", data.department || "");
      setValue("status", data.status || "Active");
    })();
  }, [isEdit, uid, setValue]);

  const onSubmit = async (data) => {
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

    const payload = {
      fullName: data.fullName,
      email: data.email,
      gradYear: data.gradYear,
      department: data.department,
      status: data.status,
      photoURL,
      updatedAt: serverTimestamp(),
    };

    if (isEdit) {
      await setDoc(doc(db, "users", uid), payload, { merge: true });
    } else {
      await addDoc(collection(db, "users"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    navigate("/admin/alumni");
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/admin/alumni")}
          >
            <ArrowBackIos />
          </IconButton>
          <Box
            component="img"
            src="/dulogo.png"
            alt="DU Logo"
            sx={{ width: 32, ml: 1, cursor: "pointer" }}
            onClick={() => navigate("/admin/dashboard")}
          />
          <Typography variant="h6" sx={{ ml: 2 }}>
            {isEdit ? "Edit Alumni" : "Add Alumni"}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, maxWidth: 600 }}>
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {/* Full Name */}
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Full Name"
                error={!!errors.fullName}
                helperText={errors.fullName?.message}
              />
            )}
          />

          {/* Email */}
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email"
                type="email"
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />

          {/* Graduation Year */}
          <FormControl fullWidth error={!!errors.gradYear}>
            <InputLabel>Graduation Year</InputLabel>
            <Controller
              name="gradYear"
              control={control}
              render={({ field }) => (
                <Select {...field} label="Graduation Year">
                  {Array.from(
                    { length: CURRENT_YEAR - 1899 },
                    (_, i) => 1900 + i
                  ).map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
            <Typography variant="caption" color="error">
              {errors.gradYear?.message}
            </Typography>
          </FormControl>

          {/* Department */}
          <Controller
            name="department"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Department"
                error={!!errors.department}
                helperText={errors.department?.message}
              />
            )}
          />

          {/* Status */}
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field} label="Status">
                  {["Active", "Inactive", "Pending"].map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>

          {/* Profile Picture */}
          <Controller
            name="profilePic"
            control={control}
            render={({ field }) => (
              <Button variant="outlined" component="label">
                {field.value ? "Change Picture" : "Upload Picture"}
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png"
                  onChange={(e) => field.onChange(e.target.files[0])}
                />
              </Button>
            )}
          />

          {/* Submit */}
          <Button variant="contained" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Create Alumni"
            )}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
