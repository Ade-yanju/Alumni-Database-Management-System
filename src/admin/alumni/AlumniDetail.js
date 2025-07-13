// src/admin/alumni/AlumniDetail.js
import React, { useState, useEffect } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Container,
  Tabs,
  Tab,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
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
} from "firebase/firestore";
import { db } from "../../services/firebase";

export default function AlumniDetail() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvps, setRsvps] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const pSnap = await getDoc(doc(db, "users", uid));
      setProfile(pSnap.data());
      setLoading(false);
    })();
  }, [uid]);

  useEffect(() => {
    if (tab === 1) {
      (async () => {
        const snap = await getDocs(collection(db, "users", uid, "rsvps"));
        setRsvps(snap.docs.map((d) => d.data()));
      })();
    }
    if (tab === 2) {
      (async () => {
        const q = query(
          collection(db, "messages", uid, "threads"),
          orderBy("lastUpdated", "desc")
        );
        const snap = await getDocs(q);
        setMessages(snap.docs.map((d) => d.data()));
      })();
    }
  }, [tab, uid]);

  if (loading || !profile) {
    return (
      <Box sx={{ textAlign: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/admin/alumni")}
          >
            <ArrowBackIos />
          </IconButton>
          <Box
            component="img"
            src="/dulogo.png"
            alt="DU Logo"
            sx={{ width: 32, ml: 1, cursor: "pointer" }}
            onClick={() => navigate("/admin/dashboard")}
          />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Alumnus Details
          </Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Avatar src={profile.photoURL} sx={{ width: 80, height: 80 }} />
          <Box>
            <Typography variant="h5">{profile.fullName}</Typography>
            <Typography color="text.secondary">{profile.email}</Typography>
            <Typography>
              Class of {profile.gradYear} • {profile.department}
            </Typography>
          </Box>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Profile" />
          <Tab label="RSVPs" />
          <Tab label="Messages" />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Location"
              value={profile.location || ""}
              fullWidth
              margin="normal"
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="About"
              value={profile.about || ""}
              fullWidth
              margin="normal"
              multiline
              rows={4}
              InputProps={{ readOnly: true }}
            />
          </Box>
        )}

        {tab === 1 && (
          <List>
            {rsvps.map((r, i) => (
              <ListItem key={i}>
                <ListItemText
                  primary={r.eventTitle}
                  secondary={new Date(r.createdAt.toDate()).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        )}

        {tab === 2 && (
          <List>
            {messages.map((m, i) => (
              <ListItem key={i}>
                <ListItemText
                  primary={m.title}
                  secondary={new Date(m.lastUpdated.toDate()).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Container>
    </Box>
  );
}
