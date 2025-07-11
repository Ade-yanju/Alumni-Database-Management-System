// src/pages/LandingPage.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  useTheme,
  CircularProgress,
  Link as MuiLink,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PeopleIcon from "@mui/icons-material/People";
import EventIcon from "@mui/icons-material/Event";
import ArticleIcon from "@mui/icons-material/Article";
import LanguageIcon from "@mui/icons-material/Language";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import {
  collection,
  getCountFromServer,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
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
  const [alumniCount, setAlumniCount] = useState(null);
  const [totalEvents, setTotalEvents] = useState(null);
  const [upcomingCount, setUpcomingCount] = useState(null);

  useEffect(() => {
    async function fetchCounts() {
      // 1) Active alumni: where disabled == false
      try {
        const alumniQuery = query(
          collection(db, "users"),
          where("disabled", "==", false)
        );
        const snap = await getCountFromServer(alumniQuery);
        setAlumniCount(snap.data().count);
      } catch {
        setAlumniCount(0);
      }

      // 2) Total events hosted: where cancelled == false
      try {
        const eventsQuery = query(
          collection(db, "events"),
          where("cancelled", "==", false)
        );
        const snap = await getCountFromServer(eventsQuery);
        setTotalEvents(snap.data().count);
      } catch {
        setTotalEvents(0);
      }

      // 3) Upcoming events: date >= now AND cancelled == false
      try {
        const now = Timestamp.fromDate(new Date());
        const upcomingQuery = query(
          collection(db, "events"),
          where("date", ">=", now),
          where("cancelled", "==", false)
        );
        const snap = await getCountFromServer(upcomingQuery);
        setUpcomingCount(snap.data().count);
      } catch {
        setUpcomingCount(0);
      }
    }

    fetchCounts();
  }, []);

  return (
    <Box component="main" sx={{ pb: 8 }}>
      {/* Top-left logo + title */}
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
          alt="Dominion University Crest"
          sx={{ width: 48, height: 48, mr: 1 }}
        />
        <Typography variant="h6" color="textPrimary">
          DU-ALUMNI
        </Typography>
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

      {/* Stats */}
      <Container sx={{ py: 6 }}>
        <Grid container spacing={4} justifyContent="center">
          {[
            { label: "Total Alumni", value: alumniCount },
            { label: "Total Events Hosted", value: totalEvents },
            { label: "Upcoming Events", value: upcomingCount },
          ].map(({ label, value }) => (
            <Grid key={label} item xs={12} sm={4}>
              <Card sx={{ textAlign: "center", py: 4 }}>
                <CardContent>
                  {value === null ? (
                    <CircularProgress />
                  ) : (
                    <Typography variant="h4">
                      {value.toLocaleString()}
                    </Typography>
                  )}
                  <Typography color="text.secondary">{label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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
          {/* Social Links */}
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
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <LanguageIcon /> Website
            </MuiLink>
            <MuiLink
              href="https://www.instagram.com/dominionuniversityibadan/?hl=en"
              target="_blank"
              rel="noopener"
              color="inherit"
              underline="none"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <InstagramIcon /> Instagram
            </MuiLink>
            <MuiLink
              href="https://www.facebook.com/DominionUniversityIbadan/"
              target="_blank"
              rel="noopener"
              color="inherit"
              underline="none"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <FacebookIcon /> Facebook
            </MuiLink>
          </Box>

          {/* Copyright */}
          <Typography variant="body2">
            © {new Date().getFullYear()} Dominion University Alumni. All rights
            reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
