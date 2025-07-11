// src/pages/forum/ForumThread.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Avatar,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ArrowBackIosNew as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../services/firebase";

export default function ForumThread() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();

  // current user
  const [user, setUser] = useState(null);
  useEffect(() => onAuthStateChanged(auth, setUser), [auth]);

  // thread + replies
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);

  // new-reply
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // edit-reply
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");

  // delete-reply
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // snackbar
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // load thread + replies
  useEffect(() => {
    (async () => {
      try {
        // load thread doc
        const tSnap = await getDoc(doc(db, "forum", threadId));
        if (!tSnap.exists()) {
          setSnack({
            open: true,
            message: "Thread not found.",
            severity: "error",
          });
          setLoading(false);
          return;
        }
        setThread({ id: tSnap.id, ...tSnap.data() });

        // load replies sub-collection
        const rQuery = query(
          collection(db, "forum", threadId, "replies"),
          orderBy("createdAt", "asc")
        );
        const rSnap = await getDocs(rQuery);
        setReplies(rSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        setSnack({
          open: true,
          message: "Failed to load thread.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [threadId]);

  // post new reply
  const handleReply = async () => {
    if (!user) {
      setSnack({
        open: true,
        message: "Log in to reply.",
        severity: "warning",
      });
      return;
    }
    setReplyLoading(true);
    try {
      const ref = await addDoc(collection(db, "forum", threadId, "replies"), {
        uid: user.uid,
        name: user.displayName,
        photoURL: user.photoURL,
        text: replyText,
        createdAt: serverTimestamp(),
      });
      setReplies((r) => [
        ...r,
        {
          id: ref.id,
          uid: user.uid,
          name: user.displayName,
          photoURL: user.photoURL,
          text: replyText,
          createdAt: { toDate: () => new Date() },
        },
      ]);
      setReplyText("");
      setSnack({ open: true, message: "Reply posted!", severity: "success" });
    } catch {
      setSnack({ open: true, message: "Failed to post.", severity: "error" });
    } finally {
      setReplyLoading(false);
    }
  };

  // open edit dialog
  const onEditClick = (r) => {
    setEditId(r.id);
    setEditText(r.text);
    setOpenEdit(true);
  };
  // save edit
  const handleEditSave = async () => {
    try {
      await updateDoc(doc(db, "forum", threadId, "replies", editId), {
        text: editText,
      });
      setReplies((rs) =>
        rs.map((r) => (r.id === editId ? { ...r, text: editText } : r))
      );
      setSnack({ open: true, message: "Reply updated.", severity: "success" });
      setOpenEdit(false);
    } catch {
      setSnack({ open: true, message: "Update failed.", severity: "error" });
    }
  };

  // open delete dialog
  const onDeleteClick = (r) => {
    setDeleteId(r.id);
    setOpenDelete(true);
  };
  // confirm delete
  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "forum", threadId, "replies", deleteId));
      setReplies((rs) => rs.filter((r) => r.id !== deleteId));
      setSnack({ open: true, message: "Reply deleted.", severity: "success" });
    } catch {
      setSnack({ open: true, message: "Delete failed.", severity: "error" });
    } finally {
      setOpenDelete(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!thread) {
    return (
      <Container sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="h6">Thread not found.</Typography>
        <Button onClick={() => navigate("/forum")} sx={{ mt: 2 }}>
          ← Back to Forum
        </Button>
      </Container>
    );
  }

  const created = thread.createdAt?.toDate() || new Date();

  return (
    <Container sx={{ py: 4 }}>
      {/* Back + logo */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate("/forum")}>
          <ArrowBackIcon />
        </IconButton>
        <Box
          component="img"
          src="/dulogo.png"
          alt="DU Logo"
          sx={{ width: 32, height: 32, mx: 1, cursor: "pointer" }}
          onClick={() => navigate("/forum")}
        />
        <Typography variant="h4">{thread.title}</Typography>
      </Box>

      {/* thread metadata & body */}
      <Box sx={{ mb: 2 }}>
        <Typography color="text.secondary" variant="caption">
          {thread.category} • {created.toLocaleDateString()}{" "}
          {created.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
        <Typography sx={{ mt: 1 }}>{thread.body}</Typography>
      </Box>

      {/* display thread images if any */}
      {Array.isArray(thread.imageURLs) && thread.imageURLs.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            my: 2,
          }}
        >
          {thread.imageURLs.map((url, i) => (
            <Box
              key={i}
              component="img"
              src={url}
              alt={`thread-img-${i}`}
              sx={{
                maxWidth: 200,
                maxHeight: 200,
                objectFit: "cover",
                borderRadius: 1,
              }}
            />
          ))}
        </Box>
      )}

      {/* replies */}
      <Typography variant="h6" gutterBottom>
        Replies
      </Typography>
      <List>
        {replies.map((r) => {
          const time = r.createdAt?.toDate() || new Date();
          return (
            <ListItem
              key={r.id}
              alignItems="flex-start"
              secondaryAction={
                r.uid === user?.uid && (
                  <>
                    <IconButton edge="end" onClick={() => onEditClick(r)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => onDeleteClick(r)}>
                      <DeleteIcon />
                    </IconButton>
                  </>
                )
              }
            >
              <ListItemAvatar>
                <Avatar src={r.photoURL} />
              </ListItemAvatar>
              <ListItemText
                primary={r.name}
                secondary={
                  <>
                    <Typography variant="body2">{r.text}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {time.toLocaleString()}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          );
        })}
      </List>

      {/* new reply */}
      <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
        <TextField
          label="Write a reply…"
          multiline
          rows={3}
          fullWidth
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
        />
        <Box sx={{ position: "relative" }}>
          <Button
            variant="contained"
            onClick={handleReply}
            disabled={replyLoading || !replyText.trim()}
          >
            Post
          </Button>
          {replyLoading && (
            <CircularProgress
              size={24}
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
              }}
            />
          )}
        </Box>
      </Box>

      {/* Edit Reply Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth>
        <DialogTitle>Edit Your Reply</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Reply"
            fullWidth
            multiline
            rows={4}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Reply Dialog */}
      <Dialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        maxWidth="xs"
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete this reply? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
