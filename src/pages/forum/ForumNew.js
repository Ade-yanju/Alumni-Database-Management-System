// src/pages/forum/ForumNew.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  MenuItem,
  Button,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import axios from "axios";
import { db } from "../../services/firebase";

const CATEGORIES = ["General", "Career", "Tech Help", "Local Chapters"];

export default function ForumNew() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [user, setUser] = useState(null);
  useEffect(() => onAuthStateChanged(auth, setUser), [auth]);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);

  // now arrays:
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // handle multiple file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    // update both arrays
    setImageFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = null; // reset input
  };

  // remove one by index
  const removeImage = (idx) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      return setSnack({
        open: true,
        message: "Log in to post.",
        severity: "warning",
      });
    }
    setLoading(true);
    try {
      const uploadPromises = imageFiles.map((file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "upload_preset",
          process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
        );
        return axios
          .post(
            `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/upload`,
            formData
          )
          .then((res) => res.data.secure_url);
      });

      // wait for all uploads
      const imageURLs = await Promise.all(uploadPromises);

      // Save discussion
      const docRef = await addDoc(collection(db, "forum"), {
        uid: user.uid,
        title,
        body,
        category,
        imageURLs,
        createdAt: serverTimestamp(),
      });

      setSnack({ open: true, message: "Thread created!", severity: "success" });
      navigate(`/forum/${docRef.id}`);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Failed to create.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        New Discussion
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 600 }}
      >
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <TextField
          label="Category"
          select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          multiline
          rows={6}
          required
        />

        {/* Multiple Image upload */}
        <Button variant="outlined" component="label">
          Attach Images
          <input
            type="file"
            hidden
            accept="image/png, image/jpeg"
            multiple
            onChange={handleFileChange}
          />
        </Button>

        {/* Previews with remove buttons */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {imagePreviews.map((src, idx) => (
            <Box key={idx} sx={{ position: "relative" }}>
              <Box
                component="img"
                src={src}
                alt={`preview-${idx}`}
                sx={{
                  width: 100,
                  height: 100,
                  objectFit: "cover",
                  borderRadius: 1,
                }}
              />
              <IconButton
                size="small"
                onClick={() => removeImage(idx)}
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bgcolor: "rgba(255,255,255,0.7)",
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>

        <Box sx={{ position: "relative", width: 120, mt: 2 }}>
          <Button type="submit" variant="contained" disabled={loading}>
            Post
          </Button>
          {loading && (
            <CircularProgress
              size={24}
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          )}
        </Box>
      </Box>

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
  );
}
