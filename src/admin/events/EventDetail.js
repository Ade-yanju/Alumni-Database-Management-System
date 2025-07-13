// src/admin/events/EventDetail.js
import React, { useState, useEffect } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Tabs,
  Tab,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { ArrowBackIos } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { format } from "date-fns";

export default function EventDetailAdmin() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // load event doc
      const eSnap = await getDoc(doc(db, "events", eventId));
      setEvent(eSnap.data());
      // attendees subcollection
      const rSnap = await getDocs(collection(db, "events", eventId, "rsvps"));
      setAttendees(rSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      // gallery images subcollection
      const gSnap = await getDocs(collection(db, "events", eventId, "gallery"));
      setGallery(gSnap.docs.map((d) => d.data().url));
      setLoading(false);
    })();
  }, [eventId]);

  if (loading || !event) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const date = event.date?.toDate ? event.date.toDate() : new Date();

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
            {event.title}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          height: 200,
          background: `url(${event.bannerURL}) center/cover no-repeat`,
          position: "relative",
        }}
      />

      <Container sx={{ mt: 2 }}>
        <Typography variant="subtitle1" color="text.secondary">
          {format(date, "PPpp")} — {event.location}
        </Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2 }}>
          <Tab label="Details" />
          <Tab label={`Attendees (${attendees.length})`} />
          <Tab label={`Gallery (${gallery.length})`} />
        </Tabs>

        {tab === 0 && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography>{event.description}</Typography>
            </CardContent>
          </Card>
        )}

        {tab === 1 && (
          <Table sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Alumnus</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>RSVP Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendees.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.uid}</TableCell>
                  <TableCell>{r.status || "pending"}</TableCell>
                  <TableCell>
                    {r.createdAt?.toDate
                      ? format(r.createdAt.toDate(), "PPpp")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {tab === 2 && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {gallery.map((url, i) => (
              <Grid item xs={6} sm={4} md={3} key={i}>
                <Avatar
                  variant="rounded"
                  src={url}
                  sx={{ width: "100%", height: 120 }}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
