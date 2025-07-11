// src/pages/forum/ForumList.js
import React, { useEffect, useState } from "react";
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  ArrowBackIosNew as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../services/firebase";

export default function ForumList() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userUid, setUserUid] = useState(null);
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // edit modal
  const [openEdit, setOpenEdit] = useState(false);
  const [editThread, setEditThread] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    category: "",
    body: "",
  });

  // delete confirmation modal
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteThreadId, setDeleteThreadId] = useState(null);

  // fetch current user UID
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUserUid(user?.uid || null);
    });
  }, [auth]);

  // load threads
  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, "forum"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setThreads(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        setSnack({
          open: true,
          message: "Failed to load discussions.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDeleteConfirm = (threadId) => {
    setDeleteThreadId(threadId);
    setOpenDelete(true);
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "forum", deleteThreadId));
      setThreads((ts) => ts.filter((t) => t.id !== deleteThreadId));
      setSnack({
        open: true,
        message: "Discussion deleted.",
        severity: "success",
      });
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Delete failed.", severity: "error" });
    } finally {
      setOpenDelete(false);
      setDeleteThreadId(null);
    }
  };

  const openEditModal = (thread) => {
    setEditThread(thread);
    setEditData({
      title: thread.title,
      category: thread.category,
      body: thread.body,
    });
    setOpenEdit(true);
  };

  const handleEditSave = async () => {
    try {
      const ref = doc(db, "forum", editThread.id);
      await updateDoc(ref, {
        title: editData.title,
        category: editData.category,
        body: editData.body,
      });
      setThreads((ts) =>
        ts.map((t) => (t.id === editThread.id ? { ...t, ...editData } : t))
      );
      setSnack({
        open: true,
        message: "Discussion updated.",
        severity: "success",
      });
      setOpenEdit(false);
      setEditThread(null);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Update failed.", severity: "error" });
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      {/* Header */}
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
        <Typography variant="h4">Forum Discussions</Typography>
      </Box>

      <Grid container spacing={3}>
        {threads.map((t) => {
          const date = t.createdAt?.toDate() || new Date();
          return (
            <Grid item xs={12} md={6} key={t.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6">{t.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t.category} • {date.toLocaleDateString()}{" "}
                    {date.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                  <Typography sx={{ mt: 1 }} noWrap>
                    {t.body}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/forum/${t.id}`)}
                  >
                    View Thread
                  </Button>
                  {t.uid === userUid && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => openEditModal(t)}
                        color="primary"
                        aria-label="edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteConfirm(t.id)}
                        color="error"
                        aria-label="delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Box sx={{ textAlign: "right", mt: 3 }}>
        <Button variant="contained" onClick={() => navigate("/forum/new")}>
          + New Discussion
        </Button>
      </Box>

      {/* Edit Discussion Modal */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Discussion</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={editData.title}
            onChange={(e) =>
              setEditData((d) => ({ ...d, title: e.target.value }))
            }
          />
          <TextField
            label="Category"
            fullWidth
            margin="normal"
            value={editData.category}
            onChange={(e) =>
              setEditData((d) => ({ ...d, category: e.target.value }))
            }
          />
          <TextField
            label="Body"
            fullWidth
            margin="normal"
            multiline
            rows={4}
            value={editData.body}
            onChange={(e) =>
              setEditData((d) => ({ ...d, body: e.target.value }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to delete this discussion? This cannot be
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
