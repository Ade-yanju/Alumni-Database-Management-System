// src/admin/events/EventFormAdmin.js
import React, { useState, useEffect } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  TextField,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
} from "@mui/material";
import { ArrowBackIos } from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import axios from "axios";
import {
  addDoc,
  setDoc,
  doc,
  getDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../services/firebase";

const schema = Yup.object({
  title: Yup.string().required("Title is required"),
  date: Yup.date().required("Date & Time is required"),
  location: Yup.string().required("Location is required"),
  description: Yup.string()
    .min(10, "Minimum 10 characters")
    .required("Description is required"),
});

export default function EventFormAdmin() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(eventId);

  const [tab, setTab] = useState(0);
  const [bannerFile, setBannerFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: "",
      date: null,
      location: "",
      description: "",
    },
  });

  // Load existing event when editing
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const snap = await getDoc(doc(db, "events", eventId));
      if (!snap.exists()) return;
      const data = snap.data();
      setValue("title", data.title);
      setValue("date", data.date.toDate());
      setValue("location", data.location);
      setValue("description", data.description);
    })();
  }, [isEdit, eventId, setValue]);

  // Helper to upload a single file to Cloudinary
  const uploadToCloudinary = async (file) => {
    const form = new FormData();
    form.append("file", file);
    form.append(
      "upload_preset",
      process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
    );
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/upload`,
      form
    );
    return res.data.secure_url;
  };

  const onSubmit = async (data) => {
    // 1) Banner upload
    let bannerURL = "";
    if (bannerFile) {
      bannerURL = await uploadToCloudinary(bannerFile);
    }

    // 2) Prepare payload
    const payload = {
      title: data.title,
      date: Timestamp.fromDate(data.date),
      location: data.location,
      description: data.description,
      ...(bannerURL && { bannerURL }),
      updatedAt: serverTimestamp(),
    };

    let eventRef;
    if (isEdit) {
      await setDoc(doc(db, "events", eventId), payload, { merge: true });
      eventRef = doc(db, "events", eventId);
    } else {
      eventRef = await addDoc(collection(db, "events"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    // 3) Gallery uploads
    if (galleryFiles.length) {
      await Promise.all(
        galleryFiles.map(async (file) => {
          const url = await uploadToCloudinary(file);
          await addDoc(collection(db, "events", eventRef.id, "gallery"), {
            url,
            uploadedAt: serverTimestamp(),
          });
        })
      );
    }

    navigate("/admin/events");
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/admin/events")}
          >
            <ArrowBackIos />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2 }}>
            {isEdit ? "Edit Event" : "Add Event"}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Details" />
          <Tab label="Media" />
        </Tabs>

        {tab === 0 && (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
            >
              <Controller
                name="title"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Title"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="date"
                control={control}
                render={({ field, fieldState }) => (
                  <DateTimePicker
                    {...field}
                    label="Date & Time"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                )}
              />

              <Controller
                name="location"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Location"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Description"
                    multiline
                    rows={4}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Box sx={{ position: "relative", mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : "Save Event"}
                </Button>
              </Box>
            </Box>
          </LocalizationProvider>
        )}

        {tab === 1 && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Button variant="outlined" component="label">
                {bannerFile ? "Change Banner" : "Upload Banner"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setBannerFile(e.target.files[0])}
                />
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label">
                {galleryFiles.length
                  ? `${galleryFiles.length} selected`
                  : "Upload Gallery Images"}
                <input
                  type="file"
                  multiple
                  hidden
                  accept="image/*"
                  onChange={(e) => setGalleryFiles(Array.from(e.target.files))}
                />
              </Button>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
}
