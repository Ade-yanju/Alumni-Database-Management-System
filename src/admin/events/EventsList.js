// src/admin/events/EventsList.js
import React, { useState, useEffect } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { ArrowBackIos, Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  getCountFromServer,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { format } from "date-fns";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

export default function EventsList() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("upcoming");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editData, setEditData] = useState({
    id: null,
    title: "",
    date: null,
    location: "",
    description: "",
  });

  // Real-time listener for events + RSVP counts
  useEffect(() => {
    setLoading(true);
    const nowTs = Timestamp.fromDate(new Date());
    const op = filter === "upcoming" ? ">=" : "<";
    const ord = filter === "upcoming" ? "asc" : "desc";

    const q = query(
      collection(db, "events"),
      where("date", op, nowTs),
      orderBy("date", ord)
    );

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const list = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            // convert Firestore Timestamp → JS Date or null
            const dt = data.date?.toDate?.() ?? null;
            // get RSVP count
            const countSnap = await getCountFromServer(
              collection(db, "events", d.id, "rsvps")
            );
            return {
              id: d.id,
              title: data.title || "",
              location: data.location || "",
              date: dt,
              description: data.description || "",
              rsvpCount: countSnap.data().count,
            };
          })
        );
        setRows(list);
        setLoading(false);
      },
      (err) => {
        console.error("EventsList:onSnapshot", err);
        setRows([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [filter]);

  // Delete helper
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "events", id));
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  // Open & load edit modal
  const openEditModal = async (id) => {
    setEditLoading(true);
    try {
      if (id) {
        const snap = await getDoc(doc(db, "events", id));
        if (!snap.exists()) throw new Error("Not found");
        const d = snap.data();
        setEditData({
          id,
          title: d.title || "",
          date: d.date?.toDate?.() ?? null,
          location: d.location || "",
          description: d.description || "",
        });
      } else {
        // blank for new
        setEditData({
          id: null,
          title: "",
          date: null,
          location: "",
          description: "",
        });
      }
      setEditOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setEditLoading(false);
    }
  };

  // Save edits
  const handleSaveEdit = async () => {
    const { id, title, date, location, description } = editData;
    setEditLoading(true);
    try {
      const payload = {
        title,
        location,
        description,
        date: Timestamp.fromDate(date),
        updatedAt: Timestamp.now(),
      };
      if (id) {
        await updateDoc(doc(db, "events", id), payload);
      } else {
        await db.collection("events").add({
          ...payload,
          createdAt: Timestamp.now(),
        });
      }
      setEditOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  const columns = [
    {
      field: "date",
      headerName: "Date & Time",
      width: 200,
      type: "dateTime",
      // no custom valueGetter—DataGrid will read row.date itself
      valueFormatter: ({ value }) =>
        value instanceof Date ? format(value, "PPpp") : "",
    },
    { field: "title", headerName: "Title", flex: 1 },
    { field: "location", headerName: "Location", flex: 1 },
    { field: "rsvpCount", headerName: "RSVPs", width: 120 },
    {
      field: "actions",
      headerName: "Actions",
      width: 240,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button size="small" onClick={() => openEditModal(row.id)}>
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/admin/dashboard")}
          >
            <ArrowBackIos />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            Event Management
          </Typography>
          <Button
            color="inherit"
            startIcon={<Add />}
            onClick={() => openEditModal(null)}
          >
            Add Event
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <FormControl>
            <InputLabel>Show</InputLabel>
            <Select
              label="Show"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="upcoming">Upcoming</MenuItem>
              <MenuItem value="past">Past</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            pageSize={10}
            rowsPerPageOptions={[10, 20]}
            disableSelectionOnClick
          />
        )}
      </Container>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editData.id ? "Edit Event" : "Add Event"}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
        >
          {editLoading ? (
            <CircularProgress />
          ) : (
            <>
              <TextField
                label="Title"
                fullWidth
                value={editData.title}
                onChange={(e) =>
                  setEditData((d) => ({ ...d, title: e.target.value }))
                }
              />
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Date & Time"
                  value={editData.date}
                  onChange={(d) => setEditData((s) => ({ ...s, date: d }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
              <TextField
                label="Location"
                fullWidth
                value={editData.location}
                onChange={(e) =>
                  setEditData((d) => ({ ...d, location: e.target.value }))
                }
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={editData.description}
                onChange={(e) =>
                  setEditData((d) => ({ ...d, description: e.target.value }))
                }
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={editLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={editLoading}
          >
            {editLoading ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
