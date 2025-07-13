// src/admin/news/NewsListAdmin.js
import React, { useState, useEffect } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBackIos,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import NewsFormAdmin from "./NewsForm"; // your form component

export default function NewsListAdmin() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [viewItem, setViewItem] = useState(null);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // load all news
  const loadNews = async () => {
    setLoading(true);
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => {
    loadNews();
  }, []);

  const handleDelete = async () => {
    await deleteDoc(doc(db, "news", deleteId));
    setDeleteId(null);
    await loadNews();
  };

  return (
    <Box>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          {/* Logo */}
          <IconButton
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
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            News & Announcements
          </Typography>
          <Button color="inherit" onClick={() => navigate("/admin/news/new")}>
            + New
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Typography>No announcements yet.</Typography>
        ) : (
          <List>
            {items.map((n) => (
              <ListItem
                key={n.id}
                divider
                secondaryAction={
                  <>
                    {/* View */}
                    <IconButton onClick={() => setViewItem(n)}>
                      <ViewIcon />
                    </IconButton>
                    {/* Edit (✏️) */}
                    <IconButton onClick={() => setEditId(n.id)}>
                      <EditIcon />
                    </IconButton>
                    {/* Delete */}
                    <IconButton onClick={() => setDeleteId(n.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={n.headline}
                  secondary={n.createdAt?.toDate().toLocaleDateString()}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Container>

      {/* View Dialog */}
      <Dialog
        open={Boolean(viewItem)}
        onClose={() => setViewItem(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{viewItem?.headline}</DialogTitle>
        <DialogContent dividers>
          {viewItem?.imageURL && (
            <Box
              component="img"
              src={viewItem.imageURL}
              alt=""
              sx={{ width: "100%", mb: 2, borderRadius: 1 }}
            />
          )}
          <Typography sx={{ whiteSpace: "pre-line" }}>
            {viewItem?.body}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewItem(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={Boolean(editId)}
        onClose={() => setEditId(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Announcement</DialogTitle>
        <DialogContent dividers>
          {/* Pass the `newsId` so the form loads existing data */}
          {editId && (
            <NewsFormAdmin
              newsId={editId}
              onDone={async () => {
                setEditId(null);
                await loadNews();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Announcement?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
