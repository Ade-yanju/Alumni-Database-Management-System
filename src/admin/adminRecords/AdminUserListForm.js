// src/admin/adminRecords/list/AdminUserForm.js
import React, { useEffect } from "react";
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
import {
  addDoc,
  setDoc,
  doc,
  getDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";

const schema = Yup.object({
  name: Yup.string().required("Required"),
  email: Yup.string().email("Invalid email").required("Required"),
  role: Yup.string().oneOf(["Admin", "Moderator"]).required("Required"),
  status: Yup.string().oneOf(["Active", "Suspended"]).required("Required"),
});

export default function AdminUserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: "", email: "", role: "Admin", status: "Active" },
  });

  // load existing admin if editing
  useEffect(() => {
    if (!isEdit) return;

    (async () => {
      const snap = await getDoc(doc(db, "admins", id));
      if (!snap.exists()) return;
      const data = snap.data();
      setValue("name", data.name);
      setValue("email", data.email);
      setValue("role", data.role);
      setValue("status", data.status);
    })();
  }, [isEdit, id, setValue]);

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    if (isEdit) {
      await setDoc(doc(db, "admins", id), payload, { merge: true });
    } else {
      await addDoc(collection(db, "admins"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    // navigate back to the Admin Users list
    navigate("/admin/adminRecords/list", { replace: true });
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() =>
              navigate("/admin/adminRecords/list", { replace: true })
            }
          >
            <ArrowBackIos />
          </IconButton>
          <Box
            component="img"
            src="/dulogo.png"
            alt="DU Logo"
            sx={{ width: 32, ml: 1, cursor: "pointer" }}
            onClick={() => navigate("/admin/dashboard", { replace: true })}
          />
          <Typography variant="h6" sx={{ ml: 2 }}>
            {isEdit ? "Edit Admin" : "Add Admin"}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, maxWidth: 600 }}>
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Name"
                error={!!errors.name}
                helperText={errors.name?.message}
                fullWidth
              />
            )}
          />

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
                fullWidth
              />
            )}
          />

          <FormControl fullWidth error={!!errors.role}>
            <InputLabel>Role</InputLabel>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select {...field} label="Role">
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Moderator">Moderator</MenuItem>
                </Select>
              )}
            />
          </FormControl>

          <FormControl fullWidth error={!!errors.status}>
            <InputLabel>Status</InputLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field} label="Status">
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                </Select>
              )}
            />
          </FormControl>

          <Box sx={{ position: "relative", mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              fullWidth
            >
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Admin"
              )}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
