// src/pages/LandingPage.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Card,
  IconButton,
  CardContent,
  useTheme,
  Link as MuiLink,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ArrowBackIos from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIos from "@mui/icons-material/ArrowForwardIos";
import PeopleIcon from "@mui/icons-material/People";
import EventIcon from "@mui/icons-material/Event";
import ArticleIcon from "@mui/icons-material/Article";
import LanguageIcon from "@mui/icons-material/Language";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import { collection, query, onSnapshot, limit } from "firebase/firestore";
import { db } from "../services/firebase";

const features = [
  {
    icon: <PeopleIcon fontSize="large" />,
    title: "Directory",
    desc: "Find and connect with fellow alumni.",
    to: "/directory",
  },
  {
    icon: <EventIcon fontSize="large" />,
    title: "Events",
    desc: "Stay up-to-date on upcoming gatherings.",
    to: "/events",
  },
  {
    icon: <ArticleIcon fontSize="large" />,
    title: "News",
    desc: "Read the latest alumni announcements.",
    to: "/news",
  },
];

export default function LandingPage() {
  const theme = useTheme();
  const [alumniList, setAlumniList] = useState([]); // [{ id, photoURL }, …]
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "users"), limit(10));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((doc) => {
            const d = doc.data();
            if (d.disabled) return null;
            if (!d.photoURL) return null;
            return { id: doc.id, photoURL: d.photoURL };
          })
          .filter(Boolean);
        setAlumniList(list);
        if (current >= list.length) setCurrent(0);
      },
      (err) => {
        console.error("Carousel load failed:", err);
        setAlumniList([]);
      }
    );
    return () => unsub();
  }, [current]);

  const prev = () =>
    setCurrent((c) =>
      alumniList.length ? (c - 1 + alumniList.length) % alumniList.length : 0
    );
  const next = () =>
    setCurrent((c) => (alumniList.length ? (c + 1) % alumniList.length : 0));

  return (
    <Box component="main" sx={{ pb: 8 }}>
      {/* Logo */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          display: "flex",
          alignItems: "center",
          bgcolor: "rgba(255,255,255,0.9)",
          px: 2,
          py: 1,
          borderRadius: 1,
          zIndex: 10,
        }}
      >
        <Box
          component="img"
          src="/dulogo.png"
          alt="DU Crest"
          sx={{ width: 48, height: 48, mr: 1 }}
        />
        <Typography variant="h6">DU-ALUMNI</Typography>
      </Box>

      {/* Hero */}
      <Box
        sx={{
          mt: { xs: 0, md: 8 },
          mx: "auto",
          maxWidth: 960,
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
          background: `url('/du.png') center/cover no-repeat`,
          pt: { xs: 8, md: 0 },
        }}
      >
        <Box
          sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.5)" }}
        />
        <Box
          sx={{
            position: "relative",
            color: "#fff",
            textAlign: "center",
            py: { xs: 6, md: 12 },
          }}
        >
          <Typography variant="h3" gutterBottom>
            Welcome to Dominion University Alumni Network
          </Typography>
          <Typography variant="h6" paragraph>
            Connect with fellow graduates, explore opportunities, and stay
            engaged with the Dominion community.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              color="secondary"
              sx={{ mr: 2 }}
            >
              Login
            </Button>
            <Button
              component={RouterLink}
              to="/signup"
              variant="outlined"
              color="inherit"
            >
              Register
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Carousel */}
      <Container sx={{ mt: 6, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          Meet Our Alumni
        </Typography>
        <Box
          sx={{
            position: "relative",
            width: 300,
            height: 300,
            mx: "auto",
            mb: 4,
          }}
        >
          <IconButton
            onClick={prev}
            sx={{
              position: "absolute",
              top: "50%",
              left: 0,
              transform: "translateY(-50%)",
              color: "#fff",
              bgcolor: "rgba(0,0,0,0.3)",
            }}
          >
            <ArrowBackIos />
          </IconButton>

          {alumniList.length ? (
            <Box
              component="img"
              src={alumniList[current].photoURL}
              alt={`Alumnus ${current + 1}`}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 2,
              }}
            />
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: "300px" }}
            >
              No alumni photos to display
            </Typography>
          )}

          <IconButton
            onClick={next}
            sx={{
              position: "absolute",
              top: "50%",
              right: 0,
              transform: "translateY(-50%)",
              color: "#fff",
              bgcolor: "rgba(0,0,0,0.3)",
            }}
          >
            <ArrowForwardIos />
          </IconButton>
        </Box>
      </Container>

      {/* Feature Cards */}
      <Container sx={{ py: 4 }}>
        <Grid container spacing={3} justifyContent="center">
          {features.map((f) => (
            <Grid item xs={12} sm={6} md={4} key={f.title}>
              <Card
                component={RouterLink}
                to={f.to}
                elevation={1}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  p: 2,
                  textDecoration: "none",
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                }}
              >
                <Box sx={{ color: theme.palette.primary.main, mr: 2 }}>
                  {f.icon}
                </Box>
                <Box>
                  <Typography variant="subtitle1">{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {f.desc}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 4,
          mt: 8,
          backgroundColor: theme.palette.primary.dark,
          color: "#fff",
        }}
      >
        <Container sx={{ textAlign: "center" }}>
          <Box
            sx={{
              mb: 2,
              display: "flex",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <MuiLink
              href="https://dominionuniversity.edu.ng/"
              target="_blank"
              rel="noopener"
              color="inherit"
              underline="none"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <LanguageIcon /> Website
            </MuiLink>
            <MuiLink
              href="https://www.instagram.com/dominionuniversityibadan"
              target="_blank"
              rel="noopener"
              color="inherit"
              underline="none"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <InstagramIcon /> Instagram
            </MuiLink>
            <MuiLink
              href="https://www.facebook.com/DominionUniversityIbadan"
              target="_blank"
              rel="noopener"
              color="inherit"
              underline="none"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <FacebookIcon /> Facebook
            </MuiLink>
          </Box>
          <Typography variant="body2">
            © {new Date().getFullYear()} Dominion University Alumni. All rights
            reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
