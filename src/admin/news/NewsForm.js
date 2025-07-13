// src/admin/news/NewsFormAdmin.js
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
  InputLabel,
} from "@mui/material";
import { ArrowBackIos } from "@mui/icons-material";
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
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { db } from "../../services/firebase";

const schema = Yup.object({
  headline: Yup.string().required("Headline is required"),
  body: Yup.string().min(10, "Too short").required("Body is required"),
});

export default function NewsFormAdmin() {
  const { newsId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(newsId);
  const auth = getAuth();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { headline: "", body: "" },
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  // load existing
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const snap = await getDoc(doc(db, "news", newsId));
      if (!snap.exists()) return;
      const data = snap.data();
      setValue("headline", data.headline);
      setValue("body", data.body);
      setPreview(data.imageURL || "");
    })();
  }, [isEdit, newsId, setValue]);

  // preview on select
  useEffect(() => {
    if (!imageFile) return setPreview((p) => p);
    const fr = new FileReader();
    fr.onload = () => setPreview(fr.result);
    fr.readAsDataURL(imageFile);
  }, [imageFile]);

  const uploadToCloudinary = async (file) => {
    const form = new FormData();
    form.append("file", file);
    form.append(
      "upload_preset",
      process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
    );
    const r = await axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/upload`,
      form
    );
    return r.data.secure_url;
  };

  const onSubmit = async (data) => {
    let imageURL = preview && !imageFile ? preview : "";
    if (imageFile) {
      imageURL = await uploadToCloudinary(imageFile);
    }

    const payload = {
      headline: data.headline,
      body: data.body,
      imageURL,
      author: auth.currentUser.displayName || auth.currentUser.email,
      updatedAt: serverTimestamp(),
    };

    if (isEdit) {
      await setDoc(doc(db, "news", newsId), payload, { merge: true });
    } else {
      await addDoc(collection(db, "news"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    navigate("/admin/news");
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/admin/news")}
          >
            <ArrowBackIos />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2 }}>
            {isEdit ? "Edit Announcement" : "New Announcement"}
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
            name="headline"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Headline"
                error={!!errors.headline}
                helperText={errors.headline?.message}
                fullWidth
              />
            )}
          />

          <Controller
            name="body"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Body"
                multiline
                rows={6}
                error={!!errors.body}
                helperText={errors.body?.message}
                fullWidth
              />
            )}
          />

          <InputLabel>Image (optional)</InputLabel>
          <Button variant="outlined" component="label">
            {imageFile ? "Change Image" : "Upload Image"}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
          </Button>
          {preview && (
            <Box
              component="img"
              src={preview}
              alt="preview"
              sx={{ maxWidth: 300, mt: 1 }}
            />
          )}

          <Box sx={{ position: "relative", mt: 2 }}>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? (
                <CircularProgress size={24} />
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Publish"
              )}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
