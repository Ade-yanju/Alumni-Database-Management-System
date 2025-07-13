// src/admin/forum/ForumModeration.js
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  CircularProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import { ArrowBackIos } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  collectionGroup,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../services/firebase";

// A minimal set of “hate/abusive” keywords for demo purposes:
const BAD_WORDS = [
  "hate",
  "idiot",
  "stupid",
  "dumb",
  "kill",
  "kill yourself",
  // …add as needed
];

// Utility: does `text` contain any BAD_WORDS?
function containsAbuse(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BAD_WORDS.some((w) => lower.includes(w));
}

export default function ForumModeration() {
  const navigate = useNavigate();
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Load all replies
  useEffect(() => {
    (async () => {
      setLoading(true);
      const q = query(
        collectionGroup(db, "replies"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        threadPath: d.ref.parent.parent.path, // e.g. "forum/{threadId}"
        ...d.data(),
      }));
      setReplies(data);
      setLoading(false);
    })();
  }, []);

  // Memoize which replies are “flagged”
  const flagged = useMemo(
    () =>
      new Set(replies.filter((r) => containsAbuse(r.text)).map((r) => r.id)),
    [replies]
  );

  // Delete a reply
  const handleDelete = async (r) => {
    setDeletingId(r.id);
    await deleteDoc(doc(db, `${r.threadPath}/replies/${r.id}`));
    setReplies((prev) => prev.filter((x) => x.id !== r.id));
    setDeletingId(null);
  };

  return (
    <Box>
      {/* Top App Bar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/admin/dashboard")}
          >
            <Box
              component="img"
              src="/dulogo.png"
              alt="DU Logo"
              sx={{ width: 32 }}
            />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2 }}>
            Forum Moderation
          </Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : replies.length === 0 ? (
          <Typography>No replies in forum.</Typography>
        ) : (
          <List>
            {replies.map((r) => {
              const isFlagged = flagged.has(r.id);
              return (
                <ListItem
                  key={r.id}
                  alignItems="flex-start"
                  sx={{
                    bgcolor: isFlagged ? "rgba(255, 0, 0, 0.1)" : "inherit",
                    mb: 1,
                    borderRadius: 1,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={r.photoURL} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <>
                        {r.name}{" "}
                        {isFlagged && (
                          <Chip
                            label="Flagged"
                            color="error"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </>
                    }
                    secondary={
                      <>
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: "pre-line",
                            color: isFlagged ? "error.main" : "text.primary",
                          }}
                        >
                          {r.text}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {r.createdAt?.toDate().toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Remove Reply">
                      <Button
                        color="error"
                        size="small"
                        onClick={() => handleDelete(r)}
                        disabled={deletingId === r.id}
                      >
                        {deletingId === r.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          "Delete"
                        )}
                      </Button>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}
      </Container>
    </Box>
  );
}
