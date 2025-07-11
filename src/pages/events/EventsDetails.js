// src/pages/events/EventDetail.js
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";

export default function EventDetail() {
  const { id } = useParams();
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState("");

  const [rsvpUsers, setRsvpUsers] = useState([]);
  const [loadingRsvps, setLoadingRsvps] = useState(true);

  // 1) load the event itself
  useEffect(() => {
    (async () => {
      setLoadingEvent(true);
      try {
        const snap = await getDoc(doc(db, "events", id));
        if (!snap.exists()) {
          setEventError("Event not found.");
        } else {
          setEvent({ id: snap.id, ...snap.data() });
        }
      } catch (e) {
        console.error(e);
        setEventError("Failed to load event.");
      } finally {
        setLoadingEvent(false);
      }
    })();
  }, [id]);

  // 2) load RSVPs from events/{id}/rsvps
  const loadRsvps = async () => {
    setLoadingRsvps(true);
    try {
      const col = collection(db, "events", id, "rsvps");
      const snaps = await getDocs(col);
      const uids = snaps.docs.map((d) => d.id);

      // fetch each user profile
      const profiles = await Promise.all(
        uids.map(async (u) => {
          const userSnap = await getDoc(doc(db, "users", u));
          return userSnap.exists()
            ? { uid: userSnap.id, ...userSnap.data() }
            : null;
        })
      );
      setRsvpUsers(profiles.filter(Boolean));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRsvps(false);
    }
  };

  useEffect(() => {
    if (id) loadRsvps();
  }, [id]);

  // 3) RSVP state
  const isRegistered = rsvpUsers.some((u) => u.uid === uid);

  // 4) handlers
  const handleRsvp = async () => {
    if (!uid) return;
    await setDoc(doc(db, "events", id, "rsvps", uid), {
      createdAt: serverTimestamp(),
    });
    await loadRsvps();
  };
  const handleCancel = async () => {
    if (!uid) return;
    await deleteDoc(doc(db, "events", id, "rsvps", uid));
    await loadRsvps();
  };

  // render
  if (loadingEvent) {
    return (
      <Box sx={{ textAlign: "center", pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (eventError) {
    return (
      <Container sx={{ py: 8, textAlign: "center" }}>
        <Alert severity="error">{eventError}</Alert>
        <Button component={RouterLink} to="/events" sx={{ mt: 2 }}>
          Back to Events
        </Button>
      </Container>
    );
  }

  const dateObj = event.date.toDate();
  return (
    <Container sx={{ py: 4 }}>
      <Button component={RouterLink} to="/events" sx={{ mb: 3 }}>
        ← Back to Events
      </Button>

      <Typography variant="h4" gutterBottom>
        {event.title}
      </Typography>
      <Typography color="text.secondary">
        {dateObj.toLocaleDateString()} at{" "}
        {dateObj.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Typography>
      <Typography sx={{ mt: 1 }}>{event.venue}</Typography>
      {event.purpose && <Typography sx={{ mt: 2 }}>{event.purpose}</Typography>}
      {event.description && (
        <Typography sx={{ mt: 2 }}>{event.description}</Typography>
      )}

      {/* RSVP Button */}
      <Box sx={{ mt: 4 }}>
        {uid ? (
          isRegistered ? (
            <Button variant="outlined" color="error" onClick={handleCancel}>
              Cancel RSVP
            </Button>
          ) : (
            <Button variant="contained" onClick={handleRsvp}>
              RSVP
            </Button>
          )
        ) : (
          <Alert severity="info">Please log in to RSVP.</Alert>
        )}
      </Box>

      {/* Attendee List */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Registered Alumni
        </Typography>
        {loadingRsvps ? (
          <CircularProgress size={24} />
        ) : rsvpUsers.length === 0 ? (
          <Typography color="text.secondary">No one has RSVP’d yet.</Typography>
        ) : (
          <List>
            {rsvpUsers.map((u) => (
              <ListItem key={u.uid}>
                <ListItemAvatar>
                  <Avatar src={u.photoURL} />
                </ListItemAvatar>
                <ListItemText
                  primary={u.fullName}
                  secondary={`Class of ${u.gradYear}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Container>
  );
}
