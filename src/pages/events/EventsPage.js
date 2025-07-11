// src/pages/events/EventsPage.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
} from "@mui/material";
import { ArrowBackIosNew as ArrowBackIcon } from "@mui/icons-material";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function EventsPage() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // 1) Redirect back to dashboard
  const goBack = () => navigate("/dashboard");

  // 2) Load events
  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, "events"), orderBy("date", "asc"));
        const snap = await getDocs(q);
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error loading events:", err);
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, []);

  return (
    <Container sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Box onClick={goBack} sx={{ cursor: "pointer" }}>
          <ArrowBackIcon />
        </Box>
        <Box
          component="img"
          src="/dulogo.png"
          alt="Dominion University Logo"
          sx={{ width: 32, height: 32, mx: 1, cursor: "pointer" }}
          onClick={goBack}
        />
        <Typography variant="h4">Alumni Events</Typography>
      </Box>

      {/* Event list */}
      {loadingEvents ? (
        <Box sx={{ textAlign: "center", pt: 8 }}>
          <CircularProgress />
        </Box>
      ) : events.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h5">No Events Scheduled</Typography>
          <Typography color="text.secondary">
            Check back later for new events!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {events.map((evt) => {
            const dateObj = evt.date.toDate();
            return (
              <Grid item xs={12} sm={6} md={4} key={evt.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {evt.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {format(dateObj, "PPP")} at {format(dateObj, "p")}
                    </Typography>
                    <Typography sx={{ mt: 1 }}>{evt.venue}</Typography>
                    {evt.purpose && (
                      <Typography sx={{ mt: 1 }} color="text.secondary">
                        {evt.purpose}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>{/* No RSVP buttons here */}</CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}
