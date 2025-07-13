// src/admin/news/NewsDetailAdmin.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import { ArrowBackIos, Edit as EditIcon } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function NewsDetailAdmin() {
  const { newsId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "news", newsId));
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
      setLoading(false);
    })();
  }, [newsId]);

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
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            {loading ? "Loading..." : item?.headline}
          </Typography>
          {!loading && (
            <IconButton onClick={() => navigate(`/admin/news/${newsId}/edit`)}>
              <EditIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            {item.imageURL && (
              <Box
                component="img"
                src={item.imageURL}
                alt=""
                sx={{ width: "100%", borderRadius: 1, mb: 2 }}
              />
            )}
            <Typography variant="h4" gutterBottom>
              {item.headline}
            </Typography>
            <Typography color="text.secondary" paragraph>
              {item.createdAt?.toDate().toLocaleDateString()}
            </Typography>
            <Typography sx={{ whiteSpace: "pre-line" }}>{item.body}</Typography>
          </>
        )}
      </Container>
    </Box>
  );
}
