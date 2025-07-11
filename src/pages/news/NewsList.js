// src/pages/news/NewsList.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Box,
  Alert,
  IconButton,
} from "@mui/material";
import { ArrowBackIosNew as ArrowBackIcon } from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function NewsList() {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setNews(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      } catch (e) {
        console.error(e);
        setError("Failed to load news.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Container sx={{ py: 4 }}>
      {/* Header with back arrow & DU crest */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <IconButton onClick={() => navigate("/dashboard")}>
          <ArrowBackIcon />
        </IconButton>
        <Box
          component="img"
          src="/dulogo.png"
          alt="Dominion University Logo"
          sx={{ width: 32, height: 32, mx: 1, cursor: "pointer" }}
          onClick={() => navigate("/dashboard")}
        />
        <Typography variant="h4">Alumni News</Typography>
      </Box>

      {/* Loading */}
      {loading ? (
        <Box sx={{ textAlign: "center", pt: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          {news.map((item) => (
            <Grid item xs={12} md={6} key={item.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    variant="body2"
                    gutterBottom
                  >
                    {item.createdAt?.toDate().toLocaleDateString()}
                  </Typography>
                  <Typography>
                    {item.content
                      .replace(/<\/?[^>]+(>|$)/g, "") /* strip HTML if any */
                      .slice(0, 150)}
                    …
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    component={RouterLink}
                    to={`/news/${item.id}`}
                  >
                    Read More
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
